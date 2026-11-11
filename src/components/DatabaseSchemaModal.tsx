/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PropertyStorageService } from '../services/propertyStorage';
import { X, Download, Upload, Copy, Check, Database, FileSpreadsheet, RotateCcw, AlertCircle } from 'lucide-react';

interface DatabaseSchemaModalProps {
  onClose: () => void;
  onDataImportedOrReset: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  onClose,
  onDataImportedOrReset,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'sql' | 'import'>('downloads');
  const [copiedSql, setCopiedSql] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const sqlSchemaText = `-- Taman Seri Gedung Relational Database DDL (PostgreSQL 14+)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_no VARCHAR(20) NOT NULL UNIQUE,
    lot_no_dev VARCHAR(50),
    cadastral_lot_no VARCHAR(50) NOT NULL,
    geran_no VARCHAR(100),
    hsd_no VARCHAR(50),
    pt_no VARCHAR(50),
    street_name VARCHAR(100) NOT NULL,
    buyer_primary VARCHAR(200) NOT NULL,
    buyer_secondary VARCHAR(200),
    ic_new VARCHAR(20),
    ic_old_police_army VARCHAR(50),
    tel_mobile VARCHAR(50),
    tel_fixed VARCHAR(50),
    mailing_address TEXT,
    loan_provider VARCHAR(50),
    historical_status TEXT,
    current_registered_owner VARCHAR(200),
    cukai_pintu_arrears NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    case_admin_notes TEXT,
    site_condition VARCHAR(30) NOT NULL DEFAULT 'Unknown',
    site_description TEXT,
    site_photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    site_survey_date DATE,
    house_type_category VARCHAR(60),
    tracing_status VARCHAR(40) NOT NULL DEFAULT 'Pending Outreach',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    house_no VARCHAR(20) NOT NULL,
    interaction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    party_contacted VARCHAR(150) NOT NULL,
    relationship VARCHAR(60) NOT NULL,
    phone_dialed VARCHAR(50),
    channel VARCHAR(40) NOT NULL,
    outcome VARCHAR(50) NOT NULL,
    detailed_notes TEXT NOT NULL,
    next_follow_up_date DATE,
    docs_collected_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_house_no ON properties(house_no);
CREATE INDEX idx_properties_cadastral_lot ON properties(cadastral_lot_no);
CREATE INDEX idx_properties_geran_no ON properties(geran_no);
CREATE INDEX idx_properties_tracing_status ON properties(tracing_status);
CREATE INDEX idx_interaction_property_id ON interaction_logs(property_id);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadMasterCsv = () => {
    const csvData = PropertyStorageService.exportMasterCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Master_Database.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadInteractionsCsv = () => {
    const csvData = PropertyStorageService.exportInteractionsCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Interaction_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSqlFile = () => {
    const blob = new Blob([sqlSchemaText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const count = PropertyStorageService.importCsv(content);
          setImportStatus(`Successfully processed and synchronized ${count} property records!`);
          onDataImportedOrReset();
        } catch (err) {
          setImportStatus('Error importing CSV: Please ensure columns match standard schema.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset all records to the original 637-unit Taman Seri Gedung dataset?')) {
      PropertyStorageService.resetToDefault();
      setImportStatus('Database successfully restored to original 637 properties!');
      onDataImportedOrReset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Database Schema & Data Deliverables</h2>
              <p className="text-xs text-slate-400">PostgreSQL DDL, CSV exports & seed data management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 gap-4 text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'downloads' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Deliverables & Seed Files</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'sql' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Schema DDL</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'import' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Sync CSV</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between">
              <span>{importStatus}</span>
              <button onClick={() => setImportStatus(null)} className="text-emerald-600 font-bold ml-2">×</button>
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Download generated CSV datasets matching the exact columns specified in the project specification. These files are ready for import into Supabase, PostgreSQL, or Google Sheets:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Master_Database.csv</span>
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Complete 637 landed properties with cadastral lots, Geran titles, 1988 SPA purchasers, IC numbers, cukai pintu arrears, and site audit status.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMasterCsv}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Master_Database.csv</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>Interaction_Logs.csv</span>
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Audit trail of outreach touchpoints, telephone calls, WhatsApp conversations, heir negotiations, and Borang 14A legal progress.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadInteractionsCsv}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Interaction_Logs.csv</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">Factory Reset</h4>
                  <p className="text-slate-500 text-[11px]">Restore original 637 properties and sample outreach logs</p>
                </div>
                <button
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All to Default</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">PostgreSQL DDL (`/schema.sql`)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copySql}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSqlFile}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sql</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72 leading-relaxed">
                {sqlSchemaText}
              </pre>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Upload a modified `Master_Database.csv` or `Detail_Listing.csv` to synchronize live properties in this registry:
              </p>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 space-y-3">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <label className="inline-block px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                    <span>Select CSV File</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Must include <code>house_no</code> as key identifier.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
