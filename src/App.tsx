/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Property, InteractionLog, PropertyFilterState, TracingStatus } from './types/property';
import { PropertyStorageService } from './services/propertyStorage';
import { Header } from './components/Header';
import { MetricsRibbon } from './components/MetricsRibbon';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyTable } from './components/PropertyTable';
import { PropertyDossierModal } from './components/PropertyDossierModal';
import { InteractionLogModal } from './components/InteractionLogModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { CrmOutreachView } from './components/CrmOutreachView';
import { GeminiChatbot } from './components/GeminiChatbot';
import { QuickSearchDossierBar } from './components/QuickSearchDossierBar';
import { Building2, Search, FileSpreadsheet, Sparkles, MapPin, CheckCircle, MessageSquare } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'registry' | 'crm' | 'schema'>('registry');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Google Maps Quota state
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Chatbot State
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Filters State
  const [filter, setFilter] = useState<PropertyFilterState>({
    searchQuery: '',
    streetName: 'all',
    siteCondition: 'all',
    tracingStatus: 'all',
    hasGeran: 'all',
    hasArrears: 'all',
    loanProvider: 'all',
    sortBy: 'house_no',
    sortOrder: 'asc',
    page: 1,
    pageSize: 25,
  });

  // Modal States
  const [selectedPropertyForDossier, setSelectedPropertyForDossier] = useState<Property | null>(null);
  const [isNewInteractionOpen, setIsNewInteractionOpen] = useState(false);
  const [targetPropertyForInteraction, setTargetPropertyForInteraction] = useState<Property | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption?: string } | null>(null);

  // Listen for Google Maps Quota events
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Fetch metrics and filtered properties
  const metrics = useMemo(() => {
    return PropertyStorageService.getMetrics();
  }, [refreshTrigger]);

  const filteredResult = useMemo(() => {
    return PropertyStorageService.filterProperties(filter);
  }, [filter, refreshTrigger]);

  const allProperties = useMemo(() => {
    return PropertyStorageService.getProperties();
  }, [refreshTrigger]);

  // Handle URL hash on mount (e.g. #house-376)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#house-')) {
        const houseNo = hash.replace('#house-', '');
        const prop = PropertyStorageService.getPropertyByHouseNo(houseNo);
        if (prop) {
          setSelectedPropertyForDossier(prop);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [refreshTrigger]);

  // Handlers
  const handleOpenDossier = (prop: Property) => {
    setSelectedPropertyForDossier(prop);
    window.location.hash = `house-${prop.house_no}`;
  };

  const handleCloseDossier = () => {
    setSelectedPropertyForDossier(null);
    if (window.location.hash.startsWith('#house-')) {
      history.replaceState(null, '', ' ');
    }
  };

  const handleOpenNewInteraction = (prop?: Property) => {
    setTargetPropertyForInteraction(prop || null);
    setIsNewInteractionOpen(true);
  };

  const handleFilterChange = (updates: Partial<PropertyFilterState>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilter({
      searchQuery: '',
      streetName: 'all',
      siteCondition: 'all',
      tracingStatus: 'all',
      hasGeran: 'all',
      hasArrears: 'all',
      loanProvider: 'all',
      sortBy: 'house_no',
      sortOrder: 'asc',
      page: 1,
      pageSize: 25,
    });
  };

  const handleQuickUpdateStatus = (propertyId: string, status: TracingStatus) => {
    PropertyStorageService.updatePropertyTracingStatus(propertyId, status);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePropertyUpdated = (updated: Property) => {
    setSelectedPropertyForDossier(updated);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleInteractionAdded = (updatedProp: Property | null) => {
    if (updatedProp && selectedPropertyForDossier?.id === updatedProp.id) {
      setSelectedPropertyForDossier(updatedProp);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Google Maps Quota Defense Banner (CF mandatory notice) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-xs">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* 3-Zone Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'schema') {
            setIsSchemaModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenNewInteraction={() => handleOpenNewInteraction()}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenDossier={handleOpenDossier}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project Context Kicker */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Sungai Petani, Kedah · 1988 Housing Revitalization Project</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Taman Seri Gedung Landed Property Registry & CRM
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Unified database of 637 landed residential units across Jalan Seri Gedung 2 to 21. Integrated with Cloud SQL (PostgreSQL), Firebase Auth, Google Maps Platform™, and Gemini AI Legal Advisor with Search & Maps Grounding.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask AI Legal Advisor</span>
            </button>

            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Cloud SQL / CSV</span>
            </button>
          </div>
        </div>

        {/* Dedicated Instant Dossier Omnibar Search */}
        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Search className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Instant Lot Dossier Search</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live Omnibar
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Search any Cadastral Lot, 1988 Purchaser Name, MyKad NRIC, or Telephone to immediately open the dossier.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-700 text-[10px]">⌘K</kbd>
              <span>anywhere to focus</span>
            </div>
          </div>

          <QuickSearchDossierBar onOpenDossier={handleOpenDossier} />

          {/* Quick Try Sample Chips */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
            <span className="font-semibold text-slate-400 text-[11px] mr-1">Quick lookups:</span>
            <button
              onClick={() => {
                const prop = allProperties.find(p => p.cadastral_lot_no.includes('3865')) || allProperties[0];
                if (prop) handleOpenDossier(prop);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to open dossier for Lot 3865"
            >
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Lot 3865</span>
            </button>
            <button
              onClick={() => {
                const prop = allProperties.find(p => p.buyer_primary.toLowerCase().includes('azman')) || allProperties[1];
                if (prop) handleOpenDossier(prop);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to open dossier for Azman bin Razak"
            >
              <span>Name: Azman</span>
            </button>
            <button
              onClick={() => {
                const propWithIc = allProperties.find(p => p.ic_new && p.ic_new.length > 5) || allProperties[0];
                if (propWithIc) handleOpenDossier(propWithIc);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to open dossier by MyKad NRIC"
            >
              <span>Sample MyKad NRIC</span>
            </button>
            <button
              onClick={() => {
                const propWithTel = allProperties.find(p => p.tel_mobile && p.tel_mobile.length > 5) || allProperties[0];
                if (propWithTel) handleOpenDossier(propWithTel);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to open dossier by Phone"
            >
              <span>Sample Phone</span>
            </button>
            <button
              onClick={() => {
                const prop376 = allProperties.find(p => p.house_no === '376') || allProperties[0];
                if (prop376) handleOpenDossier(prop376);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to open dossier for House No. 376"
            >
              <span>House #376</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Metrics Ribbon */}
        <MetricsRibbon
          metrics={metrics}
          onFilterCondition={(cond) => {
            setCurrentTab('registry');
            handleFilterChange({ siteCondition: cond, page: 1 });
          }}
          onFilterGeran={() => {
            setCurrentTab('registry');
            handleFilterChange({ hasGeran: 'yes', page: 1 });
          }}
          onFilterOutreach={() => {
            setCurrentTab('registry');
            handleFilterChange({ tracingStatus: 'Follow-up Required', page: 1 });
          }}
          onFilterArrears={() => {
            setCurrentTab('registry');
            handleFilterChange({ hasArrears: 'arrears', page: 1 });
          }}
        />

        {/* Tab 1: Master Property Registry */}
        {currentTab === 'registry' && (
          <div>
            {/* Multi-Criteria Filters */}
            <PropertyFilters
              filter={filter}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              totalFiltered={filteredResult.totalFiltered}
              totalUnits={metrics.totalUnits}
            />

            {/* Compact High-Density Table */}
            <PropertyTable
              properties={filteredResult.properties}
              onOpenDossier={handleOpenDossier}
              onQuickUpdateStatus={handleQuickUpdateStatus}
              currentPage={filteredResult.page}
              totalPages={filteredResult.totalPages}
              totalFiltered={filteredResult.totalFiltered}
              pageSize={filter.pageSize}
              onPageChange={(page) => handleFilterChange({ page })}
              sortBy={filter.sortBy}
              sortOrder={filter.sortOrder}
              onSortChange={(col) => {
                if (filter.sortBy === col) {
                  handleFilterChange({ sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc' });
                } else {
                  handleFilterChange({ sortBy: col, sortOrder: 'asc' });
                }
              }}
            />
          </div>
        )}

        {/* Tab 2: Outreach CRM & Logs */}
        {currentTab === 'crm' && (
          <CrmOutreachView
            onOpenDossier={handleOpenDossier}
            onOpenNewInteraction={(prop) => handleOpenNewInteraction(prop)}
          />
        )}
      </main>

      {/* Floating Action Button for Gemini Chatbot */}
      <button
        onClick={() => setIsChatbotOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-105 flex items-center justify-center cursor-pointer group border-2 border-emerald-400"
        title="Open Gemini AI Legal Advisor"
      >
        <Sparkles className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Taman Seri Gedung Housing Revitalization Project · 637 Registered Units
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              PostgreSQL Cloud SQL Schema & DDL
            </button>
            <span>·</span>
            <span>Google Maps Platform™ & Firebase Auth Protected</span>
          </div>
        </div>
      </footer>

      {/* Property Dossier Modal */}
      {selectedPropertyForDossier && (
        <PropertyDossierModal
          property={selectedPropertyForDossier}
          onClose={handleCloseDossier}
          onOpenNewInteraction={(prop) => handleOpenNewInteraction(prop)}
          onOpenPhotoLightbox={(url, caption) => setLightboxPhoto({ url, caption })}
          onPropertyUpdated={handlePropertyUpdated}
        />
      )}

      {/* Log New Interaction Modal */}
      {isNewInteractionOpen && (
        <InteractionLogModal
          property={targetPropertyForInteraction}
          allProperties={allProperties}
          onClose={() => {
            setIsNewInteractionOpen(false);
            setTargetPropertyForInteraction(null);
          }}
          onInteractionAdded={handleInteractionAdded}
        />
      )}

      {/* Database Schema & CSV Export/Import Modal */}
      {isSchemaModalOpen && (
        <DatabaseSchemaModal
          onClose={() => setIsSchemaModalOpen(false)}
          onDataImportedOrReset={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <PhotoLightboxModal
          photoUrl={lightboxPhoto.url}
          caption={lightboxPhoto.caption}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      {/* Gemini Chatbot Drawer */}
      <GeminiChatbot
        currentProperty={selectedPropertyForDossier}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  );
}
