import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraMail AI — Executive Email Triage & Categorization",
  description:
    "Production-ready AI email triage assistant. Automatically fetch, classify, and summarize daily unread Gmail messages with Google Gemini Flash & Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Subtle ambient background glow */}
          <div className="absolute -top-40 left-1/4 h-[500px] w-[600px] rounded-full bg-indigo-600/10 blur-[130px]" />
          <div className="absolute top-1/2 right-10 h-[450px] w-[500px] rounded-full bg-violet-600/10 blur-[140px]" />
          <div className="absolute bottom-10 left-1/3 h-[400px] w-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
