import React from "react";
import { Wallet, useWallet } from "./../lib/wallet";
import Icon from "./Icon";
export const WalletBalance: React.FC = () => {
  // In a real app, you might get wallet from context or props
  const { wallet } = useWallet(500, "USD"); // Example: 500 credits

  return (
    <div className="flex items-center gap-2  theme-text-secondary text-xs font-semibold">
      <div className="rounded theme-bg-quaternary p-2">
       <Icon name="wallet" size={30} className="inline mr-1 theme-text-secondary shadow-lg" />
      </div>
    <div>
      <div className="text-xl font-bold theme-text-primary">{wallet.balance}</div>
      <div className="sentence-case theme-text-primary opacity-30 text-[0.7rem]">{'Left Today'}</div>
      </div>    
    </div>
  );
};
