import React from 'react';
import { Bot, Shield, Terminal, Zap, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#060813] py-10 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-white font-mono">
                GigScout<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Agentic freelance intelligence platform orchestrating autonomous multi-agent pipelines for job discovery, portfolio-aware RAG matching, scam detection, and personalized proposal drafting.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                LangGraph Agents Active
              </span>
              <span>•</span>
              <span>Supabase Vector Enabled</span>
              <span>•</span>
              <span>Tavily Live Search</span>
            </div>
          </div>

          {/* Tech Stack Pillars */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs font-mono mb-3 uppercase tracking-wider text-cyan-400">
              Agentic Core
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                <Zap className="w-3 h-3 text-cyan-400" /> LangGraph State Graph
              </li>
              <li className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                <Shield className="w-3 h-3 text-emerald-400" /> Risk Sentinel Fraud Engine
              </li>
              <li className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                <Sparkles className="w-3 h-3 text-violet-400" /> Portfolio RAG Matcher
              </li>
              <li className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                <Terminal className="w-3 h-3 text-amber-400" /> LangSmith Tracing
              </li>
            </ul>
          </div>

          {/* Supported Platforms */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs font-mono mb-3 uppercase tracking-wider text-cyan-400">
              Discovered Channels
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Upwork Global</li>
              <li>• We Work Remotely</li>
              <li>• Reddit (r/forhire, r/freelance)</li>
              <li>• Freelancer.com</li>
              <li>• Direct Creator Inquiries</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} GigScout AI. Built for Freelancers, Creators & Students.</p>
          <p className="font-mono text-cyan-400/80">
            Engineered with Next.js • Supabase • OpenAI • LangGraph
          </p>
        </div>
      </div>
    </footer>
  );
}
