import { Card } from "@/components/ui/card";
import React from "react";

const TakingLongCard = () => {
  return (
    <Card className="p-4 bg-neutral-800 border-none w-full md:w-1/2">
      <div className="flex flex-row items-center justify-between ">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm text-white">Taking Longer Than Expected?</h2>
          <p className="text-neutral-400 text-xs">
            Your transaction is still processing. You can safely refresh or
            leave this page - your funds will either be settled or automatically
            refunded if the transaction fails.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TakingLongCard;
