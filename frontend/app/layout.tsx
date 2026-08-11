import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/UserProvider";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Nunito is the closest freely licensed match to Duolingo's Feather - same
 * rounded terminals and high x-height, which is most of what makes their
 * interface feel soft rather than corporate.
 */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Duolingo Clone - Learn Japanese",
  description: "Learn Japanese with the Duolingo Clone — lesson loop, streaks, hearts and XP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: `
          if (localStorage.getItem('duo:darkMode') === 'true') {
            document.documentElement.classList.add('dark');
          }
        `}} />
        <ToastProvider>
          <UserProvider>{children}</UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
