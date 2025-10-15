import axios from "axios";

export const MOCK_TRANSACTIONS = false;
export const MOCK_NIGERIAN_PHONE_NUMBER_SUCCESS = "+2341111111111";
export const MOCK_NIGERIAN_PHONE_NUMBER_FAILED = "+2340000000000";
export const MOCK_NIGERIAN_ACCOUNT_NUMBER_SUCCESS = "1111111111";
export const MOCK_NIGERIAN_ACCOUNT_NUMBER_FAILED = "0000000000";

// Feature flags
// Toggle to bypass Nigerian phone number validation in Buy flow
export const BYPASS_NG_PHONE_VALIDATION = true;

// BETA URLS
export const ONERAMP_API_URL = process.env.ONERAMP_API_URL;
export const KYC_REDIRECT_URL = "https://mini.oneramp.io";
// export const KYC_REDIRECT_URL =
//   "https://farcaster.xyz/miniapps/IFyB1NW3qMPb/oneramp";

export const oneRampApi = axios.create({
  baseURL: ONERAMP_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.ONERAMP_API_KEY}`,
  },
});

// Create a oneRampApi with a custom headers passed in
export const oneRampApiWithCustomHeaders = (
  headers: Record<string, string>
) => {
  return axios.create({
    baseURL: ONERAMP_API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ONERAMP_API_KEY}`,
      ...headers,
    },
  });
};
