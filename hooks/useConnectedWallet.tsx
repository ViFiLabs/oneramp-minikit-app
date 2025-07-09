import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";

const useConnectedWallet = () => {
  const { isConnected, address, caipAddress, status } = useAppKitAccount();
  const { caipNetwork, caipNetworkId, chainId, switchNetwork } =
    useAppKitNetwork();

  return {
    isConnected,
    address,
    caipAddress,
    status,
    caipNetwork,
    caipNetworkId,
    chainId,
    switchNetwork,
  };
};

export default useConnectedWallet;
