/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Property, TracingStatus, SiteCondition } from '../types/property';
import { ExternalLink, AlertCircle, CheckCircle2, Clock, Phone, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface PropertyTableProps {
  properties: Property[];
  onOpenDossier: (property: Property) => void;
  onQuickUpdateStatus: (propertyId: string, status: TracingStatus) => void;
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: any) => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  properties,
  onOpenDossier,
  onQuickUpdateStatus,
  currentPage,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const getSiteConditionBadge = (condition: SiteCondition) => {
    switch (condition) {
      case 'Abandon':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Abandon
          </span>
        );
      case 'Occupied':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Occupied
          </span>
        );
      case 'Renovation':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Renovation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Unknown
          </span>
        );
    }
  };

  const getTracingStatusBadge = (status: TracingStatus) => {
    switch (status) {
      case 'Pending Outreach':
        return (
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
            Pending Outreach
          </span>
        );
      case 'Contact Established':
        return (
          <span className="text-xs text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-medium">
            Contact Established
          </span>
        );
      case 'Follow-up Required':
        return (
          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
            Follow-up Required
          </span>
        );
      case 'Negotiating Transfer':
        return (
          <span className="text-xs text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-medium">
            Negotiating Transfer
          </span>
        );
      case 'Untraceable':
        return (
          <span className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium">
            Untraceable
          </span>
        );
      case 'Completed':
        return (
          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
            Completed (Borang 14A)
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
              <th
                onClick={() => onSortChange('house_no')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>House & Street</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap">Cadastral Lot & Title</th>
              <th className="py-3 px-4 whitespace-nowrap">1988 SPA Buyer / ID</th>
              <th className="py-3 px-4 whitespace-nowrap">Site Audit</th>
              <th
                onClick={() => onSortChange('tracing_status')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tracing Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => onSortChange('cukai_pintu_arrears')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cukai Pintu (RM)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">No properties matched current filters</p>
                    <p className="text-xs text-slate-500">Try loosening your search terms or resetting the street and condition filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              properties.map((prop) => (
                <tr
                  key={prop.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onOpenDossier(prop)}
                >
                  {/* House No & Street */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-base tabular-nums">
                        #{prop.house_no}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-normal">
                      {prop.street_name}
                    </div>
                  </td>

                  {/* Cadastral Lot & Geran */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                      {prop.cadastral_lot_no}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]">
                      {prop.geran_no ? (
                        <span className="text-emerald-700 font-medium">GRN: {prop.geran_no.replace('020546GRN', '')}</span>
                      ) : (
                        <span className="text-amber-700 italic">{prop.hsd_no} (Pre-title)</span>
                      )}
                    </div>
                  </td>

                  {/* Buyer & IC */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 text-xs truncate max-w-[190px]">
                      {prop.buyer_primary}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      <span>{prop.ic_new || prop.ic_old_police_army || 'N/A'}</span>
                      {prop.buyer_secondary && (
                        <span className="text-slate-400 text-[10px]">(+ Joint)</span>
                      )}
                    </div>
                  </td>

                  {/* Site Audit Condition */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getSiteConditionBadge(prop.site_condition)}
                  </td>

                  {/* Tracing Status */}
                  <td
                    className="py-3 px-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      {getTracingStatusBadge(prop.tracing_status)}
                    </div>
                  </td>

                  {/* Cukai Pintu Arrears */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs tabular-nums">
                    {prop.cukai_pintu_arrears > 0 ? (
                      <span className="text-rose-600 font-semibold flex items-center justify-end gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                        RM {prop.cukai_pintu_arrears.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        RM 0.00
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td
                    className="py-3 px-4 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onOpenDossier(prop)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                    >
                      <span>Dossier</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * pageSize + 1, totalFiltered)}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, totalFiltered)}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalFiltered}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium">
              Page <span className="tabular-nums font-semibold text-slate-900">{currentPage}</span> of{' '}
              <span className="tabular-nums font-semibold text-slate-900">{totalPages}</span>
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
