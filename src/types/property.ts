/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SiteCondition = 'Abandon' | 'Occupied' | 'Renovation' | 'Unknown';

export type TracingStatus =
  | 'Pending Outreach'
  | 'Contact Established'
  | 'Follow-up Required'
  | 'Negotiating Transfer'
  | 'Untraceable'
  | 'Completed';

export type InteractionChannel =
  | 'Phone Call'
  | 'WhatsApp'
  | 'Physical Visit'
  | 'Official Notice'
  | 'Legal Letter';

export type InteractionOutcome =
  | 'Follow-up Required'
  | 'Agreed to Borang 14A'
  | 'Wrong Number'
  | 'Refused'
  | 'Dispute'
  | 'Documents Collected'
  | 'No Answer';

export type RelationshipType =
  | 'Original Buyer'
  | 'Waris (Child)'
  | 'Waris (Spouse)'
  | 'Waris (Sibling)'
  | 'Pentadbir'
  | 'Peguam'
  | 'Neighbor'
  | 'Tenant'
  | 'Other';

export interface Property {
  id: string;
  house_no: string;
  lot_no_dev: string;
  cadastral_lot_no: string;
  geran_no: string | null;
  hsd_no: string;
  pt_no: string;
  street_name: string;
  buyer_primary: string;
  buyer_secondary?: string | null;
  ic_new?: string | null;
  ic_old_police_army?: string | null;
  tel_mobile?: string | null;
  tel_fixed?: string | null;
  mailing_address?: string | null;
  loan_provider?: string | null;
  historical_status?: string | null;
  current_registered_owner?: string | null;
  cukai_pintu_arrears: number;
  case_admin_notes?: string | null;
  site_condition: SiteCondition;
  site_description?: string | null;
  site_photo_urls: string[];
  site_survey_date?: string | null;
  house_type_category?: string;
  tracing_status: TracingStatus;
  created_at: string;
  updated_at: string;
}

export interface InteractionLog {
  id: string;
  property_id: string;
  house_no: string;
  interaction_timestamp: string;
  party_contacted: string;
  relationship: RelationshipType;
  phone_dialed?: string | null;
  channel: InteractionChannel;
  outcome: InteractionOutcome;
  detailed_notes: string;
  next_follow_up_date?: string | null;
  docs_collected_urls: string[];
  recorded_by: string;
  created_at: string;
}

export interface PropertyFilterState {
  searchQuery: string;
  streetName: string;
  siteCondition: string;
  tracingStatus: string;
  hasGeran: string;
  hasArrears: string;
  loanProvider: string;
  sortBy: 'house_no' | 'cukai_pintu_arrears' | 'street_name' | 'tracing_status' | 'updated_at';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface DashboardMetrics {
  totalUnits: number;
  verifiedAbandoned: number;
  officialTitlesAvailable: number;
  activeOutreachInProgress: number;
  totalOutstandingArrears: number;
  completedTransfers: number;
  occupiedUnits: number;
  renovationUnits: number;
}

export interface QuickSearchResult {
  property: Property;
  matchedField: 'house_no' | 'lot_no' | 'name' | 'nric' | 'telephone' | 'geran_no' | 'other';
  matchedLabel: string;
  matchedValue: string;
  score: number;
}

