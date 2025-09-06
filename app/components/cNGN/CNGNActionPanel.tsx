"use client";

import SelectCNGNAction from "./SelectCNGNAction";

export default function CNGNActionPanel() {
  return (
    <div className="w-full max-w-md mx-auto bg-[#181818] rounded-3xl p-0 md:shadow-lg md:border border-[#232323]">
      <div className="mx-3 md:mx-4 my-4 bg-[#232323] rounded-2xl p-4 md:p-5">
        <SelectCNGNAction />
      </div>
    </div>
  );
}
