/**
 * Add Slate Auto vehicles to the database.
 *
 * Slate is a Bezos-backed EV startup building a deliberately minimal compact
 * electric pickup in Warsaw, Indiana. Deliveries begin Q4 2026 as a 2027 model,
 * so these are PRE-PRODUCTION entries: several fields the rest of the database
 * always carries simply do not exist yet for this vehicle, and are omitted
 * rather than estimated. See OMITTED below.
 *
 * Specs reflect the revised powertrain Slate announced after launch ("New,
 * longer range. Same price"), not the original April 2025 figures:
 *   launch  -> 52.7/84.3 kWh, 150/240 mi, 201 hp, 1,000 lb towing
 *   current -> 65 kWh LFP,    205 mi,     181 hp, 2,000 lb towing
 *
 * Sources: slate.auto, en.wikipedia.org/wiki/Slate_Truck,
 *          motor1.com, cargurus.com, insideevs.com
 *
 * OMITTED (not published by Slate as of 2026-08-10):
 *   mirrorWidthInches / mirrorsFoldedWidthInches - no mirror-inclusive width.
 *     The app falls back to bodyWidth + mirrorBuffer (70.6 + 8 = 78.6"), which
 *     keeps the estimate in one documented place instead of baking a guessed
 *     figure into the dataset. Garage fit is this app's core feature; a made-up
 *     width is worse than a declared fallback.
 *   groundClearanceInches, driverLegroomInches - not published.
 *   mpge - no EPA rating exists for a vehicle that has not shipped.
 *   leaseRating, depreciationCategory, fiveYearResalePercent,
 *   reliabilityRating, insuranceCostAnnual, maintenanceCostAnnual - all are
 *     historical/actuarial measures. A vehicle with no sales has none.
 *   cargoVolumesCuFt on the SUV - Slate publishes bed volume for the truck
 *     (37 cu ft) but no cargo figure for the SUV configuration.
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'cars.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Slate ships no driver-assistance suite beyond the mandated basics: eight
// airbags, active emergency braking and forward collision warning. There is no
// adaptive cruise, no lane keeping, no blind-spot monitoring — so the ADAS
// level is "none", not "basic".
const SLATE_ADAS = {
  adaptiveCruiseControl: false,
  laneKeepAssist: false,
  laneCenteringAssist: false,
  blindSpotMonitoring: false,
  automaticEmergencyBraking: true,
  trafficSignRecognition: false,
  driverMonitoring: false,
  autoLaneChange: false,
  summonParking: false,
  handsFreeHighway: false,
  cityAutopilot: false,
  autoFoldingMirrors: false,
};

const SHARED = {
  year: 2027,
  make: 'Slate',
  model: 'Truck',
  bodyWidthInches: 70.6,
  lengthInches: 174.6,
  fuelType: 'electric',
  plugType: 'NACS',
  electricRangeMiles: 205,
  safetyRating: 'Not Rated',
  autonomousLevel: 'none',
  adasName: 'None',
  adasFeatures: SLATE_ADAS,
  zeroToSixtySeconds: 8.0,
  horsepower: 181,
  torqueLbFt: 195,
  lastUpdated: '2026-08-10',
  dataSource: 'slate.auto',
};

const slateCars = [
  {
    ...SHARED,
    id: 'slate-truck-2027',
    trim: 'Base',
    bodyType: 'truck',
    heightInches: 68.0,
    seats: 2,
    doors: 2,
    cargoVolumesCuFt: 37,
    towingCapacityLbs: 2000,
    msrp: 24950,
    standardFeatures: [
      'Eight airbags',
      'Active Emergency Braking',
      'Forward Collision Warning',
      '5-ft cargo bed',
      '7 cu ft frunk',
    ],
    notes:
      'Pre-production; deliveries from Q4 2026. Two-seat compact electric pickup, ' +
      '65 kWh LFP battery, 1,550 lb payload. Unpainted injection-moulded body panels ' +
      'and no infotainment screen by design. Mirror-inclusive width, ground clearance ' +
      'and EPA MPGe not yet published.',
  },
  {
    ...SHARED,
    id: 'slate-truck-suv-2027',
    trim: 'Squareback SUV',
    bodyType: 'suv',
    heightInches: 67.5,
    seats: 5,
    doors: 3,
    towingCapacityLbs: 1824,
    msrp: 29950,
    standardFeatures: [
      'Eight airbags',
      'Active Emergency Braking',
      'Forward Collision Warning',
      'Roll cage',
      'Rear bench seat',
      '7 cu ft frunk',
    ],
    notes:
      'Pre-production; deliveries from Q4 2026. The SUV kit converts the two-seat ' +
      'truck into a five-seat SUV, adding a roll cage, rear bench and side curtain ' +
      'airbags. 1,263 lb payload. Cargo volume, mirror-inclusive width, ground ' +
      'clearance and EPA MPGe not yet published.',
  },
];

const existing = new Set(data.cars.map((c) => c.id));
const added = [];
const skipped = [];

for (const car of slateCars) {
  if (existing.has(car.id)) {
    skipped.push(car.id);
    continue;
  }
  data.cars.push(car);
  added.push(car.id);
}

data.lastSyncDate = '2026-08-10';

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log(`Added ${added.length} Slate vehicle(s): ${added.join(', ') || '(none)'}`);
if (skipped.length) console.log(`Skipped (already present): ${skipped.join(', ')}`);
console.log(`Total cars: ${data.cars.length}`);
console.log(`Last sync date: ${data.lastSyncDate}`);
