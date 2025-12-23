// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "My Next.js App",
  description: "A default Next.js layout",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
