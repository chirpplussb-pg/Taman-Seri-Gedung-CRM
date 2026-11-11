/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property, InteractionLog, DashboardMetrics, PropertyFilterState, TracingStatus, SiteCondition, QuickSearchResult } from '../types/property';
import { generateSeedData } from '../data/seedGenerator';
import { exportPropertiesToMasterCsv, exportInteractionsToCsv, parseMasterCsv } from '../utils/csvUtils';

const PROPERTIES_KEY = 'tsg_properties_v1';
const INTERACTIONS_KEY = 'tsg_interactions_v1';

export class PropertyStorageService {
  private static cachedProperties: Property[] | null = null;
  private static cachedInteractions: InteractionLog[] | null = null;

  static loadData(): { properties: Property[]; interactions: InteractionLog[] } {
    if (this.cachedProperties && this.cachedInteractions) {
      return { properties: this.cachedProperties, interactions: this.cachedInteractions };
    }

    try {
      const storedProps = localStorage.getItem(PROPERTIES_KEY);
      const storedInteractions = localStorage.getItem(INTERACTIONS_KEY);

      if (storedProps && storedInteractions) {
        this.cachedProperties = JSON.parse(storedProps);
        this.cachedInteractions = JSON.parse(storedInteractions);
        if (this.cachedProperties && this.cachedProperties.length >= 600) {
          return { properties: this.cachedProperties, interactions: this.cachedInteractions || [] };
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, loading fresh seed', e);
    }

    const initial = generateSeedData();
    this.cachedProperties = initial.properties;
    this.cachedInteractions = initial.interactions;
    this.saveData();
    return initial;
  }

  static saveData(): void {
    try {
      if (this.cachedProperties) {
        localStorage.setItem(PROPERTIES_KEY, JSON.stringify(this.cachedProperties));
      }
      if (this.cachedInteractions) {
        localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(this.cachedInteractions));
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  static resetToDefault(): { properties: Property[]; interactions: InteractionLog[] } {
    const initial = generateSeedData();
    this.cachedProperties = initial.properties;
    this.cachedInteractions = initial.interactions;
    this.saveData();
    return initial;
  }

  static getProperties(): Property[] {
    return this.loadData().properties;
  }

  static getPropertyByHouseNo(houseNo: string): Property | undefined {
    const props = this.getProperties();
    return props.find(p => p.house_no === houseNo || p.house_no === houseNo.trim());
  }

  static getInteractionsForProperty(propertyId: string, houseNo?: string): InteractionLog[] {
    const { interactions } = this.loadData();
    return interactions
      .filter(i => i.property_id === propertyId || (houseNo && i.house_no === houseNo))
      .sort((a, b) => new Date(b.interaction_timestamp).getTime() - new Date(a.interaction_timestamp).getTime());
  }

  static updatePropertyTracingStatus(propertyId: string, newStatus: TracingStatus): Property | null {
    const { properties } = this.loadData();
    const idx = properties.findIndex(p => p.id === propertyId);
    if (idx === -1) return null;

    properties[idx] = {
      ...properties[idx],
      tracing_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    this.saveData();
    return properties[idx];
  }

  static updatePropertyDetails(propertyId: string, updates: Partial<Property>): Property | null {
    const { properties } = this.loadData();
    const idx = properties.findIndex(p => p.id === propertyId);
    if (idx === -1) return null;

    properties[idx] = {
      ...properties[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveData();
    return properties[idx];
  }

  static addInteractionLog(
    logData: Omit<InteractionLog, 'id' | 'created_at'>,
    resultingTracingStatus?: TracingStatus
  ): { log: InteractionLog; property: Property | null } {
    const { interactions, properties } = this.loadData();

    const newLog: InteractionLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };

    interactions.unshift(newLog);

    // Update parent property
    let updatedProp: Property | null = null;
    const propIdx = properties.findIndex(p => p.id === logData.property_id || p.house_no === logData.house_no);
    if (propIdx !== -1) {
      const nextStatus = resultingTracingStatus || (
        logData.outcome === 'Agreed to Borang 14A' ? 'Negotiating Transfer' :
        logData.outcome === 'Documents Collected' ? 'Completed' :
        logData.outcome === 'Wrong Number' || logData.outcome === 'Refused' ? 'Untraceable' :
        properties[propIdx].tracing_status === 'Pending Outreach' ? 'Contact Established' :
        properties[propIdx].tracing_status
      );

      properties[propIdx] = {
        ...properties[propIdx],
        tracing_status: nextStatus,
        updated_at: new Date().toISOString(),
      };
      updatedProp = properties[propIdx];
    }

    this.saveData();
    return { log: newLog, property: updatedProp };
  }

  static getMetrics(): DashboardMetrics {
    const props = this.getProperties();

    let verifiedAbandoned = 0;
    let officialTitlesAvailable = 0;
    let activeOutreachInProgress = 0;
    let totalOutstandingArrears = 0;
    let completedTransfers = 0;
    let occupiedUnits = 0;
    let renovationUnits = 0;

    for (const p of props) {
      if (p.site_condition === 'Abandon') verifiedAbandoned++;
      if (p.site_condition === 'Occupied') occupiedUnits++;
      if (p.site_condition === 'Renovation') renovationUnits++;
      if (p.geran_no && p.geran_no.trim().length > 0) officialTitlesAvailable++;
      if (p.tracing_status !== 'Pending Outreach') activeOutreachInProgress++;
      if (p.tracing_status === 'Completed') completedTransfers++;
      totalOutstandingArrears += p.cukai_pintu_arrears || 0;
    }

    return {
      totalUnits: props.length,
      verifiedAbandoned,
      officialTitlesAvailable,
      activeOutreachInProgress,
      totalOutstandingArrears,
      completedTransfers,
      occupiedUnits,
      renovationUnits,
    };
  }

  static filterProperties(filter: PropertyFilterState): {
    properties: Property[];
    totalFiltered: number;
    totalPages: number;
    page: number;
  } {
    const all = this.getProperties();
    const query = filter.searchQuery.toLowerCase().trim();

    let filtered = all.filter(p => {
      if (query) {
        // Search query across House No, Cadastral Lot, Geran No, Buyer Primary, Buyer Secondary, IC No, PT No, Phone
        const cleanQuery = query.replace(/[\s-]/g, '');
        const matchHouse = p.house_no.toLowerCase().includes(query) || p.house_no === query;
        const matchCadastral = p.cadastral_lot_no.toLowerCase().includes(query) || (cleanQuery.length >= 2 && p.cadastral_lot_no.toLowerCase().replace(/[\s-]/g, '').includes(cleanQuery));
        const matchLotDev = p.lot_no_dev ? (p.lot_no_dev.toLowerCase().includes(query) || p.lot_no_dev.replace(/[\s-]/g, '').includes(cleanQuery)) : false;
        const matchGeran = p.geran_no ? p.geran_no.toLowerCase().includes(query) : false;
        const matchBuyer = p.buyer_primary.toLowerCase().includes(query);
        const matchSecondary = p.buyer_secondary ? p.buyer_secondary.toLowerCase().includes(query) : false;
        const matchCurrentOwner = p.current_registered_owner ? p.current_registered_owner.toLowerCase().includes(query) : false;
        
        // NRIC matching (both formatted and digits-only)
        const matchIc = p.ic_new ? (p.ic_new.toLowerCase().includes(query) || (cleanQuery.length >= 3 && p.ic_new.replace(/\D/g, '').includes(cleanQuery))) : false;
        const matchOldIc = p.ic_old_police_army ? p.ic_old_police_army.toLowerCase().includes(query) : false;
        
        // Telephone matching (both formatted and digits-only)
        const matchTelMobile = p.tel_mobile ? (p.tel_mobile.toLowerCase().includes(query) || (cleanQuery.length >= 3 && p.tel_mobile.replace(/\D/g, '').includes(cleanQuery))) : false;
        const matchTelFixed = p.tel_fixed ? (p.tel_fixed.toLowerCase().includes(query) || (cleanQuery.length >= 3 && p.tel_fixed.replace(/\D/g, '').includes(cleanQuery))) : false;

        const matchPt = p.pt_no.toLowerCase().includes(query);
        const matchStreet = p.street_name.toLowerCase().includes(query);
        const matchStatus = p.tracing_status.toLowerCase().includes(query);

        if (
          !matchHouse &&
          !matchCadastral &&
          !matchLotDev &&
          !matchGeran &&
          !matchBuyer &&
          !matchSecondary &&
          !matchCurrentOwner &&
          !matchIc &&
          !matchOldIc &&
          !matchTelMobile &&
          !matchTelFixed &&
          !matchPt &&
          !matchStreet &&
          !matchStatus
        ) {
          return false;
        }
      }

      // Street filter
      if (filter.streetName && filter.streetName !== 'all') {
        if (p.street_name !== filter.streetName) return false;
      }

      // Site condition filter
      if (filter.siteCondition && filter.siteCondition !== 'all') {
        if (p.site_condition !== filter.siteCondition) return false;
      }

      // Tracing status filter
      if (filter.tracingStatus && filter.tracingStatus !== 'all') {
        if (p.tracing_status !== filter.tracingStatus) return false;
      }

      // Geran Title filter
      if (filter.hasGeran && filter.hasGeran !== 'all') {
        const has = Boolean(p.geran_no && p.geran_no.trim().length > 0);
        if (filter.hasGeran === 'yes' && !has) return false;
        if (filter.hasGeran === 'no' && has) return false;
      }

      // Arrears filter
      if (filter.hasArrears && filter.hasArrears !== 'all') {
        if (filter.hasArrears === 'arrears' && p.cukai_pintu_arrears <= 0) return false;
        if (filter.hasArrears === 'clean' && p.cukai_pintu_arrears > 0) return false;
      }

      // Loan provider
      if (filter.loanProvider && filter.loanProvider !== 'all') {
        if (!p.loan_provider || !p.loan_provider.includes(filter.loanProvider)) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (filter.sortBy === 'house_no') {
        const numA = parseInt(a.house_no, 10);
        const numB = parseInt(b.house_no, 10);
        comparison = (!isNaN(numA) && !isNaN(numB)) ? numA - numB : a.house_no.localeCompare(b.house_no);
      } else if (filter.sortBy === 'cukai_pintu_arrears') {
        comparison = a.cukai_pintu_arrears - b.cukai_pintu_arrears;
      } else if (filter.sortBy === 'street_name') {
        comparison = a.street_name.localeCompare(b.street_name);
      } else if (filter.sortBy === 'tracing_status') {
        comparison = a.tracing_status.localeCompare(b.tracing_status);
      } else if (filter.sortBy === 'updated_at') {
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }

      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });

    const totalFiltered = filtered.length;
    const pageSize = filter.pageSize || 25;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const safePage = Math.min(Math.max(1, filter.page), totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      properties: paginated,
      totalFiltered,
      totalPages,
      page: safePage,
    };
  }

  static exportMasterCsv(): string {
    return exportPropertiesToMasterCsv(this.getProperties());
  }

  static exportInteractionsCsv(): string {
    const { interactions } = this.loadData();
    return exportInteractionsToCsv(interactions);
  }

  static importCsv(csvContent: string): number {
    const parsed = parseMasterCsv(csvContent);
    if (!parsed || parsed.length === 0) return 0;

    const { properties } = this.loadData();
    let updatedCount = 0;

    parsed.forEach(incoming => {
      if (!incoming.house_no) return;
      const idx = properties.findIndex(p => p.house_no === incoming.house_no);
      if (idx !== -1) {
        properties[idx] = {
          ...properties[idx],
          ...incoming,
          updated_at: new Date().toISOString(),
        } as Property;
        updatedCount++;
      } else {
        properties.push({
          id: `prop-${incoming.house_no.padStart(4, '0')}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          site_photo_urls: [],
          ...incoming,
        } as Property);
        updatedCount++;
      }
    });

    this.saveData();
    return updatedCount;
  }

  /**
   * Fast multi-field quick search for omnibar / header search
   * Matches across Cadastral Lot, Development Lot, Buyer/Owner Name, NRIC/Old IC, Telephone, House No, and Geran Title.
   */
  static quickSearch(rawQuery: string, limit = 8): QuickSearchResult[] {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return [];

    const all = this.getProperties();
    const cleanDigits = rawQuery.replace(/\D/g, '');
    const cleanAlphaNum = query.replace(/[^a-z0-9]/g, '');
    const results: QuickSearchResult[] = [];

    for (const p of all) {
      let matchedField: QuickSearchResult['matchedField'] | null = null;
      let matchedLabel = '';
      let matchedValue = '';
      let score = 0;

      // 1. Cadastral Lot No (e.g. "Lot 3865" or "3865")
      const cadClean = p.cadastral_lot_no.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cadNumOnly = p.cadastral_lot_no.replace(/\D/g, '');
      if (cleanDigits.length >= 2 && cadNumOnly === cleanDigits) {
        matchedField = 'lot_no';
        matchedLabel = 'Cadastral Lot';
        matchedValue = p.cadastral_lot_no;
        score = 98;
      } else if (p.cadastral_lot_no.toLowerCase().includes(query) || (cleanAlphaNum.length >= 3 && cadClean.includes(cleanAlphaNum))) {
        matchedField = 'lot_no';
        matchedLabel = 'Cadastral Lot';
        matchedValue = p.cadastral_lot_no;
        score = 85;
      }

      // 2. Development Lot (e.g. "Plot 35" or "35")
      if (!matchedField && p.lot_no_dev) {
        if (p.lot_no_dev === query || (cleanDigits && p.lot_no_dev === cleanDigits)) {
          matchedField = 'lot_no';
          matchedLabel = 'Dev Plot';
          matchedValue = `Plot ${p.lot_no_dev}`;
          score = 90;
        } else if (p.lot_no_dev.toLowerCase().includes(query)) {
          matchedField = 'lot_no';
          matchedLabel = 'Dev Plot';
          matchedValue = `Plot ${p.lot_no_dev}`;
          score = 75;
        }
      }

      // 3. NRIC / MyKad / Old IC / Police / Army ID
      if (!matchedField || score < 95) {
        const icDigits = p.ic_new ? p.ic_new.replace(/\D/g, '') : '';
        if (cleanDigits.length >= 3 && icDigits.includes(cleanDigits)) {
          const isExact = icDigits === cleanDigits;
          const currentScore = isExact ? 100 : 88;
          if (currentScore > score) {
            matchedField = 'nric';
            matchedLabel = isExact ? 'Exact MyKad Match' : 'NRIC / MyKad';
            matchedValue = p.ic_new || '';
            score = currentScore;
          }
        } else if (p.ic_old_police_army && p.ic_old_police_army.toLowerCase().includes(query)) {
          const currentScore = 88;
          if (currentScore > score) {
            matchedField = 'nric';
            matchedLabel = 'Police/Army/Old IC';
            matchedValue = p.ic_old_police_army;
            score = currentScore;
          }
        }
      }

      // 4. Telephone (Mobile / Landline)
      if (!matchedField || score < 95) {
        const mobileDigits = p.tel_mobile ? p.tel_mobile.replace(/\D/g, '') : '';
        const fixedDigits = p.tel_fixed ? p.tel_fixed.replace(/\D/g, '') : '';

        if (cleanDigits.length >= 3) {
          if (mobileDigits.includes(cleanDigits)) {
            const isExact = mobileDigits === cleanDigits;
            const currentScore = isExact ? 100 : 86;
            if (currentScore > score) {
              matchedField = 'telephone';
              matchedLabel = 'Mobile Tel';
              matchedValue = p.tel_mobile || '';
              score = currentScore;
            }
          } else if (fixedDigits.includes(cleanDigits)) {
            const isExact = fixedDigits === cleanDigits;
            const currentScore = isExact ? 98 : 82;
            if (currentScore > score) {
              matchedField = 'telephone';
              matchedLabel = 'Fixed Line Tel';
              matchedValue = p.tel_fixed || '';
              score = currentScore;
            }
          }
        }
      }

      // 5. Buyer Name / Registered Owner
      if (!matchedField || score < 90) {
        const primaryLower = p.buyer_primary.toLowerCase();
        const secondaryLower = p.buyer_secondary ? p.buyer_secondary.toLowerCase() : '';
        const currentOwnerLower = p.current_registered_owner ? p.current_registered_owner.toLowerCase() : '';

        if (primaryLower.startsWith(query)) {
          matchedField = 'name';
          matchedLabel = '1988 Purchaser';
          matchedValue = p.buyer_primary;
          score = 92;
        } else if (primaryLower.includes(query)) {
          matchedField = 'name';
          matchedLabel = '1988 Purchaser';
          matchedValue = p.buyer_primary;
          score = 80;
        } else if (secondaryLower.includes(query)) {
          matchedField = 'name';
          matchedLabel = 'Joint Purchaser / Waris';
          matchedValue = p.buyer_secondary!;
          score = 78;
        } else if (currentOwnerLower.includes(query)) {
          matchedField = 'name';
          matchedLabel = 'Current Registered Owner';
          matchedValue = p.current_registered_owner!;
          score = 82;
        }
      }

      // 6. House No (e.g. "376", "#376", "No 376")
      const strippedHouse = query.replace(/^(no\.?|house|#)\s*/i, '').trim();
      if (p.house_no === strippedHouse || p.house_no === query) {
        matchedField = 'house_no';
        matchedLabel = 'House Number';
        matchedValue = `No. ${p.house_no}`;
        score = 100;
      } else if (!matchedField && (p.house_no.startsWith(strippedHouse) || p.house_no.includes(query))) {
        matchedField = 'house_no';
        matchedLabel = 'House Number';
        matchedValue = `No. ${p.house_no}`;
        score = 70;
      }

      // 7. Geran Title No
      if ((!matchedField || score < 85) && p.geran_no) {
        if (p.geran_no.toLowerCase().includes(query) || (cleanAlphaNum.length >= 4 && p.geran_no.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum))) {
          matchedField = 'geran_no';
          matchedLabel = 'Geran Title';
          matchedValue = p.geran_no;
          score = 84;
        }
      }

      if (matchedField && score > 0) {
        results.push({
          property: p,
          matchedField,
          matchedLabel,
          matchedValue,
          score,
        });
      }
    }

    // Sort by score descending, then house number ascending
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const numA = parseInt(a.property.house_no, 10);
      const numB = parseInt(b.property.house_no, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.property.house_no.localeCompare(b.property.house_no);
    });

    return results.slice(0, limit);
  }
}

