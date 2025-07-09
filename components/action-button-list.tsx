"use client";
import {
  useDisconnect,
  useAppKit,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { networks } from "@/config";
import { Button } from "@/app/components/ui/button";

export const ActionButtonList = () => {
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { switchNetwork, chainId } = useAppKitNetwork();

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };
  return (
    <div className="flex flex-col gap-5 p-5 text-white">
      <span>Connected to: {chainId}</span>
      <Button variant="default" onClick={() => open()}>
        Open
      </Button>
      <Button variant="default" onClick={handleDisconnect}>
        Disconnect
      </Button>
      <Button variant="default" onClick={() => switchNetwork(networks[1])}>
        Switch
      </Button>
    </div>
  );
};
