// academy/src/components/academy/dictionary/gems-wallet.tsx

import { Gem } from "../../../../../frontend/components/icons";

import { useGems } from "../../../lib/gems-store";

export function GemsWallet() {
  const { balance } = useGems();

  return (
    <span className="academy-gems-pill" title="Gemmes disponibles">
      <Gem className="academy-gems-icon" fill="currentColor" />
      <span className="academy-gems-num">{balance}</span>
    </span>
  );
}
