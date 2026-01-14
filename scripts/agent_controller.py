#!/usr/bin/env python3
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
import urllib.request

GITHUB_API = "https://api.github.com"

def _req(method: str, url: str, token: str, data: Optional[Dict]=None, accept: str="application/vnd.github+json") -> Any:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": accept,
        "User-Agent": "cv-autocontroller",
    }
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, method=method, headers=headers, data=body)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
        if not raw:
            return None
        return json.loads(raw.decode("utf-8"))

def _openai_responses(model: str, api_key: str, input_text: str) -> str:
    url = "https://api.openai.com/v1/responses"
    payload = {
        "model": model,
        "input": input_text,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, method="POST", headers=headers, data=data)
    with urllib.request.urlopen(req) as resp:
        obj = json.loads(resp.read().decode("utf-8"))
    # Responses API: output_text is easiest
    txt = obj.get("output_text")
    if txt:
        return txt
    # fallback: try to reconstruct
    out = obj.get("output", [])
    parts = []
    for item in out:
        for c in item.get("content", []):
            if c.get("type") == "output_text":
                parts.append(c.get("text", ""))
    return "\n".join(parts).strip()

@dataclass
class Ctx:
    owner: str
    repo: str
    issue_number: int
    gh_pat: str
    openai_key: str
    openai_model: str
    agent_workflow_file: str
    min_interval_minutes: int
    max_comments: int

def parse_repo() -> Tuple[str,str]:
    repo = os.environ.get("GITHUB_REPOSITORY","")
    if "/" not in repo:
        raise RuntimeError("GITHUB_REPOSITORY missing")
    return tuple(repo.split("/",1))  # owner, repo

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def get_issue(ctx: Ctx) -> Dict:
    return _req("GET", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/issues/{ctx.issue_number}", ctx.gh_pat)

def list_issue_comments(ctx: Ctx) -> List[Dict]:
    return _req("GET", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/issues/{ctx.issue_number}/comments?per_page=100", ctx.gh_pat)

def post_issue_comment(ctx: Ctx, body: str) -> None:
    _req("POST", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/issues/{ctx.issue_number}/comments", ctx.gh_pat, {"body": body})

def list_workflow_runs(ctx: Ctx, workflow_file: str, per_page: int=20) -> List[Dict]:
    r = _req("GET", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/actions/workflows/{workflow_file}/runs?per_page={per_page}", ctx.gh_pat)
    return r.get("workflow_runs", [])

def dispatch_workflow(ctx: Ctx, workflow_file: str) -> None:
    _req("POST", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/actions/workflows/{workflow_file}/dispatches", ctx.gh_pat, {
        "ref": "main"
    })

def last_agent_activity(ctx: Ctx) -> Tuple[Optional[Dict], Optional[datetime]]:
    runs = list_workflow_runs(ctx, ctx.agent_workflow_file, per_page=30)
    if not runs:
        return None, None
    runs.sort(key=lambda x: x.get("created_at",""), reverse=True)
    r0 = runs[0]
    t = r0.get("created_at")
    dt = datetime.fromisoformat(t.replace("Z","+00:00")) if t else None
    return r0, dt

def agent_in_progress(ctx: Ctx) -> bool:
    runs = list_workflow_runs(ctx, ctx.agent_workflow_file, per_page=10)
    for r in runs:
        if r.get("status") in ("in_progress","queued"):
            return True
    return False

def list_pulls(ctx: Ctx) -> List[Dict]:
    return _req("GET", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/pulls?state=open&per_page=50", ctx.gh_pat)

def get_pull_files(ctx: Ctx, pr_number: int) -> List[Dict]:
    return _req("GET", f"{GITHUB_API}/repos/{ctx.owner}/{ctx.repo}/pulls/{pr_number}/files?per_page=100", ctx.gh_pat)

def summarize_pr_diff(files: List[Dict], max_files: int=25) -> str:
    lines = []
    for f in files[:max_files]:
        fn = f.get("filename")
        status = f.get("status")
        adds = f.get("additions")
        dels = f.get("deletions")
        patch = f.get("patch","")
        patch_snip = ""
        if patch:
            patch_snip = "\n".join(patch.splitlines()[:60])
        lines.append(f"- {fn} [{status}] (+{adds}/-{dels})")
        if patch_snip:
            lines.append("```diff")
            lines.append(patch_snip)
            lines.append("```")
    if len(files) > max_files:
        lines.append(f"...({len(files)-max_files} files more)")
    return "\n".join(lines).strip()

def build_input(ctx: Ctx, issue: Dict, comments: List[Dict], pr: Optional[Dict], pr_diff: str, last_agent_run: Optional[Dict]) -> str:
    issue_title = issue.get("title","")
    issue_body = issue.get("body","") or ""
    last_comments = comments[-6:] if comments else []
    convo = []
    for c in last_comments:
        who = c.get("user",{}).get("login","")
        body = c.get("body","") or ""
        body = body[:4000]
        convo.append(f"[{who}]\n{body}\n")
    convo_txt = "\n".join(convo).strip()

    pr_txt = ""
    if pr:
        pr_txt = f"OPEN PR: #{pr.get('number')} {pr.get('title')}\nURL: {pr.get('html_url')}\n"

    last_run_txt = ""
    if last_agent_run:
        last_run_txt = f"Last agent run: {last_agent_run.get('html_url')} status={last_agent_run.get('status')} conclusion={last_agent_run.get('conclusion')}\n"

    return f"""
You are an autonomous controller that drives a GitHub repo forward by posting a single actionable /agent instruction as an issue comment.

Goal: implement and ship CocinaVecinalApp end-to-end (fix build, deploy, core features). Use the issue + latest PR diff as state.

Rules:
- Output ONLY the instruction body (plain text), no commentary, no JSON.
- The instruction must start with: full
- Then a numbered plan (max 8 steps).
- Include exact file paths to edit/create.
- If there is an open PR, your instruction should focus on finishing/adjusting that PR or creating the next incremental PR.
- Prefer small, mergeable changes that unblock build/deploy first.

Issue: {issue_title}
Issue body:
{issue_body}

Recent issue conversation:
{convo_txt}

{pr_txt}
{last_run_txt}

PR diff context:
{pr_diff}
""".strip()

def main():
    owner, repo = parse_repo()
    ctx = Ctx(
        owner=owner,
        repo=repo,
        issue_number=int(os.environ.get("ISSUE_NUMBER","2")),
        gh_pat=os.environ["GH_PAT"],
        openai_key=os.environ["OPENAI_API_KEY"],
        openai_model=os.environ.get("OPENAI_MODEL","gpt-5-mini"),
        agent_workflow_file=os.environ.get("AGENT_WORKFLOW_FILE","agent.yml"),
        min_interval_minutes=int(os.environ.get("MIN_INTERVAL_MINUTES","12")),
        max_comments=int(os.environ.get("MAX_COMMENTS","18")),
    )

    issue = get_issue(ctx)
    comments = list_issue_comments(ctx)

    # Stop if too many comments (safety)
    if len(comments) >= ctx.max_comments:
        print(f"Max comments reached ({len(comments)}). Exiting.")
        return

    # Cooldown
    last_run, last_dt = last_agent_activity(ctx)
    if last_dt:
        if now_utc() - last_dt < timedelta(minutes=ctx.min_interval_minutes):
            print("Cooldown not met. Exiting.")
            return

    if agent_in_progress(ctx):
        print("Agent workflow in progress. Exiting.")
        return

    # Latest open PR (if any)
    pulls = list_pulls(ctx)
    pr = None
    pr_diff = "(no open PR)"
    if pulls:
        # pick the most recently updated
        pulls.sort(key=lambda x: x.get("updated_at",""), reverse=True)
        pr = pulls[0]
        files = get_pull_files(ctx, pr["number"])
        pr_diff = summarize_pr_diff(files)

    prompt = build_input(ctx, issue, comments, pr, pr_diff, last_run)
    plan = _openai_responses(ctx.openai_model, ctx.openai_key, prompt).strip()
    if not plan:
        print("Empty plan. Exiting.")
        return

    controller_run_url = os.environ.get("GITHUB_SERVER_URL","https://github.com") + f"/{ctx.owner}/{ctx.repo}/actions"
    body = f"/agent {plan}\n\n---\nAutoController: {controller_run_url}"
    post_issue_comment(ctx, body)

    # Kick agent workflow via dispatch as well (belt & suspenders)
    try:
        dispatch_workflow(ctx, ctx.agent_workflow_file)
    except Exception as e:
        print("Dispatch failed (may be OK):", e)

if __name__ == "__main__":
    main()
