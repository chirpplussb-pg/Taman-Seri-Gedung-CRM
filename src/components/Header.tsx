/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Home, Database, PhoneCall, FileText, Download, Upload, Sparkles, LogIn, LogOut, User as UserIcon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Property } from '../types/property';
import { QuickSearchDossierBar } from './QuickSearchDossierBar';

interface HeaderProps {
  currentTab: 'registry' | 'crm' | 'schema';
  onSelectTab: (tab: 'registry' | 'crm' | 'schema') => void;
  onOpenNewInteraction: () => void;
  onOpenSchemaModal: () => void;
  onOpenChatbot: () => void;
  onOpenDossier: (property: Property) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewInteraction,
  onOpenSchemaModal,
  onOpenChatbot,
  onOpenDossier,
}) => {
  const { user, signInWithGoogle, signOut } = useAuth();

  // Sync authenticated user to Cloud SQL database
  useEffect(() => {
    if (user) {
      fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
        }),
      }).catch((err) => console.warn('Could not sync user to Cloud SQL:', err));
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              SG
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('registry');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-slate-800 transition-colors"
            >
              Taman Seri Gedung
            </a>
          </div>

          {/* Zone 2: Navigation tabs */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 shrink-0">
            <button
              onClick={() => onSelectTab('registry')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                currentTab === 'registry'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Master Property Registry
            </button>
            <button
              onClick={() => onSelectTab('crm')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                currentTab === 'crm'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Outreach CRM & Logs
            </button>
            <button
              onClick={onOpenSchemaModal}
              className="text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent cursor-pointer"
            >
              Cloud SQL & CSV Tools
            </button>
          </nav>

          {/* Header Quick Search (visible on large screens) */}
          <div className="hidden lg:block w-72 xl:w-80">
            <QuickSearchDossierBar onOpenDossier={onOpenDossier} />
          </div>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Gemini AI Advisor Button */}
            <button
              onClick={onOpenChatbot}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open Gemini Legal & Field Advisor with Search and Maps Grounding"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">AI Legal Advisor</span>
            </button>

            {/* Log Outreach Button */}
            <button
              onClick={onOpenNewInteraction}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Outreach</span>
            </button>

            {/* Google Firebase Auth user button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title={`Sign out (${user.email})`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Sign in with Google via Firebase Auth"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
