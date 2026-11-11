/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property, InteractionLog } from '../types/property';

export function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportPropertiesToMasterCsv(properties: Property[]): string {
  const headers = [
    'house_no',
    'lot_no_dev',
    'cadastral_lot_no',
    'geran_no',
    'hsd_no',
    'pt_no',
    'street_name',
    'buyer_primary',
    'buyer_secondary',
    'ic_new',
    'ic_old_police_army',
    'tel_mobile',
    'tel_fixed',
    'mailing_address',
    'loan_provider',
    'historical_status',
    'current_registered_owner',
    'cukai_pintu_arrears',
    'site_condition',
    'site_description',
    'house_type_category',
    'tracing_status',
    'case_admin_notes'
  ];

  const rows = properties.map(p => [
    escapeCsv(p.house_no),
    escapeCsv(p.lot_no_dev),
    escapeCsv(p.cadastral_lot_no),
    escapeCsv(p.geran_no),
    escapeCsv(p.hsd_no),
    escapeCsv(p.pt_no),
    escapeCsv(p.street_name),
    escapeCsv(p.buyer_primary),
    escapeCsv(p.buyer_secondary),
    escapeCsv(p.ic_new),
    escapeCsv(p.ic_old_police_army),
    escapeCsv(p.tel_mobile),
    escapeCsv(p.tel_fixed),
    escapeCsv(p.mailing_address),
    escapeCsv(p.loan_provider),
    escapeCsv(p.historical_status),
    escapeCsv(p.current_registered_owner),
    escapeCsv(p.cukai_pintu_arrears.toFixed(2)),
    escapeCsv(p.site_condition),
    escapeCsv(p.site_description),
    escapeCsv(p.house_type_category),
    escapeCsv(p.tracing_status),
    escapeCsv(p.case_admin_notes)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportInteractionsToCsv(interactions: InteractionLog[]): string {
  const headers = [
    'house_no',
    'interaction_timestamp',
    'party_contacted',
    'relationship',
    'phone_dialed',
    'channel',
    'outcome',
    'detailed_notes',
    'next_follow_up_date',
    'recorded_by'
  ];

  const rows = interactions.map(i => [
    escapeCsv(i.house_no),
    escapeCsv(i.interaction_timestamp),
    escapeCsv(i.party_contacted),
    escapeCsv(i.relationship),
    escapeCsv(i.phone_dialed),
    escapeCsv(i.channel),
    escapeCsv(i.outcome),
    escapeCsv(i.detailed_notes),
    escapeCsv(i.next_follow_up_date),
    escapeCsv(i.recorded_by)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function parseMasterCsv(csvText: string): Partial<Property>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results: Partial<Property>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const values: string[] = [];
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      let val = match[1];
      if (val === undefined) break;
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      values.push(val);
      if (regex.lastIndex >= lines[i].length) break;
    }

    const rowObj: any = {};
    headers.forEach((h, index) => {
      rowObj[h] = values[index] ?? '';
    });

    results.push({
      house_no: rowObj.house_no,
      lot_no_dev: rowObj.lot_no_dev,
      cadastral_lot_no: rowObj.cadastral_lot_no,
      geran_no: rowObj.geran_no || null,
      hsd_no: rowObj.hsd_no,
      pt_no: rowObj.pt_no,
      street_name: rowObj.street_name,
      buyer_primary: rowObj.buyer_primary,
      buyer_secondary: rowObj.buyer_secondary || null,
      ic_new: rowObj.ic_new || null,
      ic_old_police_army: rowObj.ic_old_police_army || null,
      tel_mobile: rowObj.tel_mobile || null,
      tel_fixed: rowObj.tel_fixed || null,
      mailing_address: rowObj.mailing_address || null,
      loan_provider: rowObj.loan_provider || null,
      historical_status: rowObj.historical_status || null,
      current_registered_owner: rowObj.current_registered_owner || null,
      cukai_pintu_arrears: parseFloat(rowObj.cukai_pintu_arrears) || 0,
      site_condition: rowObj.site_condition || 'Unknown',
      site_description: rowObj.site_description || null,
      house_type_category: rowObj.house_type_category,
      tracing_status: rowObj.tracing_status || 'Pending Outreach',
      case_admin_notes: rowObj.case_admin_notes || null
    });
  }

  return results;
}
