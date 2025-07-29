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
      console.log(`🔍 Looking for cache file at: ${INSTITUTIONS_FILE_PATH}`);
      const fileContent = await fs.readFile(INSTITUTIONS_FILE_PATH, "utf-8");
      const data = JSON.parse(fileContent) as InstitutionsData;

      console.log(
        `📋 Available countries in cache: ${Object.keys(data.institutions).join(
          ", "
        )}`
      );
      console.log(`🔍 Looking for country: ${country}, method: ${method}`);

      const countryInstitutions = data.institutions[country];
      if (countryInstitutions && countryInstitutions[method]) {
        console.log(
          `✅ Loaded ${countryInstitutions[method].length} institutions for ${country} - ${method} from cache`
        );
        return countryInstitutions[method];
      } else {
        console.log(
          `❌ Country ${country} or method ${method} not found in cache`
        );
        console.log(
          `📋 Available methods for ${country}: ${
            countryInstitutions
              ? Object.keys(countryInstitutions).join(", ")
              : "none"
          }`
        );
      }
    } catch (error) {
      console.log(
        `⚠️ Could not read institutions from cache for ${country} - ${method}, falling back to API`
      );
      console.log(`❌ Error details:`, error);
    }

    // Fallback to API if JSON file doesn't exist or doesn't have the data
    console.log(
      `🔄 Fetching institutions for ${country} - ${method} from API...`
    );
    const response = await oneRampApi.get(`/institutions/${country}/${method}`);
    console.log(
      `✅ Fetched ${response.data.length} institutions for ${country} - ${method} from API`
    );
    return response.data;
  } catch (error) {
    console.error(
      `❌ Error fetching institutions for ${country} - ${method}:`,
      error
    );
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

    console.log(`🔍 Cache lookup: ${country} - ${method}`);

    // Read file asynchronously but still very fast
    const fileContent = await fs.readFile(INSTITUTIONS_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent) as InstitutionsData;

    console.log(
      `📋 Available countries in cache: ${Object.keys(data.institutions).join(
        ", "
      )}`
    );

    const countryInstitutions = data.institutions[country];
    if (countryInstitutions && countryInstitutions[method]) {
      console.log(
        `✅ Cache hit: Found ${countryInstitutions[method].length} institutions for ${country} - ${method}`
      );
      return countryInstitutions[method];
    }

    console.log(`❌ Cache miss: No data for ${country} - ${method}`);
    return [];
  } catch (error) {
    console.error("Failed to load institutions from cache:", error);
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
