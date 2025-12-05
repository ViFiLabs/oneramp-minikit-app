// Quote
export const quoteResponse = {
  quote: {
    fiatType: "KES",
    cryptoType: "USDC",
    fiatAmount: "112.68",
    cryptoAmount: "5.64",
    country: "KE",
    amountPaid: "6",
    address: "0x240ef8C7Ae6eB6C1A80Da77F5586EeE76d50C589",
    fee: "0.36",
    guaranteedUntil: "2025-05-14T17:41:01.381Z",
    transferType: "TransferIn",
    quoteId: "f6204b44-6089-4f82-8ded-dedb19e278d2",
    network: "celo",
    used: false,
    requestType: "fiat",
    id: "6824d5ada642d48ade8eb3d2",
  },
  kyc: {
    kycRequired: true,
    kycSchemas: [
      {
        kycSchema: "PersonalDataAndDocuments",
        allowedValues: {
          isoCountryCode: ["UG", "KE"],
          isoRegionCode: ["UG", "KE"],
        },
      },
    ],
  },
  fiatAccount: {
    MobileMoney: {
      fiatAccountSchemas: [
        {
          fiatAccountSchema: "MobileMoney",
          userActionType: "AccountNumberUserAction",
          allowedValues: {
            country: ["UG", "KE"],
          },
          institutionName: "OneRamp",
          accountName: "OneRamp",
          accountNumber: "25656",
          transactionReference: "ref-6824d5ada642d48ade8eb3d2",
        },
      ],
      settlementTimeLowerBound: "3600",
      settlementTimeUpperBound: "86400",
    },
  },
};

export const transferInResponse = {
  transferId: "test-6828767f9deeb7f33b1d18ea",
  transferStatus: "TransferStarted",
  transferAddress: "0x523a911918444D03eb9C8aFF5c13D9aa6A44348F",
  userActionDetails: {
    accountNumber: "01111111111",
    accountName: "PAGA",
    transactionReference: "ref-6824d5ada642d48ade8eb3d2",
    userActionType: "AccountNumberUserAction",
    institutionName: "PAGA",
  },
};

export const transferStatusResponse = {
  status: "TransferComplete",
  transferType: "TransferOut",
  fiatType: "UGX",
  cryptoType: "cUSD",
  amountProvided: "3733.70414571",
  amountReceived: "3733.70414571",
  fiatAccountId: "657c100a7b82664faec4588e",
  transferId: "test-6828767f9deeb7f33b1d18ea",
  transferAddress: "0xc0EBB770F2c9CA7169BDc1",
  userActionDetails: {
    userActionType: "AccountNumberUserAction",
    institutionName: "OneRamp",
    accountName: "OneRamp",
    accountNumber: "789456",
    transactionReference: "ref-6828767f9deeb7f33b1d18ea",
  },
};

export const MockSuccessTransactionReceipt = {
  transactionReceipt: {
    blockHash:
      "0x5c617be7d6786600530a4c36104bb57146e50d8f31059a72a3c8c02e10dddcdd",
    blockNumber: 36195194,
    chainId: 42220,
    contractAddress: null,
    cumulativeGasUsed: 1097068,
    effectiveGasPrice: 25001000000,
    from: "0x240ef8c7ae6eb6c1a80da77f5586eee76d50c589",
    gasUsed: 40259,
    l1BaseFeeScalar: "0x0",
    l1BlobBaseFee: "0x1",
    l1BlobBaseFeeScalar: "0x0",
    l1Fee: "0x0",
    l1GasPrice: "0x1bd7d6ec",
    l1GasUsed: "0x640",
    logs: [
      {
        address: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
        blockHash:
          "0x5c617be7d6786600530a4c36104bb57146e50d8f31059a72a3c8c02e10dddcdd",
        blockNumber: 36195194,
        data: "0x00000000000000000000000000000000000000000000000000000000000f4240",
        logIndex: 22,
        // You can add other log properties if needed
      },
    ],
    logsBloom:
      "0x00000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000010000000000000000000020000000000000000000000000000200000000000000000000000000000010000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000100000000000000000000000000000000000000400000000000002000000000000020000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000",
    status: "success",
    to: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    transactionHash:
      "0xa1070cd1686919e76e2a6ef109d50dee888fe4b64eafd1b7fded8c8add736512",
    transactionIndex: 6,
    type: "eip1559",
  },
};
