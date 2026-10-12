//frontend\components\payment\payment-form.tsx
import { CreditCard, Lock, User, Mail } from "lucide-react";
import { useState } from "react";

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  isProcessing: boolean;
}

export function PaymentForm({ onSubmit, isProcessing }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ cardNumber, cardExpiry, cardCvc, cardName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
          Nom sur la carte
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Jean Dupont"
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
          Numéro de carte
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              const formatted = value.replace(/(.{4})/g, "$1 ").trim();
              setCardNumber(formatted);
            }}
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            Expiration
          </label>
          <input
            type="text"
            value={cardExpiry}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              const formatted = value.replace(/(.{2})/, "$1/").trim();
              setCardExpiry(formatted);
            }}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            CVC
          </label>
          <input
            type="text"
            value={cardCvc}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCardCvc(value);
            }}
            placeholder="•••"
            maxLength={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full py-3.5 rounded-xl text-sm font-medium transition-all ${
          isProcessing
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-foreground text-background hover:opacity-90"
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Traitement...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="size-4" />
            Payer
          </span>
        )}
      </button>
    </form>
  );
}
