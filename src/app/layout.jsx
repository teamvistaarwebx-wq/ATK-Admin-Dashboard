import { Newsreader, Nunito } from "next/font/google";
import "@/styles/globals.css";

/**
 * The variable names deliberately avoid `--font-*`: globals.css maps these
 * into Tailwind theme keys called `--font-newsreader` / `--font-nunito`, and a
 * key cannot reference a variable of its own name.
 */
const newsreader = Newsreader({
  variable: "--newsreader",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--nunito",
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
    <html
      lang="en"
      className={`${newsreader.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
