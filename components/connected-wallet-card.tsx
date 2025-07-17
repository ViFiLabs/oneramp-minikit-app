import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import Image from "next/image";

const ConnectedWalletCard = () => {
  const { address } = useWalletGetInfo();

  if (!address) {
    return null;
  }

  const networkLogo = "/logos/base.png";

  return (
    <Card className="bg-transparent border-neutral-500 text-white">
      <CardHeader>
        <CardTitle className="flex flex-row w-full items-center gap-3">
          <div className="size-12 bg-neutral-600 rounded-full relative overflow-hidden">
            <Image
              src={networkLogo}
              alt="Ethereum"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-base font-medium">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <span className="text-neutral-400 text-sm">Base Wallet here</span>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ConnectedWalletCard;
