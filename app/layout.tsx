import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cocina Vecinal",
  description: "Build limpio en Vercel (luego funcionalidades)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
          <header style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 44, margin: 0 }}>Cocina Vecinal</h1>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Build limpio en Vercel ✅ (luego funcionalidades)
            </p>
            <nav style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <Link href="/">Home</Link>
              <Link href="/explorar">Explorar</Link>
              <Link href="/perfil">Perfil</Link>
            </nav>
            <hr style={{ marginTop: 16 }} />
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
