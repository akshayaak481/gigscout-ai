import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#060813',
};

export const metadata: Metadata = {
  title: 'GigScout AI — Agentic Freelance Opportunity & Risk Intelligence Platform',
  description: 'AI multi-agent intelligence platform for students, freelancers, and creators. Autonomous gig discovery, RAG portfolio matching, scam detection, and personalized pitch crafting.',
  keywords: [
    'GigScout AI',
    'Agentic Freelance Intelligence',
    'LangGraph AI Agents',
    'Freelance Scam Detection',
    'RAG Resume Matching',
    'Upwork Freelancer Finder',
  ],
  authors: [{ name: 'GigScout AI Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#060813] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 font-sans">
        {children}
      </body>
    </html>
  );
}
