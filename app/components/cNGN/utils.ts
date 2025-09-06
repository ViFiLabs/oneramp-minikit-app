import CNGNSwapToUSDCPanel from "./CNGNSwapToUSDCPanel";
import CNGNWithdrawPanel from "./CNGNWithdrawPanel";
import CNGNSwapTocNGNPanel from "./CNGNSwapTocNGNPanel";
import CNGNPayWithcNGNPanel from "./CNGNPayWithcNGNPanel";
import { CNGNGloballyPanel } from "./CNGNGloballyPanel";
import CNGNDepositPanel from "./CNGNDepositPanel";

export const cNGNTabsUI = {
  deposit: {
    component: CNGNDepositPanel,
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
    component: CNGNPayWithcNGNPanel, // CNGNPayWithcNGNPanel
  },
  payGlobally: {
    component: CNGNGloballyPanel, // CNGNGloballyPanel
  },
};
