import { NextRequest, NextResponse } from "next/server";
import { oneRampApi } from "@/constants";
import fs from "fs/promises";
import path from "path";

const INSTITUTIONS_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "institutions.json"
);

interface Institution {
  name: string;
}

interface InstitutionsData {
  lastUpdated: string;
  institutions: Record<string, Record<string, Institution[]>>;
}

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (you can add your own auth logic here)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add your own token validation here
    // const token = authHeader.replace("Bearer ", "");
    // if (token !== process.env.ADMIN_TOKEN) {
    //   return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    // }

    const countries = [
      "NG", // Nigeria
      "KE", // Kenya
      "UG", // Uganda
      "GHA", // Ghana
      "ZM", // Zambia
      "TZ", // Tanzania
      "ZA", // South Africa
    ];

    const methods = ["buy", "sell"];
    const updatedInstitutions: Record<
      string,
      Record<string, Institution[]>
    > = {};

    // Fetch institutions for each country and method
    for (const country of countries) {
      updatedInstitutions[country] = {};

      for (const method of methods) {
        try {
          const response = await oneRampApi.get(
            `/institutions/${country}/${method}`
          );
          updatedInstitutions[country][method] = response.data;
        } catch {
          // Continue with other countries even if one fails
          updatedInstitutions[country][method] = [];
        }
      }
    }

    // Create the updated data structure
    const updatedData: InstitutionsData = {
      lastUpdated: new Date().toISOString(),
      institutions: updatedInstitutions,
    };

    // Write to the JSON file
    await fs.writeFile(
      INSTITUTIONS_FILE_PATH,
      JSON.stringify(updatedData, null, 2),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: "Institutions data updated successfully",
      lastUpdated: updatedData.lastUpdated,
      countriesUpdated: countries.length,
      totalInstitutions: Object.values(updatedInstitutions).reduce(
        (total, countryData) =>
          total +
          Object.values(countryData).reduce(
            (countryTotal, institutions) => countryTotal + institutions.length,
            0
          ),
        0
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update institutions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const fileContent = await fs.readFile(INSTITUTIONS_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent) as InstitutionsData;

    return NextResponse.json({
      success: true,
      lastUpdated: data.lastUpdated,
      countries: Object.keys(data.institutions),
      totalInstitutions: Object.values(data.institutions).reduce(
        (total: number, countryData: Record<string, Institution[]>) =>
          total +
          Object.values(countryData).reduce(
            (countryTotal: number, institutions: Institution[]) =>
              countryTotal + institutions.length,
            0
          ),
        0
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read institutions file" },
      { status: 500 }
    );
  }
}
