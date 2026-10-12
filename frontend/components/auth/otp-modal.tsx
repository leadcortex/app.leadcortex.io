//frontend\components\auth\otp-modal.tsx
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type OtpModalProps = {
  open: boolean;
  email: string;
  onVerify: () => void;
  onClose: () => void;
  redirectTo: string;
};

export function OtpModal({ open, email, onVerify, onClose, redirectTo }: OtpModalProps) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRefs.current[0]?.focus(), 200);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setOtp(Array(6).fill(""));
    setError(null);
    setSuccess(null);
    setCooldown(30);
  }, [open]);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, cooldown]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");
    if (digit.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);
    setSuccess(null);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
    } else if (pastedData.length > 0) {
      const digits = pastedData.split("");
      const newOtp = [...otp];
      for (let i = 0; i < Math.min(digits.length, 6); i++) newOtp[i] = digits[i]!;
      setOtp(newOtp);
    }
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = () => {
    if (verifying) return;
    const code = otp.join("");
    if (code.length < 6) {
      setError("Veuillez saisir les 6 chiffres.");
      return;
    }
    setError(null);
    setSuccess(null);
    setVerifying(true);
    window.setTimeout(() => {
      setVerifying(false);
      onVerify();
      navigate({ to: redirectTo });
    }, 450);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccess(null);
    await new Promise((r) => window.setTimeout(r, 600));
    setResending(false);
    setCooldown(30);
    setOtp(Array(6).fill(""));
    inputRefs.current[0]?.focus();
    setSuccess("Un nouveau code vient d'être envoyé.");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Vérification du code</DialogTitle>

        {}
        <div className="hidden shrink-0 border-b border-border p-4 md:block md:px-6">
          <div className="relative aspect-[7/5] w-full overflow-hidden rounded-xl border border-border bg-surface/30">
            <video
              className="absolute inset-0 size-full object-contain"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Tutoriel de vérification du code"
            >
              <source src="/videos/otp-tutorial.webm" type="video/webm" />
              <source src="/videos/otp-tutorial.mov" type="video/quicktime" />
            </video>
          </div>
        </div>

        {}
        <div className="shrink-0 space-y-1 pb-3 pl-4 pr-14 pt-5 md:pl-6 md:pt-6 md:pr-14">
          <DialogTitle asChild>
            <h2 className="font-display text-xl italic">Vérification</h2>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Un code à 6 chiffres a été envoyé à{" "}
            <span className="break-all font-medium text-foreground">{email}</span>.
          </DialogDescription>
        </div>

        {}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 md:px-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className="h-12 w-10 rounded-lg border border-border bg-background text-center text-xl focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 md:h-12 md:w-12"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={`Chiffre ${index + 1} sur 6`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-emerald-500">
              <Check className="size-3.5 shrink-0" />
              {success}
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-3 px-4 pb-4 pt-3 md:px-6 md:pb-6">
          <button
            onClick={handleSubmit}
            disabled={verifying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? "Vérification…" : "Vérifier"}
            {!verifying && <ArrowRight className="size-4" />}
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending
                ? "Envoi en cours…"
                : cooldown > 0
                  ? `Renvoyer le code dans ${cooldown}s`
                  : "Renvoyer le code"}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Changer d'email
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
