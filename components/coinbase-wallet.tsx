import { useCallback, useEffect, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useConnect, usePublicClient, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { cbWalletConnector } from "@/config/wagmi";
import { Button } from "@/app/components/ui/button";

export function CoinbaseWallet() {
  const { connect } = useConnect({
    mutation: {
      onSuccess: (data) => {
        const address = data.accounts[0];
        const chainId = data.chainId;
        const m = new SiweMessage({
          domain: document.location.host,
          address,
          chainId,
          uri: document.location.origin,
          version: "1",
          statement: "Smart Wallet SIWE Example",
          nonce: "12345678",
        });
        setMessage(m);
        signMessage({ message: m.prepareMessage() });
      },
    },
  });
  const account = useAccount();
  const client = usePublicClient();
  const [signature, setSignature] = useState<Hex | undefined>(undefined);
  const { signMessage } = useSignMessage({
    mutation: { onSuccess: (sig) => setSignature(sig) },
  });
  const [message, setMessage] = useState<SiweMessage | undefined>(undefined);

  const [valid, setValid] = useState<boolean | undefined>(undefined);

  const checkValid = useCallback(async () => {
    if (!signature || !account.address || !client || !message) return;

    client
      .verifyMessage({
        address: account.address,
        message: message.prepareMessage(),
        signature,
      })
      .then((v) => setValid(v));
  }, [signature, account]);

  useEffect(() => {
    checkValid();
  }, [signature, account]);

  useEffect(() => {});

  return (
    <div>
      <Button
        onClick={() => connect({ connector: cbWalletConnector })}
        className="w-full !bg-blue-500 !text-white p-2"
      >
        Connect + SIWE
      </Button>
      <p>{}</p>
      {valid != undefined && <p> Is valid: {valid.toString()} </p>}
    </div>
  );
}
