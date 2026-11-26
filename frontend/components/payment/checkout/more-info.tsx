// frontend/components/payment/checkout/more-info.tsx

import { useState } from "react";
import { ChevronDown, ExternalLink } from "@/components/icons";
import { PaymentLogos } from "@/components/marketing/pricing-logos";
import { LoyaltyStairs } from "@/components/payment/loyalty-stairs";
import { PriceCompare } from "@/components/payment/price-compare";
import { PAYMENT_TERMS_HREF } from "@/components/payment/checkout/order-summary";
import { cn } from "@/lib/core/utils";

const FAQ = [
  {
    q: "Quand suis-je débité ?",
    a: "Aujourd'hui pour la première période, puis automatiquement à chaque échéance (carte ou prélèvement). Vous recevez la facture par e-mail à chaque fois.",
  },
  {
    q: "Puis-je changer de forfait ?",
    a: "Oui, à tout moment. La montée en gamme est immédiate ; une baisse prend effet à la prochaine échéance.",
  },
  {
    q: "Comment résilier ?",
    a: "Depuis Paramètres → Facturation, en quelques clics. Aucun nouveau débit n'a lieu et vous gardez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Mes coordonnées bancaires sont-elles stockées chez vous ?",
    a: "Non. Elles sont chiffrées et conservées par Stripe, prestataire certifié PCI DSS niveau 1. Nous ne voyons que les 4 derniers chiffres.",
  },
  {
    q: "Pourquoi ma banque me demande une validation ?",
    a: "C'est l'authentification forte (3-D Secure) imposée en Europe. Elle est demandée au premier paiement par carte ; les échéances suivantes passent en principe sans validation.",
  },
  {
    q: "Comment fonctionne le prélèvement SEPA ?",
    a: "En confirmant, vous signez un mandat qui nous autorise à débiter votre compte à chaque échéance. Le premier débit arrive sous 2 à 5 jours ouvrés. Vous pouvez demander le remboursement d'un prélèvement à votre banque pendant 8 semaines.",
  },
  {
    q: "Et si je paie par virement ?",
    a: "Indiquez bien la référence fournie : elle relie votre virement à votre compte. Le forfait s'active dès réception (quelques secondes en virement instantané, 1 à 2 jours ouvrés sinon). Il n'y a pas de débit automatique : la facture suivante vous est envoyée 7 jours avant l'échéance.",
  },
  {
    q: "Que se passe-t-il si je résilie en cours de mois ?",
    a: "Le montant déjà payé reste acquis et vous profitez de votre forfait jusqu'à la fin de la période réglée. Aucun débit n'a lieu ensuite.",
  },
];

export function MoreInfo({ basePrice, planName }: { basePrice: number; planName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-border pt-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Informations supplémentaires
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-6 space-y-10 animate-in fade-in slide-in-from-top-1 duration-200">
          <div>
            <h4 className="mb-3 text-[13px] font-semibold">Questions fréquentes</h4>
            <dl className="divide-y divide-border rounded-2xl border border-border">
              {FAQ.map((f) => (
                <div key={f.q} className="px-4 py-3">
                  <dt className="text-[13px] font-medium">{f.q}</dt>
                  <dd className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h4 className="mb-3 text-[13px] font-semibold">Votre prix baisse avec l'ancienneté</h4>
            <LoyaltyStairs basePrice={basePrice} months={0} planName={planName} />
          </div>

          <div>
            <h4 className="mb-3 text-[13px] font-semibold">Ce que vous paieriez ailleurs</h4>
            <PriceCompare />
          </div>

          <div className="space-y-3">
            <PaymentLogos size="sm" className="!justify-start opacity-80" />
            <a
              href={PAYMENT_TERMS_HREF}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              Conditions de paiement, de renouvellement et de résiliation
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
