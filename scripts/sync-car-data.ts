/**
 * Car Data Sync Script
 *
 * This script fetches car data from external APIs and updates the local database.
 * Run periodically to keep data current. Falls back to existing data on API failures.
 *
 * Usage:
 *   npx ts-node scripts/sync-car-data.ts
 *   npm run sync-data
 *
 * APIs used:
 *   - NHTSA vPIC API (free, for VIN decoding and basic vehicle info)
 *   - FuelEconomy.gov (free, for MPG data)
 *   - CarQuery API (free, for dimensions and specs)
 */

import * as fs from "fs";
import * as path from "path";

interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyWidthInches: number;
  mirrorWidthInches?: number;
  lengthInches?: number;
  heightInches?: number;
  seats: number;
  doors: number;
  cargoVolumesCuFt?: number;
  fuelType: "gasoline" | "hybrid" | "electric" | "diesel" | "plug-in-hybrid";
  plugType: "J1772" | "CCS1" | "CHAdeMO" | "NACS" | "Tesla" | "none";
  mpgCity?: number;
  mpgHighway?: number;
  mpgCombined?: number;
  mpge?: number;
  electricRangeMiles?: number;
  msrp?: number;
  usedPriceLow?: number;
  usedPriceHigh?: number;
  standardFeatures?: string[];
  notes?: string;
  lastUpdated: string;
  dataSource?: string;
}

interface CarDatabase {
  cars: Car[];
  lastSyncDate: string;
  mirrorBuffer: number;
}

const DATA_FILE = path.join(__dirname, "../src/data/cars.json");
const BACKUP_FILE = path.join(__dirname, "../src/data/cars.backup.json");

// API endpoints
const NHTSA_API = "https://vpic.nhtsa.dot.gov/api/vehicles";
const FUELECONOMY_API = "https://www.fueleconomy.gov/ws/rest";

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchFuelEconomyData(
  year: number,
  make: string,
  model: string
): Promise<Partial<Car> | null> {
  try {
    // Get vehicle ID first
    const menuUrl = `${FUELECONOMY_API}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    const menuResponse = await fetchWithTimeout(menuUrl, {
      headers: { Accept: "application/json" },
    });

    if (!menuResponse.ok) {
      console.log(`  FuelEconomy API returned ${menuResponse.status} for ${year} ${make} ${model}`);
      return null;
    }

    const menuData = await menuResponse.json();
    const menuResult = menuData?.menuItem;
    if (!menuResult) {
      console.log(`  No FuelEconomy data found for ${year} ${make} ${model}`);
      return null;
    }

    // Get first vehicle option
    const vehicleId = Array.isArray(menuResult) ? menuResult[0]?.value : menuResult?.value;
    if (!vehicleId) return null;

    // Fetch detailed vehicle data
    const vehicleUrl = `${FUELECONOMY_API}/vehicle/${vehicleId}`;
    const vehicleResponse = await fetchWithTimeout(vehicleUrl, {
      headers: { Accept: "application/json" },
    });

    if (!vehicleResponse.ok) return null;

    const vehicleData = await vehicleResponse.json();

    return {
      mpgCity: vehicleData.city08 ? parseInt(vehicleData.city08) : undefined,
      mpgHighway: vehicleData.highway08 ? parseInt(vehicleData.highway08) : undefined,
      mpgCombined: vehicleData.comb08 ? parseInt(vehicleData.comb08) : undefined,
      mpge: vehicleData.combE ? parseInt(vehicleData.combE) : undefined,
      electricRangeMiles: vehicleData.range ? parseInt(vehicleData.range) : undefined,
    };
  } catch (error) {
    console.log(`  FuelEconomy API error for ${year} ${make} ${model}:`, (error as Error).message);
    return null;
  }
}

async function fetchNHTSAData(
  year: number,
  make: string,
  model: string
): Promise<Partial<Car> | null> {
  try {
    const url = `${NHTSA_API}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.log(`  NHTSA API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    // NHTSA provides limited data, mainly used for validation
    const results = data.Results || [];
    const match = results.find(
      (r: { Model_Name: string }) =>
        r.Model_Name?.toLowerCase() === model.toLowerCase()
    );

    if (match) {
      return {
        make: match.Make_Name || make,
        model: match.Model_Name || model,
      };
    }

    return null;
  } catch (error) {
    console.log(`  NHTSA API error:`, (error as Error).message);
    return null;
  }
}

function loadCurrentData(): CarDatabase {
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    console.error("Failed to load current data file");
    process.exit(1);
  }
}

function backupCurrentData(data: CarDatabase): void {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
    console.log(`Backup saved to ${BACKUP_FILE}`);
  } catch (error) {
    console.error("Failed to create backup:", error);
  }
}

function saveData(data: CarDatabase): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${DATA_FILE}`);
  } catch (error) {
    console.error("Failed to save data:", error);
  }
}

async function syncCar(car: Car): Promise<Car> {
  console.log(`Syncing: ${car.year} ${car.make} ${car.model}`);

  // Skip manually-entered data that shouldn't be overwritten
  if (car.dataSource === "manual") {
    console.log(`  Skipping manual entry`);
    return car;
  }

  const updatedCar = { ...car };
  let hasUpdates = false;

  // Fetch fuel economy data
  const fuelData = await fetchFuelEconomyData(car.year, car.make, car.model);
  if (fuelData) {
    if (fuelData.mpgCity !== undefined) updatedCar.mpgCity = fuelData.mpgCity;
    if (fuelData.mpgHighway !== undefined) updatedCar.mpgHighway = fuelData.mpgHighway;
    if (fuelData.mpgCombined !== undefined) updatedCar.mpgCombined = fuelData.mpgCombined;
    if (fuelData.mpge !== undefined) updatedCar.mpge = fuelData.mpge;
    if (fuelData.electricRangeMiles !== undefined)
      updatedCar.electricRangeMiles = fuelData.electricRangeMiles;
    hasUpdates = true;
    console.log(`  Updated fuel economy data`);
  }

  // Validate with NHTSA (optional, mainly for data verification)
  const nhtsaData = await fetchNHTSAData(car.year, car.make, car.model);
  if (nhtsaData) {
    console.log(`  Validated with NHTSA`);
  }

  if (hasUpdates) {
    updatedCar.lastUpdated = new Date().toISOString().split("T")[0];
    updatedCar.dataSource = "api-sync";
  }

  // Rate limiting - be nice to the APIs
  await new Promise((resolve) => setTimeout(resolve, 500));

  return updatedCar;
}

async function main() {
  console.log("=== Car Data Sync Script ===\n");

  // Load current data
  const currentData = loadCurrentData();
  console.log(`Loaded ${currentData.cars.length} cars from database\n`);

  // Create backup
  backupCurrentData(currentData);

  // Sync each car
  const updatedCars: Car[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const car of currentData.cars) {
    try {
      const updatedCar = await syncCar(car);
      updatedCars.push(updatedCar);
      successCount++;
    } catch (error) {
      console.error(`  Error syncing ${car.id}:`, error);
      updatedCars.push(car); // Keep original on error
      errorCount++;
    }
  }

  // Save updated data
  const updatedData: CarDatabase = {
    cars: updatedCars,
    lastSyncDate: new Date().toISOString().split("T")[0],
    mirrorBuffer: currentData.mirrorBuffer,
  };

  saveData(updatedData);

  console.log(`\n=== Sync Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Last sync date: ${updatedData.lastSyncDate}`);
}

main().catch(console.error);
