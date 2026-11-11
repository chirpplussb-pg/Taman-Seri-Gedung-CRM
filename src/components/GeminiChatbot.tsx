/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../types/property';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Search,
  MapPin,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  X,
  Scale,
  Building,
  HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchEntryPoint?: { renderedContent: string };
    groundingChunks?: Array<{
      web?: { uri: string; title: string };
      maps?: { uri: string; title: string; address?: string };
    }>;
  };
}

interface GeminiChatbotProps {
  currentProperty?: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentProperty,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Selamat Sejahtera! I am your **Taman Seri Gedung Legal & Field Intelligence Advisor** powered by Gemini.

I can assist you with:
- **Malaysian Land Law & KTN**: Executing Memorandum of Transfer (Borang 14A), master title regularization, and developer liquidation rights.
- **Estate Administration**: Probate, Letters of Administration (Surat Kuasa Mentadbir), and Small Estates Act (Pusaka Kecil) procedures for 1988 purchasers.
- **MPSPK Cukai Pintu**: Assessment tax arrears appeals, waiver guidelines, and municipal clearance.
- **Real-Time Search & Maps Grounding**: Up-to-date Land Office (PTG) policies and directions to Sungai Petani authorities.

How can I assist your outreach or legal regularization today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps' | 'auto'>('search');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
          groundingType: groundingMode,
          propertyContext: currentProperty || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const data = await response.json();

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.text || 'No response returned from model.',
        timestamp: new Date().toISOString(),
        groundingMetadata: data.groundingMetadata,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Failed to get Gemini response:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error: Unable to connect to Gemini API (${err.message}). Please check API key configuration.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Gedung AI Legal Advisor</h2>
            </div>
            <p className="text-[11px] text-slate-300">
              Gemini + Google Search & Maps Grounding
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode & Grounding Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between gap-2 text-xs shrink-0">
        {/* Model selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-[11px] font-medium bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (General & Grounding)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Queries)</option>
            <option value="gemini-4-carbon">gemini-4-carbon (Deep Legal Reasoning)</option>
            <option value="gemini-4-argon">gemini-4-argon (Complex Interactive)</option>
          </select>
        </div>

        {/* Grounding Mode */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setGroundingMode('search')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              groundingMode === 'search'
                ? 'bg-blue-100 text-blue-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Google Search Grounding"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGroundingMode('maps')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              groundingMode === 'maps'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Google Maps Grounding"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Property Context Banner if active */}
      {currentProperty && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-1.5 text-[11px] text-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">
              Analyzing Unit #{currentProperty.house_no} (Lot {currentProperty.cadastral_lot_no})
            </span>
          </div>
          <span className="font-semibold">{currentProperty.site_condition}</span>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-2 ${
              m.role === 'user'
                ? 'bg-slate-900 text-white rounded-tr-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {m.content}
              </div>

              {/* Grounding metadata display */}
              {m.groundingMetadata?.webSearchQueries && m.groundingMetadata.webSearchQueries.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 text-[10px] space-y-1">
                  <div className="font-bold text-slate-500 flex items-center gap-1">
                    <Search className="w-3 h-3 text-blue-500" />
                    <span>Search Grounding Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {m.groundingMetadata.webSearchQueries.map((q, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        "{q}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounding Web / Maps Chunks */}
              {m.groundingMetadata?.groundingChunks && m.groundingMetadata.groundingChunks.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                  {m.groundingMetadata.groundingChunks.slice(0, 3).map((chunk, idx) => {
                    const item = chunk.web || chunk.maps;
                    if (!item) return null;
                    return (
                      <a
                        key={idx}
                        href={item.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-blue-700 hover:underline"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[150px]">{item.title}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic py-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Consulting Malaysian land statutes & legal references...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="p-2 bg-slate-50 border-t border-slate-200 overflow-x-auto flex gap-1.5 shrink-0">
        {[
          'How to execute Borang 14A for deceased buyer?',
          'MPSPK cukai pintu arrears appeal process',
          'Pejabat Tanah Kuala Muda location & hours',
          'Surat Kuasa Mentadbir requirements',
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-slate-400 rounded-md text-slate-700 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about land law, Borang 14A, waris probate, or MPSPK..."
            className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
