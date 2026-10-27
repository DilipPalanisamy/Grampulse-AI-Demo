import { findCensusRecord, getTopCensusRecords } from '../src/services/censusDirectoryService.js';

const testQueries = [
  ['Avinashi', 'Tiruppur'],
  ['931950', 'Tiruppur'],
  ['804021', 'Tiruppur'],
  ['Alathur', 'Tiruppur'],
  ['Karavalur', 'Tiruppur'],
  ['Palangarai', 'Tiruppur'],
  ['Perumanallur', 'Tiruppur'],
  ['Pongalur', 'Tiruppur'],
  ['Kangeyam', 'Tiruppur'],
  ['Dharapuram', 'Tiruppur'],
  ['Udumalaipettai', 'Tiruppur'],
  ['Madathukulam', 'Tiruppur']
];

console.log("=== TESTING TIRUPPUR CENSUS DIRECTORY LOOKUP ===");
for (const [q, dist] of testQueries) {
  const r = findCensusRecord(q, dist);
  if (r) {
    console.log(`SUCCESS: '${q}' -> ${r.village_name} (${r.location_type}, ${r.district}) | Census Code: ${r.census_code} | Pop: ${r.population} | HH: ${r.households} | Elec: ${r.electricity_coverage} | Water: ${r.tap_water_coverage}`);
  } else {
    console.log(`FAILED: '${q}' not found`);
  }
}

console.log("\n=== TOP CENSUS RECORDS FOR TIRUPPUR (First 10) ===");
const topTiruppur = getTopCensusRecords(10, 'Tiruppur');
for (const t of topTiruppur) {
  console.log(`${t.census_code} | ${t.village_name} (${t.location_type}) | Pop: ${t.population} | HH: ${t.households} | Elec: ${t.electricity_coverage}%`);
}
