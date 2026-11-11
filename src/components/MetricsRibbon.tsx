/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DashboardMetrics } from '../types/property';
import { Building2, AlertTriangle, FileCheck, PhoneForwarded, ReceiptText } from 'lucide-react';

interface MetricsRibbonProps {
  metrics: DashboardMetrics;
  onFilterCondition?: (condition: string) => void;
  onFilterGeran?: () => void;
  onFilterOutreach?: () => void;
  onFilterArrears?: () => void;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({
  metrics,
  onFilterCondition,
  onFilterGeran,
  onFilterOutreach,
  onFilterArrears,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. Total Units */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
          <span>Total Landed Units</span>
          <Building2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
          {metrics.totalUnits}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>637 gazetted terrace lots</span>
        </div>
      </div>

      {/* 2. Verified Abandoned */}
      <button
        onClick={() => onFilterCondition && onFilterCondition('Abandon')}
        className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs text-left transition-all hover:shadow-xs group cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
          <span>Verified Abandoned</span>
          <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold text-amber-600 tracking-tight tabular-nums">
          {metrics.verifiedAbandoned}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>{((metrics.verifiedAbandoned / metrics.totalUnits) * 100).toFixed(1)}% of total estate</span>
        </div>
      </button>

      {/* 3. Official Titles Available */}
      <button
        onClick={onFilterGeran}
        className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs text-left transition-all hover:shadow-xs group cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
          <span>Electronic Geran Available</span>
          <FileCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
          {metrics.officialTitlesAvailable}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>Pejabat Tanah registered</span>
        </div>
      </button>

      {/* 4. Active Outreach in Progress */}
      <button
        onClick={onFilterOutreach}
        className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs text-left transition-all hover:shadow-xs group cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
          <span>Active Outreach</span>
          <PhoneForwarded className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold text-blue-700 tracking-tight tabular-nums">
          {metrics.activeOutreachInProgress}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>{metrics.completedTransfers} completed transfers</span>
        </div>
      </button>

      {/* 5. Total Outstanding Cukai Pintu */}
      <button
        onClick={onFilterArrears}
        className="col-span-2 sm:col-span-1 bg-white border border-slate-200 hover:border-rose-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs text-left transition-all hover:shadow-xs group cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
          <span>Assessment Arrears (MPSPK)</span>
          <ReceiptText className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-bold text-rose-600 tracking-tight tabular-nums truncate">
          RM {metrics.totalOutstandingArrears.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span>Cukai pintu municipal balance</span>
        </div>
      </button>
    </div>
  );
};
