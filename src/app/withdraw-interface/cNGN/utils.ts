import CNGNSwapToUSDCPanel from "./CNGNSwapToUSDCPanel";
import CNGNWithdrawPanel from "./CNGNWithdrawPanel";
import CNGNSwapTocNGNPanel from "./CNGNSwapTocNGNPanel";

export const cNGNTabsUI = {
  deposit: {
    component: null,
  },
  withdraw: {
    component: CNGNWithdrawPanel, // CNGNWithdrawPanel
  },
  swapToUSDC: {
    component: CNGNSwapToUSDCPanel, // CNGNSwapToUSDCPanel
  },
  swapTocNGN: {
    component: CNGNSwapTocNGNPanel, // CNGNSwapTocNGNPanel
  },
  payWithcNGN: {
    component: null, // CNGNPayWithcNGNPanel
  },
  payGlobally: {
    component: null, // CNGNGloballyPanel
  },
};
