import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "PNWC Equipment Lending",
  description: "Hospital equipment lending management system for PNWC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
