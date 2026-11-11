/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { relations } from 'drizzle-orm';
import { integer, numeric, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Users table linked directly to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('field_officer'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Master properties table for Taman Seri Gedung 637 parcels
export const properties = pgTable('properties', {
  id: text('id').primaryKey(),
  houseNo: text('house_no').notNull().unique(),
  lotNoDev: text('lot_no_dev'),
  cadastralLotNo: text('cadastral_lot_no').notNull(),
  geranNo: text('geran_no'),
  hsdNo: text('hsd_no'),
  ptNo: text('pt_no'),
  streetName: text('street_name').notNull(),
  buyerPrimary: text('buyer_primary').notNull(),
  buyerSecondary: text('buyer_secondary'),
  icNew: text('ic_new'),
  icOldPoliceArmy: text('ic_old_police_army'),
  telMobile: text('tel_mobile'),
  telFixed: text('tel_fixed'),
  mailingAddress: text('mailing_address'),
  loanProvider: text('loan_provider'),
  historicalStatus: text('historical_status'),
  currentRegisteredOwner: text('current_registered_owner'),
  cukaiPintuArrears: numeric('cukai_pintu_arrears', { precision: 10, scale: 2 }).default('0.00'),
  caseAdminNotes: text('case_admin_notes'),
  siteCondition: text('site_condition').notNull().default('Unknown'),
  siteDescription: text('site_description'),
  sitePhotoUrls: text('site_photo_urls').array(),
  siteSurveyDate: text('site_survey_date'),
  houseTypeCategory: text('house_type_category'),
  tracingStatus: text('tracing_status').notNull().default('Pending Outreach'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Outreach audit logs (1-to-many with properties)
export const interactionLogs = pgTable('interaction_logs', {
  id: text('id').primaryKey(),
  propertyId: text('property_id')
    .references(() => properties.id, { onDelete: 'cascade' })
    .notNull(),
  houseNo: text('house_no').notNull(),
  interactionTimestamp: timestamp('interaction_timestamp').defaultNow(),
  partyContacted: text('party_contacted').notNull(),
  relationship: text('relationship').notNull(),
  phoneDialed: text('phone_dialed'),
  channel: text('channel').notNull(),
  outcome: text('outcome').notNull(),
  detailedNotes: text('detailed_notes').notNull(),
  nextFollowUpDate: text('next_follow_up_date'),
  docsCollectedUrls: text('docs_collected_urls').array(),
  recordedBy: text('recorded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  interactions: many(interactionLogs),
}));

export const interactionLogsRelations = relations(interactionLogs, ({ one }) => ({
  property: one(properties, {
    fields: [interactionLogs.propertyId],
    references: [properties.id],
  }),
}));
