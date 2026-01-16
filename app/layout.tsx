
import "./globals.css";

export const metadata = {
  title: "Cocina Vecinal",
  description: "MVP — build limpio primero"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
