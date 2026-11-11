/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, User, Phone, CreditCard, ArrowRight, CornerDownLeft, Sparkles, MapPin } from 'lucide-react';
import { Property, QuickSearchResult } from '../types/property';
import { PropertyStorageService } from '../services/propertyStorage';

interface QuickSearchDossierBarProps {
  onOpenDossier: (property: Property) => void;
  className?: string;
  autoFocus?: boolean;
}

export const QuickSearchDossierBar: React.FC<QuickSearchDossierBarProps> = ({
  onOpenDossier,
  className = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search results on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const matched = PropertyStorageService.quickSearch(query, 7);
    setResults(matched);
    setSelectedIndex(0);
    setIsOpen(true);
  }, [query]);

  const handleSelectProperty = (property: Property) => {
    onOpenDossier(property);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelectProperty(results[selectedIndex].property);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getMatchIcon = (field: QuickSearchResult['matchedField']) => {
    switch (field) {
      case 'lot_no':
        return <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'name':
        return <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'nric':
        return <CreditCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'telephone':
        return <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'house_no':
        return <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
      default:
        return <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder="Instant Dossier Search: Type Lot No, Name, MyKad NRIC, Phone, or House No..."
          className="w-full pl-10 pr-24 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md select-none">
              <kbd className="font-mono">⌘</kbd>K
            </span>
          )}
        </div>
      </div>

      {/* Instant Dropdown Preview */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header summary */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              {results.length > 0
                ? `Found ${results.length} matching unit${results.length > 1 ? 's' : ''} for "${query}"`
                : `No property found matching "${query}"`}
            </span>
            {results.length > 0 && (
              <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
                Press <CornerDownLeft className="w-3 h-3 inline text-slate-500" /> to open dossier
              </span>
            )}
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {results.map((res, index) => {
                const p = res.property;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProperty(p)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-50 text-slate-900' : 'hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {/* Top row: House No, Street, Lot Badge */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-900 text-sm">
                          No. {p.house_no}
                        </span>
                        <span className="text-xs text-slate-500">
                          {p.street_name}
                        </span>
                        <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          {p.cadastral_lot_no}
                        </span>
                        {p.lot_no_dev && (
                          <span className="text-[11px] text-slate-500">
                            (Dev Plot {p.lot_no_dev})
                          </span>
                        )}
                        {p.site_condition === 'Abandon' ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                            Abandoned
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                            {p.site_condition}
                          </span>
                        )}
                      </div>

                      {/* Middle row: Owner Name */}
                      <div className="text-xs text-slate-700 font-medium truncate flex items-center gap-1.5 mb-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.buyer_primary}</span>
                        {p.buyer_secondary && (
                          <span className="text-slate-400 text-[11px] truncate">
                            · Waris: {p.buyer_secondary}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Matched Detail Indicator */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                          {getMatchIcon(res.matchedField)}
                          <span>
                            {res.matchedLabel}: <strong className="font-semibold">{res.matchedValue}</strong>
                          </span>
                        </div>

                        {/* Outreach status badge */}
                        <span className="text-[11px] text-slate-500 font-medium">
                          Status: {p.tracing_status}
                        </span>
                      </div>
                    </div>

                    {/* Open Dossier Action Button */}
                    <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <span>Open Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No matching property found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching by Cadastral Lot (e.g. "3865" or "Lot 3865"), Buyer Name (e.g. "Azman"), 12-digit MyKad NRIC, or 10-digit Phone number.
              </p>
            </div>
          )}

          {/* Quick tips footer */}
          <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Taman Seri Gedung (637 Units)</span>
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Open Dossier</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
