import { Inter } from "next/font/google";
import "@/styles/globals.css";

/**
 * One sans face for the whole admin. Dense tables and figures read better in
 * Inter than in a display serif, and it is close to what Shopify's own admin
 * ships. The variable avoids `--font-*` so globals.css can map it into the
 * Tailwind `--font-sans` key without referencing itself.
 */
const inter = Inter({
  variable: "--inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "AKT Gifting Admin",
  description: "Catalogue, inventory, banners and orders for Atulya Karigari.",
  icons: {
    icon: "/images/icon/ATK-New-logos_1.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
