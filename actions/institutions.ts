"use server";

import { oneRampApi } from "@/constants";
import { VerifyAccountDetailsRequest } from "@/types";
import fs from "fs/promises";
import path from "path";

const INSTITUTIONS_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "institutions.json"
);

interface Institution {
  name: string;
  code: string;
  status: string;
  accountNumberType: string;
  country: string;
  bankId: string;
  id: string;
  seerbitId: string;
  countryAccountNumberType: string;
  createdAt: string;
  updatedAt: string;
  featureFlagEnabled: string[];
  tempDisabledFor: string[];
  channelIds: string[];
  [key: string]: string | string[] | number | boolean;
}

interface InstitutionsData {
  lastUpdated: string;
  institutions: Record<string, Record<string, Institution[]>>;
}

export async function getInstitutions(country: string, method = "buy") {
  try {
    if (!country) {
      throw new Error("Country is required");
    }

    // Try to read from JSON file first for fast loading
    try {
      const fileContent = await fs.readFile(INSTITUTIONS_FILE_PATH, "utf-8");
      const data = JSON.parse(fileContent) as InstitutionsData;

      const countryInstitutions = data.institutions[country];
      if (countryInstitutions && countryInstitutions[method]) {
        return countryInstitutions[method];
      }
    } catch {
      // Fallback to API if cache read fails
    }

    // Fallback to API if JSON file doesn't exist or doesn't have the data
    const response = await oneRampApi.get(`/institutions/${country}/${method}`);
    return response.data;
  } catch {
    return [];
  }
}

// Fast cache access for instant loading
export async function getInstitutionsSync(
  country: string,
  method = "buy"
): Promise<Institution[]> {
  try {
    if (!country) return [];

    // Read file asynchronously but still very fast
    const fileContent = await fs.readFile(INSTITUTIONS_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent) as InstitutionsData;

    const countryInstitutions = data.institutions[country];
    if (countryInstitutions && countryInstitutions[method]) {
      return countryInstitutions[method];
    }

    return [];
  } catch {
    return [];
  }
}

export async function verifyAccountDetails(
  payload: VerifyAccountDetailsRequest
) {
  try {
    if (!payload.bankId || !payload.accountNumber || !payload.currency) {
      return new Error("Invalid payload", { cause: payload });
    }

    const response = await oneRampApi.post("/bank/verify/account", payload);

    return response.data;
  } catch (error) {
    return new Error("Failed to verify account details", { cause: error });
  }
}

export async function updateInstitutionsCache() {
  try {
    console.log("🔄 Updating institutions cache...");

    const countries = ["NG", "KE", "UG", "GHA", "ZM", "TZ", "ZA"];
    const methods = ["buy", "sell"];
    const institutions: Record<string, Record<string, Institution[]>> = {};

    // Fetch institutions for all countries and methods
    for (const country of countries) {
      institutions[country] = {};
      for (const method of methods) {
        try {
          const response = await oneRampApi.get(
            `/institutions/${country}/${method}`
          );
          institutions[country][method] = response.data;
          console.log(
            `✅ Fetched ${response.data.length} institutions for ${country}/${method}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to fetch institutions for ${country}/${method}:`,
            error
          );
          institutions[country][method] = [];
        }
      }
    }

    // Save to JSON file
    const data: InstitutionsData = {
      lastUpdated: new Date().toISOString(),
      institutions,
    };

    await fs.writeFile(INSTITUTIONS_FILE_PATH, JSON.stringify(data, null, 2));
    console.log("✅ Institutions cache updated successfully");

    // Generate client-side data file
    await generateClientSideData(data);

    return {
      success: true,
      lastUpdated: data.lastUpdated,
      countries: Object.keys(institutions),
      totalInstitutions: Object.values(institutions).reduce((acc, country) => {
        return (
          acc +
          Object.values(country).reduce((sum, method) => sum + method.length, 0)
        );
      }, 0),
    };
  } catch (error) {
    console.error("❌ Error updating institutions cache:", error);
    throw error;
  }
}

async function generateClientSideData(data: InstitutionsData) {
  try {
    const clientDataPath = path.join(
      process.cwd(),
      "lib",
      "institutions-data.ts"
    );

    const clientDataContent = `// Auto-generated file - do not edit manually
// Generated on: ${new Date().toISOString()}

export interface Institution {
  name: string;
  code: string;
  status: string;
  accountNumberType: string;
  country: string;
  bankId: string;
  id: string;
  seerbitId: string;
  countryAccountNumberType: string;
  createdAt: string;
  updatedAt: string;
  featureFlagEnabled: string[];
  tempDisabledFor: string[];
  channelIds: string[];
  [key: string]: string | string[] | number | boolean;
}

const INSTITUTIONS_DATA = ${JSON.stringify(data, null, 2)};

export function getInstitutionsClient(
  country: string,
  method = "buy"
): Institution[] {
  try {
    const countryInstitutions = INSTITUTIONS_DATA.institutions[country];
    if (countryInstitutions && countryInstitutions[method]) {
      return countryInstitutions[method];
    }
    return [];
  } catch {
    return [];
  }
}

export function getAllInstitutionsClient(): Record<string, Record<string, Institution[]>> {
  return INSTITUTIONS_DATA.institutions;
}

export function getLastUpdated(): string {
  return INSTITUTIONS_DATA.lastUpdated;
}
`;

    await fs.writeFile(clientDataPath, clientDataContent);
    console.log("✅ Client-side institutions data generated");
  } catch (error) {
    console.error("❌ Error generating client-side data:", error);
    throw error;
  }
}
