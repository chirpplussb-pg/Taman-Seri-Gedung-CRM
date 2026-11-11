/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Property, InteractionLog, TracingStatus } from '../types/property';
import { PropertyStorageService } from '../services/propertyStorage';
import { PhoneCall, Calendar, Search, Filter, ExternalLink, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface CrmOutreachViewProps {
  onOpenDossier: (property: Property) => void;
  onOpenNewInteraction: (property?: Property) => void;
}

export const CrmOutreachView: React.FC<CrmOutreachViewProps> = ({
  onOpenDossier,
  onOpenNewInteraction,
}) => {
  const { properties, interactions } = PropertyStorageService.loadData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLogs = interactions.filter((log) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchParty = log.party_contacted.toLowerCase().includes(q);
      const matchHouse = log.house_no.toLowerCase().includes(q);
      const matchNotes = log.detailed_notes.toLowerCase().includes(q);
      const matchPhone = log.phone_dialed ? log.phone_dialed.toLowerCase().includes(q) : false;
      if (!matchParty && !matchHouse && !matchNotes && !matchPhone) return false;
    }
    if (statusFilter !== 'all') {
      if (log.outcome !== statusFilter) return false;
    }
    return true;
  });

  // Calculate stage counts
  const stageCounts: Record<TracingStatus, number> = {
    'Pending Outreach': 0,
    'Contact Established': 0,
    'Follow-up Required': 0,
    'Negotiating Transfer': 0,
    'Untraceable': 0,
    'Completed': 0,
  };

  properties.forEach(p => {
    if (stageCounts[p.tracing_status] !== undefined) {
      stageCounts[p.tracing_status]++;
    }
  });

  return (
    <div className="space-y-6">
      {/* CRM Pipeline Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Owner Tracing & Borang 14A Pipeline (637 Units)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(
            [
              { key: 'Pending Outreach', label: 'Pending Outreach', color: 'bg-slate-100 text-slate-700' },
              { key: 'Contact Established', label: 'Contact Established', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
              { key: 'Follow-up Required', label: 'Follow-up Required', color: 'bg-amber-50 text-amber-800 border-amber-200' },
              { key: 'Negotiating Transfer', label: 'Negotiating Transfer', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
              { key: 'Untraceable', label: 'Untraceable', color: 'bg-rose-50 text-rose-800 border-rose-200' },
              { key: 'Completed', label: 'Completed (Borang 14A)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            ] as const
          ).map((stage) => (
            <div
              key={stage.key}
              className={`p-3 rounded-lg border border-slate-200/80 ${stage.color} flex flex-col justify-between`}
            >
              <span className="text-[11px] font-semibold truncate">{stage.label}</span>
              <span className="text-xl font-bold font-mono mt-1 tabular-nums">
                {stageCounts[stage.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Outreach Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Chronological Outreach Feed</h3>
            <p className="text-xs text-slate-500">Live communication logs across all landed parcels</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewInteraction()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>+ Record Touchpoint</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by house #, party contacted, notes, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Outcomes</option>
              <option value="Agreed to Borang 14A">Agreed to Borang 14A</option>
              <option value="Follow-up Required">Follow-up Required</option>
              <option value="Documents Collected">Documents Collected</option>
              <option value="Wrong Number">Wrong Number</option>
              <option value="Refused">Refused</option>
            </select>
          </div>
        </div>

        {/* Logs list */}
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No outreach logs match current search filters.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const matchedProp = properties.find((p) => p.house_no === log.house_no);

              return (
                <div
                  key={log.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs">
                        Unit #{log.house_no}
                      </span>
                      <span className="font-bold text-slate-900">{log.party_contacted}</span>
                      <span className="text-slate-500">({log.relationship})</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {log.channel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(log.interaction_timestamp).toLocaleDateString('en-MY')}
                      </span>
                      {matchedProp && (
                        <button
                          onClick={() => onOpenDossier(matchedProp)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span>Open Dossier</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                      log.outcome === 'Agreed to Borang 14A' ? 'bg-indigo-100 text-indigo-800' :
                      log.outcome === 'Documents Collected' ? 'bg-emerald-100 text-emerald-800' :
                      log.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      Outcome: {log.outcome}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {log.detailed_notes}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <div className="flex items-center gap-3">
                      {log.phone_dialed && <span>Tel: {log.phone_dialed}</span>}
                      {log.next_follow_up_date && (
                        <span className="text-amber-800 font-sans font-semibold">
                          Next Action: {log.next_follow_up_date}
                        </span>
                      )}
                    </div>
                    <span>Recorded by: {log.recorded_by}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
