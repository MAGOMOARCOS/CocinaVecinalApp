export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-4 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
        <div>Cocina Vecinal · Comida casera entre vecinos</div>
        <div className="flex gap-3">
          <a className="hover:text-neutral-900" href="mailto:info@cocinavecinal.com">
            Contacto
          </a>
          <a className="hover:text-neutral-900" href="/privacy">
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
