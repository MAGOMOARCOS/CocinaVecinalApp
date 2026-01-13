import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-300 text-base font-black text-neutral-900">
            CV
          </span>
          <span className="leading-tight">
            <span className="block text-sm text-neutral-600">Cocina</span>
            <span className="block text-base">Vecinal</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm text-neutral-700">
          <Link className="rounded-full px-3 py-1.5 hover:bg-neutral-100" href="/listings">
            Platos
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-neutral-100" href="/orders">
            Pedidos
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-neutral-100" href="/my">
            Mi cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
