/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Taman Seri Gedung - Seed and CSV Import Script
 * Usage: npx tsx scripts/seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateSeedData } from '../src/data/seedGenerator.ts';
import { exportPropertiesToMasterCsv, exportInteractionsToCsv, parseMasterCsv } from '../src/utils/csvUtils.ts';

export { exportPropertiesToMasterCsv, exportInteractionsToCsv, parseMasterCsv };

// Generate data if run directly via Node / tsx CLI
if (typeof process !== 'undefined' && Array.isArray(process?.argv) && process.argv.length > 1 && process.argv[1]?.includes('seed.ts')) {
  console.log('Generating Taman Seri Gedung 637-unit seed dataset...');
  const { properties, interactions } = generateSeedData();

  const outDir = path.resolve(process.cwd(), 'seed_data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const masterCsv = exportPropertiesToMasterCsv(properties);
  const interactionsCsv = exportInteractionsToCsv(interactions);

  fs.writeFileSync(path.join(outDir, 'Master_Database.csv'), masterCsv);
  fs.writeFileSync(path.join(outDir, 'Detail_Listing.csv'), masterCsv);
  fs.writeFileSync(path.join(outDir, 'Interaction_Logs.csv'), interactionsCsv);

  console.log(`Successfully generated:`);
  console.log(`- ${properties.length} Properties in seed_data/Master_Database.csv & Detail_Listing.csv`);
  console.log(`- ${interactions.length} Initial Outreach Interactions in seed_data/Interaction_Logs.csv`);
}
