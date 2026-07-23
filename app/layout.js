import "./globals.css";
import Providers from "../components/Providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "Vexiro — Marketplace Gamer",
  description:
    "Vexiro é o marketplace para comprar e vender produtos digitais de jogos como Free Fire, Roblox, Minecraft, Fortnite e Valorant, com pagamento via PIX e entrega automática.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#050510] text-[#E9E9F5]">
        <Providers>
          <Navbar />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
