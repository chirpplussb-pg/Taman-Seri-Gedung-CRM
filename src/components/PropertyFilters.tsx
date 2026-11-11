/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PropertyFilterState } from '../types/property';
import { Search, RotateCcw, Filter, MapPin } from 'lucide-react';

interface PropertyFiltersProps {
  filter: PropertyFilterState;
  onFilterChange: (updates: Partial<PropertyFilterState>) => void;
  onReset: () => void;
  totalFiltered: number;
  totalUnits: number;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filter,
  onFilterChange,
  onReset,
  totalFiltered,
  totalUnits,
}) => {
  // Generate streets list (Jln Seri Gedung 2 to 21)
  const streets: string[] = [];
  for (let i = 2; i <= 21; i++) {
    streets.push(`Jln Seri Gedung ${i}`);
  }

  const hasActiveFilters =
    Boolean(filter.searchQuery) ||
    filter.streetName !== 'all' ||
    filter.siteCondition !== 'all' ||
    filter.tracingStatus !== 'all' ||
    filter.hasGeran !== 'all' ||
    filter.hasArrears !== 'all' ||
    filter.loanProvider !== 'all';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-2xs">
      {/* Primary search bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-3 border-b border-slate-100">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value, page: 1 })}
            placeholder="Search: Lot No (e.g. Lot 3865), Name, MyKad NRIC, Phone No, House # (e.g. 376), or Geran..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 tabular-nums">{totalFiltered}</strong> of{' '}
            <span className="tabular-nums">{totalUnits}</span> units
          </span>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-criteria dropdown filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
        {/* Street filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Street / Lorong
          </label>
          <select
            value={filter.streetName}
            onChange={(e) => onFilterChange({ streetName: e.target.value, page: 1 })}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Streets (2 - 21)</option>
            {streets.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Site Condition */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Site Audit Condition
          </label>
          <select
            value={filter.siteCondition}
            onChange={(e) => onFilterChange({ siteCondition: e.target.value, page: 1 })}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Conditions</option>
            <option value="Abandon">Abandon (Vacant)</option>
            <option value="Occupied">Occupied (Residents)</option>
            <option value="Renovation">Under Renovation</option>
            <option value="Unknown">Unknown / Locked</option>
          </select>
        </div>

        {/* Tracing Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Outreach Tracing Status
          </label>
          <select
            value={filter.tracingStatus}
            onChange={(e) => onFilterChange({ tracingStatus: e.target.value, page: 1 })}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Outreach Stages</option>
            <option value="Pending Outreach">Pending Outreach</option>
            <option value="Contact Established">Contact Established</option>
            <option value="Follow-up Required">Follow-up Required</option>
            <option value="Negotiating Transfer">Negotiating Transfer</option>
            <option value="Untraceable">Untraceable</option>
            <option value="Completed">Completed (Transferred)</option>
          </select>
        </div>

        {/* Geran Title status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Electronic Geran Title
          </label>
          <select
            value={filter.hasGeran}
            onChange={(e) => onFilterChange({ hasGeran: e.target.value, page: 1 })}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Land Titles</option>
            <option value="yes">Geran Issued (Pejabat Tanah)</option>
            <option value="no">HSD Temporary Title Only</option>
          </select>
        </div>

        {/* Arrears status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Cukai Pintu (Assessment)
          </label>
          <select
            value={filter.hasArrears}
            onChange={(e) => onFilterChange({ hasArrears: e.target.value, page: 1 })}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Arrears Status</option>
            <option value="arrears">Has Arrears (&gt; RM 0.00)</option>
            <option value="clean">No Arrears (Paid / RM 0.00)</option>
          </select>
        </div>

        {/* Loan Provider */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            1988 Loan Provider
          </label>
          <select
            value={filter.loanProvider}
            onChange={(e) => onFilterChange({ loanProvider: e.target.value, page: 1 })}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Providers</option>
            <option value="BPP">BPP (Treasury Housing Loan)</option>
            <option value="KYB">KYB</option>
            <option value="MBSB">MBSB</option>
            <option value="LLN">LLN</option>
            <option value="GL">GL (Govt Loan)</option>
            <option value="Cash">Cash / Self-Financed</option>
          </select>
        </div>
      </div>
    </div>
  );
};
