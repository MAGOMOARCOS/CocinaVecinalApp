#!/usr/bin/env python3
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
import urllib.request
import urllib.error

GITHUB_API = "https://api.github.com"

def _clean_secret(s: Optional[str], name: str) -> str:
    s = (s or "").replace("\r", "").replace("\n", "").strip()
    if not s:
        raise RuntimeError(f"{name} is missing/empty")
    return s

def _req(method: str, url: str, token: str, data: Optional[Dict]=None,
         accept: str="application/vnd.github+json") -> Any:
    token = _clean_secret(token, "GH_PAT")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": accept,
        "User-Agent": "cv-autocontroller",
        "X-GitHub-Api-Version": "2022-11-28",
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
    api_key = _clean_secret(api_key, "OPENAI_API_KEY")
    url = "https://api.openai.com/v1/responses"

    def call(m: str) -> str:
        payload = {"model": m, "input": input_text}
        data = json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        req = urllib.request.Request(url, method="POST", headers=headers, data=data)
        with urllib.request.urlopen(req) as resp:
            obj = json.loads(resp.read().decode("utf-8"))
        txt = obj.get("output_text")
        if txt:
            return txt
        out = obj.get("output", [])
        parts = []
        for item in out:
            for c in item.get("content", []):
                if c.get("type") == "output_text":
                    parts.append(c.get("text", ""))
        return "\n".join(parts).strip()

    # intento 1: modelo pedido; si falla por modelo no disponible, fallback a gpt-4o-mini
    try:
        return call(model).strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        if e.code in (400, 404) and ("model" in body.lower() or "not_found" in body.lower()):
            return call("gpt-4o-mini").strip()
        raise

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
    return tuple(repo.split("/",1))

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

def last_agent_activity(ctx: Ctx):
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
    return any(r.get("status") in ("in_progress","queued") for r in runs)

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
        patch = f.get("patch","") or ""
        patch_snip = "\n".join(patch.splitlines()[:60]) if patch else ""
        lines.append(f"- {fn} [{status}] (+{adds}/-{dels})")
        if patch_snip:
            lines.append("```diff")
            lines.append(patch_snip)
            lines.append("```")
    if len(files) > max_files:
        lines.append(f"...({len(files)-max_files} files more)")
    return "\n".join(lines).strip()

def build_input(issue: Dict, comments: List[Dict], pr: Optional[Dict], pr_diff: str, last_agent_run: Optional[Dict]) -> str:
    issue_title = issue.get("title","")
    issue_body = issue.get("body","") or ""
    last_comments = comments[-6:] if comments else []
    convo = []
    for c in last_comments:
        who = c.get("user",{}).get("login","")
        body = (c.get("body","") or "")[:4000]
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
- Output ONLY the instruction body (plain text), no commentary.
- The instruction must start with: full
- Then a numbered plan (max 8 steps).
- Include exact file paths to edit/create.
- If there is an open PR, focus on finishing/adjusting that PR (or the next small PR).
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

    gh_pat = _clean_secret(os.environ.get("GH_PAT"), "GH_PAT")
    openai_key = _clean_secret(os.environ.get("OPENAI_API_KEY"), "OPENAI_API_KEY")

    ctx = Ctx(
        owner=owner,
        repo=repo,
        issue_number=int(os.environ.get("ISSUE_NUMBER","2")),
        gh_pat=gh_pat,
        openai_key=openai_key,
        openai_model=os.environ.get("OPENAI_MODEL","gpt-4o-mini"),
        agent_workflow_file=os.environ.get("AGENT_WORKFLOW_FILE","agent.yml"),
        min_interval_minutes=int(os.environ.get("MIN_INTERVAL_MINUTES","12")),
        max_comments=int(os.environ.get("MAX_COMMENTS","18")),
    )

    issue = get_issue(ctx)
    comments = list_issue_comments(ctx)

    if len(comments) >= ctx.max_comments:
        print(f"Max comments reached ({len(comments)}). Exiting.")
        return

    last_run, last_dt = last_agent_activity(ctx)
    if last_dt and (now_utc() - last_dt < timedelta(minutes=ctx.min_interval_minutes)):
        print("Cooldown not met. Exiting.")
        return

    if agent_in_progress(ctx):
        print("Agent workflow in progress. Exiting.")
        return

    pulls = list_pulls(ctx)
    pr = None
    pr_diff = "(no open PR)"
    if pulls:
        pulls.sort(key=lambda x: x.get("updated_at",""), reverse=True)
        pr = pulls[0]
        files = get_pull_files(ctx, pr["number"])
        pr_diff = summarize_pr_diff(files)

    prompt = build_input(issue, comments, pr, pr_diff, last_run)
    plan = _openai_responses(ctx.openai_model, ctx.openai_key, prompt).strip()
    if not plan:
        print("Empty plan. Exiting.")
        return

    body = f"/agent {plan}"
    post_issue_comment(ctx, body)

    try:
        dispatch_workflow(ctx, ctx.agent_workflow_file)
    except Exception as e:
        print("Dispatch failed (may be OK):", e)

if __name__ == "__main__":
    main()
