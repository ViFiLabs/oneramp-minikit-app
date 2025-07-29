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
