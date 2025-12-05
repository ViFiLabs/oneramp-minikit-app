import { z } from "zod";

// Helper to create amount validation with dynamic min/max
const createAmountSchema = (minAmount?: number, maxAmount?: number) => {
  let amountSchema = z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Amount must be a valid number greater than 0" }
    );

  if (minAmount !== undefined && maxAmount !== undefined) {
    amountSchema = amountSchema.refine(
      (val) => {
        const num = parseFloat(val);
        return num >= minAmount && num <= maxAmount;
      },
      {
        message: `Amount must be between ${minAmount.toLocaleString()} and ${maxAmount.toLocaleString()}`,
      }
    ) as typeof amountSchema;
  }

  return amountSchema;
};

// Buy Goods specific schema
export const buyGoodsSchema = (minAmount?: number, maxAmount?: number) =>
  z.object({
    selectedPaymentType: z.literal("Buy Goods"),
    amount: createAmountSchema(minAmount, maxAmount),
    tillNumber: z
      .string()
      .min(1, "Till number is required")
      .regex(/^\d+$/, "Till number must contain only digits")
      .refine((val) => val.length <= 10, {
        message: "Till number must be 10 digits or less",
      }),
    includeCashoutFees: z.boolean().default(false),
  });

// Paybill specific schema
export const paybillSchema = (minAmount?: number, maxAmount?: number) =>
  z.object({
    selectedPaymentType: z.literal("Paybill"),
    amount: createAmountSchema(minAmount, maxAmount),
    billNumber: z
      .string()
      .min(1, "Paybill number is required")
      .regex(/^\d+$/, "Paybill number must contain only digits")
      .refine((val) => val.length <= 10, {
        message: "Paybill number must be 10 digits or less",
      }),
    accountNumber: z
      .string()
      .min(1, "Business number is required")
      .regex(/^\d+$/, "Business number must contain only digits")
      .refine((val) => val.length <= 10, {
        message: "Business number must be 10 digits or less",
      }),
    includeCashoutFees: z.boolean().default(false),
  });

// Send Money specific schema
export const sendMoneySchema = (
  minAmount?: number,
  maxAmount?: number,
  requiresInstitution?: boolean
) =>
  z.object({
    selectedPaymentType: z.literal("Send Money"),
    amount: createAmountSchema(minAmount, maxAmount),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine((val) => val.length <= 10, {
        message: "Phone number must be 10 digits or less",
      }),
    accountName: z.string().min(1, "Account name is required"),
    ...(requiresInstitution
      ? {
          institution: z
            .object({
              name: z.string(),
              code: z.string().optional(),
            })
            .optional()
            .refine(
              (val) => val !== undefined && val !== null,
              { message: "Mobile money provider is required" }
            ),
        }
      : {}),
    includeCashoutFees: z.boolean().default(false),
  });

// Main schema factory function
export const createPaymentFormSchema = (
  paymentType: "Paybill" | "Buy Goods" | "Send Money",
  options?: {
    minAmount?: number;
    maxAmount?: number;
    requiresInstitution?: boolean;
  }
) => {
  const { minAmount, maxAmount, requiresInstitution } = options || {};

  switch (paymentType) {
    case "Buy Goods":
      return buyGoodsSchema(minAmount, maxAmount);
    case "Paybill":
      return paybillSchema(minAmount, maxAmount);
    case "Send Money":
      return sendMoneySchema(minAmount, maxAmount, requiresInstitution);
    default:
      throw new Error(`Unknown payment type: ${paymentType}`);
  }
};

// Base form type (without validation - for form state)
export type PaymentFormData = {
  selectedPaymentType: "Paybill" | "Buy Goods" | "Send Money";
  amount: string;
  includeCashoutFees?: boolean;
  // Buy Goods fields
  tillNumber?: string;
  // Paybill fields
  billNumber?: string;
  accountNumber?: string;
  // Send Money fields
  phoneNumber?: string;
  accountName?: string;
};

// Unified schema that validates conditionally based on payment type
export const createUnifiedPaymentFormSchema = (
  options?: {
    minAmount?: number;
    maxAmount?: number;
    requiresInstitution?: boolean;
  }
) => {
  const { minAmount, maxAmount, requiresInstitution } = options || {};
  
  return z.object({
    selectedPaymentType: z.enum(["Paybill", "Buy Goods", "Send Money"]),
    amount: createAmountSchema(minAmount, maxAmount),
    includeCashoutFees: z.boolean().default(false),
    // All fields optional at base level
    tillNumber: z.string().optional(),
    billNumber: z.string().optional(),
    accountNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
    accountName: z.string().optional(),
  }).superRefine((data, ctx) => {
    // Conditional validation based on payment type
    if (data.selectedPaymentType === "Buy Goods") {
      if (!data.tillNumber || data.tillNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Till number is required",
          path: ["tillNumber"],
        });
      } else if (!/^\d+$/.test(data.tillNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Till number must contain only digits",
          path: ["tillNumber"],
        });
      } else if (data.tillNumber.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Till number must be 10 digits or less",
          path: ["tillNumber"],
        });
      }
    }
    
    if (data.selectedPaymentType === "Paybill") {
      if (!data.billNumber || data.billNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paybill number is required",
          path: ["billNumber"],
        });
      } else if (!/^\d+$/.test(data.billNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paybill number must contain only digits",
          path: ["billNumber"],
        });
      } else if (data.billNumber.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paybill number must be 10 digits or less",
          path: ["billNumber"],
        });
      }
      
      if (!data.accountNumber || data.accountNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business number is required",
          path: ["accountNumber"],
        });
      } else if (!/^\d+$/.test(data.accountNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business number must contain only digits",
          path: ["accountNumber"],
        });
      } else if (data.accountNumber.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business number must be 10 digits or less",
          path: ["accountNumber"],
        });
      }
    }
    
    if (data.selectedPaymentType === "Send Money") {
      if (!data.phoneNumber || data.phoneNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required",
          path: ["phoneNumber"],
        });
      } else if (data.phoneNumber.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number must be 10 digits or less",
          path: ["phoneNumber"],
        });
      }
      
      if (!data.accountName || data.accountName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account name is required",
          path: ["accountName"],
        });
      }
    }
  });
};

