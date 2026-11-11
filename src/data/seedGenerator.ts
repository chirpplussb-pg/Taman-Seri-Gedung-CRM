/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property, InteractionLog, SiteCondition, TracingStatus } from '../types/property';

// Authentic local image paths generated for the project
export const SITE_PHOTOS = {
  abandonedWeeds: '/src/assets/images/site_abandoned_terrace_weeds_1794412319794.jpg',
  occupiedRenovated: '/src/assets/images/site_occupied_renovated_terrace_1794412320168.jpg',
  dilapidatedRoof: '/src/assets/images/site_dilapidated_roof_damage_1794412321338.jpg',
  streetView: '/src/assets/images/site_street_view_neighborhood_1794412321588.jpg',
  officerAvatar: '/src/assets/images/avatar_field_officer_1794412322006.jpg',
};

const MALAY_NAMES = [
  'Ahmad bin Othman', 'Siti Fatimah binti Daud', 'Ismail bin Hashim', 'Zainal Abidin bin Kassim',
  'Mohd Nor bin Zakaria', 'Rohani binti Mat Saman', 'Kamaruddin bin Ariffin', 'Azizah binti Yusof',
  'Wan Mohd Azhar bin Wan Daud', 'Noraini binti Abdul Rahman', 'Mustafa bin Chik', 'Halimah binti Bakar',
  'Mohamad Radzi bin Jaafar', 'Rosli bin Hassan', 'Fauziah binti Mohd Ali', 'Zulkifli bin Sulaiman',
  'Shamsudin bin Che Man', 'Hasnah binti Salleh', 'Baharudin bin Idris', 'Mariam binti Mat Noor'
];

const CHINESE_NAMES = [
  'Tan Ah Kow', 'Lim Chee Keong', 'Wong Siew Fong', 'Lee Boon Heng',
  'Chong Mei Ling', 'Ng Kok Wah', 'Teoh Beng Hock', 'Khoo Soo Peng',
  'Goh Cheng Teik', 'Chan Wai Meng', 'Lau Swee Lan', 'Chua Eng Guan',
  'Ooi Kar Seng', 'Yip Sau Yin', 'Sim Keng Boon', 'Low Peck Hoon'
];

const INDIAN_NAMES = [
  'Subramaniam a/l Govindasamy', 'Usha a/p Muthusamy', 'Murugan a/l Ramasamy', 'Devi a/p Arumugam',
  'Rajagopal a/l Krishnan', 'Saravanan a/l Maniam', 'Kalaiselvi a/p Ramiah', 'Ganesan a/l Perumal',
  'Ponnusamy a/l Nadesan', 'Vimala a/p Appalasamy', 'Suresh a/l Jayaram', 'Meenachi a/p Veeran'
];

const LOAN_PROVIDERS = ['BPP', 'KYB', 'MBSB', 'LLN', 'GL (Federal Gov)', 'Cash (Self-Financed)', 'Maybank Finance', 'Bank Bumiputra'];

export function generateSeedData(): { properties: Property[]; interactions: InteractionLog[] } {
  const properties: Property[] = [];
  const interactions: InteractionLog[] = [];

  const totalUnits = 637;
  const allNames = [...MALAY_NAMES, ...CHINESE_NAMES, ...INDIAN_NAMES];

  // Streets range from Jalan Seri Gedung 2 through 21 (20 streets)
  // 637 units distributed across streets: roughly 30-34 units per street
  let currentUnit = 1;

  for (let streetIdx = 2; streetIdx <= 21; streetIdx++) {
    const streetName = `Jln Seri Gedung ${streetIdx}`;
    // allocate units per street
    const unitsInStreet = streetIdx === 21 ? (totalUnits - currentUnit + 1) : 32;

    for (let u = 0; u < unitsInStreet && currentUnit <= totalUnits; u++) {
      const houseNo = currentUnit.toString();
      const lotDevNo = `${(currentUnit % 120) + 1}`;
      const cadastralLot = `Lot ${3800 + currentUnit}`;
      const ptNo = `${7800 + currentUnit}`;
      const hsdNo = `HSD ${4400 + (currentUnit % 90)}/88`;

      // ~78% have official electronic Geran registered
      const hasGeran = currentUnit % 5 !== 0;
      const geranNo = hasGeran ? `020546GRN00${(185000 + currentUnit).toString()}` : null;

      // Deterministic purchaser assignment
      const primaryName = allNames[(currentUnit * 7) % allNames.length];
      const hasSecondary = currentUnit % 3 === 0;
      const secondaryName = hasSecondary ? allNames[(currentUnit * 11 + 3) % allNames.length] : null;

      // IC generation
      const birthYear = 42 + (currentUnit % 25);
      const birthMonth = ((currentUnit % 12) + 1).toString().padStart(2, '0');
      const birthDay = ((currentUnit % 28) + 1).toString().padStart(2, '0');
      const icNew = `${birthYear}${birthMonth}${birthDay}-02-${(5000 + (currentUnit % 4500)).toString().padStart(4, '0')}`;
      
      const hasOldId = currentUnit % 4 === 0;
      const isPolice = currentUnit % 8 === 0;
      const isArmy = currentUnit % 12 === 0;
      const icOld = isPolice 
        ? `RF ${(34000 + (currentUnit % 60000)).toString()}`
        : isArmy 
        ? `T ${(70000 + (currentUnit % 25000)).toString()}`
        : hasOldId 
        ? `A ${(1800000 + currentUnit * 23).toString()}` 
        : null;

      // Telephone contacts
      const telMobile = `01${(2 + (currentUnit % 8))}-${(3000000 + (currentUnit * 973) % 6999999)}`;
      const telFixed = currentUnit % 3 === 0 ? `04-7${(300000 + (currentUnit * 43) % 99999)}` : null;

      const mailingAddress = `No. ${houseNo}, ${streetName}, Taman Seri Gedung, 08000 Sungai Petani, Kedah`;
      const loanProvider = LOAN_PROVIDERS[currentUnit % LOAN_PROVIDERS.length];

      // Arrears: ~40% have cukai pintu arrears
      const hasArrears = currentUnit % 5 === 0 || currentUnit % 7 === 0;
      const cukaiArrears = hasArrears ? Number(((currentUnit * 17.5) % 3400 + 180).toFixed(2)) : 0.00;

      // Site Condition:
      // ~29% Abandoned, ~54% Occupied, ~7% Renovation, ~10% Unknown
      let siteCondition: SiteCondition = 'Occupied';
      let siteDescription = 'Occupied residential unit. Tiled porch, working TNB electricity meter and running water.';
      let photos: string[] = [SITE_PHOTOS.occupiedRenovated];

      if (currentUnit % 7 === 0 || currentUnit % 13 === 0 || [376, 335, 154, 88, 12, 219, 412].includes(currentUnit)) {
        siteCondition = 'Abandon';
        if (currentUnit % 2 === 0) {
          siteDescription = 'Vacant and severely neglected. Roof tiles dislodged with active water ingress. Dense weed growth covering front car porch. TNB meter removed by utility company.';
          photos = [SITE_PHOTOS.dilapidatedRoof, SITE_PHOTOS.abandonedWeeds];
        } else {
          siteDescription = 'Unoccupied landed property. Wild overgrown vegetation across driveway. Iron grille gate rusted. No active electrical meter connected.';
          photos = [SITE_PHOTOS.abandonedWeeds, SITE_PHOTOS.streetView];
        }
      } else if (currentUnit % 19 === 0) {
        siteCondition = 'Renovation';
        siteDescription = 'Ongoing contractor refurbishment. Scaffolding and sandbags on porch. New zinc roofing installation in progress.';
        photos = [SITE_PHOTOS.streetView];
      } else if (currentUnit % 15 === 0) {
        siteCondition = 'Unknown';
        siteDescription = 'Gate locked, shuttered windows. Unclear if tenant or owner resides. Neighbor reports intermittent visits.';
        photos = [SITE_PHOTOS.streetView];
      }

      // Tracing status
      let tracingStatus: TracingStatus = 'Pending Outreach';
      if ([376, 335].includes(currentUnit)) {
        tracingStatus = 'Negotiating Transfer';
      } else if ([154, 88].includes(currentUnit)) {
        tracingStatus = 'Follow-up Required';
      } else if ([12, 240, 510].includes(currentUnit)) {
        tracingStatus = 'Contact Established';
      } else if ([45, 102, 305].includes(currentUnit)) {
        tracingStatus = 'Completed';
      } else if (currentUnit % 11 === 0 && siteCondition === 'Abandon') {
        tracingStatus = 'Untraceable';
      } else if (currentUnit % 6 === 0) {
        tracingStatus = 'Follow-up Required';
      } else if (currentUnit % 8 === 0) {
        tracingStatus = 'Contact Established';
      }

      // House type
      const isCorner = currentUnit % 16 === 1 || currentUnit % 16 === 0;
      const isEnd = currentUnit % 8 === 0 && !isCorner;
      const houseType = isCorner 
        ? '1-S Terrace (Corner)' 
        : isEnd 
        ? '1-S Terrace (End Lot)' 
        : '1-S Terrace (Intermediate)';

      // Current registered owner (if sub-sale occurred)
      const currentOwner = (currentUnit % 9 === 0) ? `Sub-sale: ${allNames[(currentUnit * 3) % allNames.length]}` : primaryName;

      // Historical status
      const historicalStatus = (currentUnit % 6 === 0)
        ? 'Loan approved yet to execute. 1988 master title deed held at Pejabat Tanah.'
        : (currentUnit % 10 === 0)
        ? 'Caveat entered by creditor 1994. Pending probate clearance.'
        : 'Completed 1988 SPA. Bank loan fully serviced.';

      const caseAdminNotes = (tracingStatus === 'Negotiating Transfer')
        ? 'Original purchaser deceased. Waris child consented to Borang 14A execution with appointed panel law firm.'
        : (tracingStatus === 'Untraceable')
        ? 'Letters returned undelivered. Phone disconnected. Land registry search yielded no updated address.'
        : (cukaiArrears > 1500)
        ? `Notice of demand issued by Majlis Perbandaran Sungai Petani (MPSPK) for RM ${cukaiArrears.toFixed(2)} arrears.`
        : null;

      const propertyId = `prop-${houseNo.padStart(4, '0')}`;

      const prop: Property = {
        id: propertyId,
        house_no: houseNo,
        lot_no_dev: lotDevNo,
        cadastral_lot_no: cadastralLot,
        geran_no: geranNo,
        hsd_no: hsdNo,
        pt_no: ptNo,
        street_name: streetName,
        buyer_primary: primaryName,
        buyer_secondary: secondaryName,
        ic_new: icNew,
        ic_old_police_army: icOld,
        tel_mobile: telMobile,
        tel_fixed: telFixed,
        mailing_address: mailingAddress,
        loan_provider: loanProvider,
        historical_status: historicalStatus,
        current_registered_owner: currentOwner,
        cukai_pintu_arrears: cukaiArrears,
        case_admin_notes: caseAdminNotes,
        site_condition: siteCondition,
        site_description: siteDescription,
        site_photo_urls: photos,
        site_survey_date: '2021-04-18',
        house_type_category: houseType,
        tracing_status: tracingStatus,
        created_at: '2021-01-10T08:00:00.000Z',
        updated_at: '2026-10-15T14:30:00.000Z',
      };

      properties.push(prop);

      // Add realistic interaction logs for specific properties and a selection of others
      if (currentUnit === 376) {
        // Detailed log matching user brief for House 376
        interactions.push(
          {
            id: 'log-376-1',
            property_id: propertyId,
            house_no: '376',
            interaction_timestamp: '2026-08-14T09:30:00.000Z',
            party_contacted: 'Azman bin Othman',
            relationship: 'Waris (Child)',
            phone_dialed: '012-4829104',
            channel: 'Phone Call',
            outcome: 'Follow-up Required',
            detailed_notes: 'Spoke with En. Azman, eldest son of late original buyer. He confirmed father passed away in 2018. Family is interested in settling the revitalization transfer and requested formal briefing on Borang 14A execution.',
            next_follow_up_date: '2026-08-28',
            docs_collected_urls: ['https://drive.google.com/file/d/death-cert-sample-376'],
            recorded_by: 'Mirra Lakeside',
            created_at: '2026-08-14T09:35:00.000Z',
          },
          {
            id: 'log-376-2',
            property_id: propertyId,
            house_no: '376',
            interaction_timestamp: '2026-09-02T11:15:00.000Z',
            party_contacted: 'Usha a/p Muthusamy',
            relationship: 'Peguam',
            phone_dialed: '04-7338190',
            channel: 'WhatsApp',
            outcome: 'Agreed to Borang 14A',
            detailed_notes: 'Coordinated with family appointed legal counsel Cik Usha. Received scanned Letter of Administration (Surat Kuasa Mentadbir). Scheduled appointment for heirs to sign Borang 14A Memorandum of Transfer.',
            next_follow_up_date: '2026-11-20',
            docs_collected_urls: [
              'https://drive.google.com/file/d/borang-14a-draft-376',
              'https://drive.google.com/file/d/ic-copy-waris-376'
            ],
            recorded_by: 'Mirra Lakeside',
            created_at: '2026-09-02T11:20:00.000Z',
          }
        );
      } else if (currentUnit === 335) {
        interactions.push(
          {
            id: 'log-335-1',
            property_id: propertyId,
            house_no: '335',
            interaction_timestamp: '2026-07-10T14:00:00.000Z',
            party_contacted: 'Tan Ah Kow',
            relationship: 'Original Buyer',
            phone_dialed: '019-4412981',
            channel: 'Physical Visit',
            outcome: 'Follow-up Required',
            detailed_notes: 'Field visit conducted at old residence. Met Mr. Tan in person. He still holds original 1988 SPA sales contract. Willing to negotiate transfer upon waiver of outstanding cukai pintu assessment fees.',
            next_follow_up_date: '2026-11-15',
            docs_collected_urls: ['https://drive.google.com/file/d/spa-1988-contract-335'],
            recorded_by: 'Hafiz Razak',
            created_at: '2026-07-10T14:15:00.000Z',
          }
        );
      } else if (currentUnit === 154) {
        interactions.push(
          {
            id: 'log-154-1',
            property_id: propertyId,
            house_no: '154',
            interaction_timestamp: '2026-06-22T10:00:00.000Z',
            party_contacted: 'Pn. Rohani binti Mat Saman',
            relationship: 'Waris (Spouse)',
            phone_dialed: '013-4921045',
            channel: 'Phone Call',
            outcome: 'Follow-up Required',
            detailed_notes: 'Called widow Pn. Rohani. She confirmed property has been vacant since 2012. Needs consultation with other 3 surviving children before executing Borang 14A.',
            next_follow_up_date: '2026-11-30',
            docs_collected_urls: [],
            recorded_by: 'Mirra Lakeside',
            created_at: '2026-06-22T10:10:00.000Z',
          }
        );
      } else if (currentUnit % 25 === 0) {
        interactions.push({
          id: `log-${currentUnit}-1`,
          property_id: propertyId,
          house_no: houseNo,
          interaction_timestamp: '2026-08-01T15:00:00.000Z',
          party_contacted: primaryName,
          relationship: 'Original Buyer',
          phone_dialed: telMobile,
          channel: 'Phone Call',
          outcome: 'Follow-up Required',
          detailed_notes: 'Initial outreach call completed. Briefed registered proprietor regarding Taman Seri Gedung estate revival program and title regularization.',
          next_follow_up_date: '2026-12-05',
          docs_collected_urls: [],
          recorded_by: 'Mirra Lakeside',
          created_at: '2026-08-01T15:05:00.000Z',
        });
      }

      currentUnit++;
    }
  }

  return { properties, interactions };
}
