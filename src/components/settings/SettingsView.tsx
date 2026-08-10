'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Database, 
  Bot, 
  Activity, 
  ShieldCheck, 
  Save, 
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function SettingsView() {
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
    });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            System &amp; Agent Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure agent LLM providers, Supabase pgvector endpoints, Tavily crawler keys, and LangSmith tracing.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved Successfully!' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* LLM & Model Selection */}
        <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            Agent LLM &amp; Embeddings Provider
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">Orchestrator Model</label>
              <select className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono">
                <option value="gpt-4o">OpenAI GPT-4o (Default / High Accuracy)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini (High Speed)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">RAG Embeddings Model</label>
              <select className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono">
                <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536d)</option>
                <option value="text-embedding-3-large">OpenAI text-embedding-3-large (3072d)</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Credentials */}
        <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              API Credentials &amp; Connectors
            </h3>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKeys ? 'Hide Keys' : 'Reveal Keys'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">OPENAI_API_KEY</label>
              <input
                type={showKeys ? 'text' : 'password'}
                defaultValue="sk-proj-live-mock-key-gigscout-ai"
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">TAVILY_API_KEY (Web Search Crawl)</label>
              <input
                type={showKeys ? 'text' : 'password'}
                defaultValue="tvly-live-scout-mock-token"
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">NEXT_PUBLIC_SUPABASE_URL</label>
                <input
                  type="text"
                  defaultValue="https://gigscout-ai.supabase.co"
                  className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  defaultValue="eyJh...supabase-anon-key"
                  className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Observability & LangSmith */}
        <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            LangSmith Tracing &amp; Evaluation
          </h3>
          <p className="text-xs text-slate-400">
            Real-time step-by-step trace telemetry is enabled under project <code className="text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded font-mono">gigscout-ai</code>.
          </p>
        </div>

      </div>

    </div>
  );
}
