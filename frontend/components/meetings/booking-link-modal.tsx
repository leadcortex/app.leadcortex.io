//frontend\components\meetings\booking-link-modal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Mail,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  BOOKING_BASE_URL,
  DEFAULT_AVAILABILITY,
  DEFAULT_QUESTIONS,
  LOCATION_LABELS,
  WEEKDAYS,
  bookingUrl,
  mockBookingLinks,
  mockBookingRequests,
  previewSlots,
  slugify,
  type BookingAvailability,
  type BookingDuration,
  type BookingLink,
  type BookingLocation,
  type BookingQuestion,
} from "@/lib/booking-mock";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type View = "list" | "wizard" | "success";

const DURATIONS: BookingDuration[] = [15, 30, 45, 60];
const LOCATIONS: BookingLocation[] = ["google-meet", "zoom", "teams", "phone", "onsite"];

export function BookingLinkModal({
  open,
  onClose,
  initialView = "wizard",
  links: linksProp,
  onLinksChange,
}: {
  open: boolean;
  onClose: () => void;
  initialView?: View;
  links?: BookingLink[];
  onLinksChange?: (updater: (prev: BookingLink[]) => BookingLink[]) => void;
}) {
  const [internalLinks, setInternalLinks] = useState<BookingLink[]>(mockBookingLinks);
  const links = linksProp ?? internalLinks;
  const setLinks = onLinksChange ?? setInternalLinks;
  const [view, setView] = useState<View>(initialView);
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<BookingLink | null>(null);

  const [name, setName] = useState("Discovery call");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("discovery-call");
  const [description, setDescription] = useState(
    "Un échange de 30 minutes pour comprendre vos enjeux de prospection.",
  );
  const [duration, setDuration] = useState<BookingDuration>(30);
  const [location, setLocation] = useState<BookingLocation>("google-meet");
  const [availability, setAvailability] = useState<BookingAvailability>(DEFAULT_AVAILABILITY);
  const [questions, setQuestions] = useState<BookingQuestion[]>(DEFAULT_QUESTIONS);
  const [newQuestion, setNewQuestion] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);

  useEffect(() => {
    if (open) {
      setView(initialView);
      setStep(0);
    }
  }, [open, initialView]);

  const url = useMemo(() => bookingUrl(slug), [slug]);

  const resetForm = () => {
    setName("Nouveau rendez-vous");
    setSlug("nouveau-rendez-vous");
    setSlugTouched(false);
    setDescription("");
    setDuration(30);
    setLocation("google-meet");
    setAvailability(DEFAULT_AVAILABILITY);
    setQuestions([]);
    setStep(0);
  };

  const submit = () => {
    const link: BookingLink = {
      id: `bl${Date.now()}`,
      name: name.trim() || "Nouveau rendez-vous",
      slug: slug || slugify(name) || "nouveau-rdv",
      description,
      duration,
      location,
      color: "primary",
      availability,
      questions,
      active: true,
      createdAt: "à l'instant",
      views: 0,
      bookings: 0,
    };
    setLinks((l) => [link, ...l]);
    setCreated(link);
    setView("success");
    toast.success("Lien de booking créé");
  };

  const copy = (value: string) => {
    void navigator.clipboard?.writeText(`https://${value}`);
    toast.success("Lien copié dans le presse-papiers");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex h-[95dvh] max-h-[95dvh] flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[88dvh] sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {view === "list"
            ? "Vos liens de booking"
            : view === "success"
              ? "Votre lien est prêt"
              : "Créer un lien de booking"}
        </DialogTitle>

        {}
        <header className="flex shrink-0 items-start gap-3 border-b border-border py-3 pl-4 pr-14 md:py-4 md:pl-6 md:pr-14">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="size-4.5" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg italic md:text-2xl">
              {view === "list"
                ? "Vos liens de booking"
                : view === "success"
                  ? "Votre lien est prêt"
                  : "Créer un lien de booking"}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground md:text-xs">
              {view === "list"
                ? "Gérez, partagez et suivez la performance de vos liens."
                : view === "success"
                  ? "Partagez-le dans vos séquences, signatures et messages LinkedIn."
                  : "Configurez le rendez-vous que vos prospect pourront réserver."}
            </p>
          </div>
          {view !== "list" && (
            <button
              onClick={() => setView("list")}
              className="hidden shrink-0 rounded-md border border-border px-2.5 py-1.5 text-[11px] hover:bg-surface sm:inline-flex"
            >
              Mes liens ({links.length})
            </button>
          )}
        </header>

        {}
        {view === "wizard" && (
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-6">
            {["Détails", "Disponibilités", "Formulaire", "Aperçu"].map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={`flex min-w-0 shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors md:flex-1 ${
                  i === step ? "bg-primary/10 text-primary" : "hover:bg-surface"
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="hidden truncate text-[11px] font-medium sm:inline md:text-xs">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
          {view === "list" && (
            <LinksList
              links={links}
              onCopy={copy}
              onToggle={(id) =>
                setLinks((l) => l.map((x) => (x.id === id ? { ...x, active: !x.active } : x)))
              }
              onDelete={(id) => {
                setLinks((l) => l.filter((x) => x.id !== id));
                toast.success("Lien supprimé");
              }}
              onCreate={() => {
                resetForm();
                setView("wizard");
              }}
            />
          )}

          {view === "wizard" && step === 0 && (
            <div className="space-y-4">
              <Field label="Nom du rendez-vous">
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  className={inputCls}
                  placeholder="Discovery call"
                />
              </Field>
              <Field label="Description visible par le prospect">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Ce que le prospect obtiendra pendant l'échange..."
                />
              </Field>
              <Field label="Durée">
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
                      <Clock className="size-3" /> {d} min
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="Lieu / visio">
                <div className="flex flex-wrap gap-1.5">
                  {LOCATIONS.map((l) => (
                    <Chip key={l} active={location === l} onClick={() => setLocation(l)}>
                      {l === "onsite" ? (
                        <MapPin className="size-3" />
                      ) : l === "phone" ? (
                        <Users className="size-3" />
                      ) : (
                        <Video className="size-3" />
                      )}
                      {LOCATION_LABELS[l]}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="URL publique">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/40 px-2.5 py-2">
                  <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 text-[11px] text-muted-foreground md:text-xs">
                    {BOOKING_BASE_URL}/
                  </span>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[11px] outline-none md:text-xs"
                  />
                </div>
              </Field>
            </div>
          )}

          {view === "wizard" && step === 1 && (
            <div className="space-y-4">
              <Field label="Jours disponibles">
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d) => (
                    <Chip
                      key={d.key}
                      active={availability.days.includes(d.key)}
                      onClick={() =>
                        setAvailability((a) => ({
                          ...a,
                          days: a.days.includes(d.key)
                            ? a.days.filter((x) => x !== d.key)
                            : [...a.days, d.key],
                        }))
                      }
                    >
                      {d.label}
                    </Chip>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Début">
                  <input
                    type="time"
                    value={availability.start}
                    onChange={(e) => setAvailability((a) => ({ ...a, start: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Fin">
                  <input
                    type="time"
                    value={availability.end}
                    onChange={(e) => setAvailability((a) => ({ ...a, end: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Fuseau horaire">
                <select
                  value={availability.timezone}
                  onChange={(e) => setAvailability((a) => ({ ...a, timezone: e.target.value }))}
                  className={inputCls}
                >
                  {[
                    "Europe/Paris (GMT+1)",
                    "Europe/London (GMT+0)",
                    "America/New_York (GMT-5)",
                    "Indian/Mauritius (GMT+4)",
                  ].map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Temps tampon entre deux RDV : ${availability.buffer} min`}>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 10, 15, 30].map((b) => (
                    <Chip
                      key={b}
                      active={availability.buffer === b}
                      onClick={() => setAvailability((a) => ({ ...a, buffer: b }))}
                    >
                      {b} min
                    </Chip>
                  ))}
                </div>
              </Field>
              <div className="rounded-xl border border-border bg-surface/40 p-3">
                <p className="text-[11px] font-medium">Créneaux proposés (aperçu)</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {previewSlots(availability).map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === "wizard" && step === 2 && (
            <div className="space-y-4">
              <Field label="Questions posées au prospect">
                <div className="space-y-2">
                  {questions.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
                      Aucune question. Le prospect renseignera seulement nom et email.
                    </p>
                  )}
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-2.5 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-[12px]">{q.label}</span>
                      <button
                        onClick={() =>
                          setQuestions((qs) =>
                            qs.map((x) => (x.id === q.id ? { ...x, required: !x.required } : x)),
                          )
                        }
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          q.required
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {q.required ? "Obligatoire" : "Optionnel"}
                      </button>
                      <button
                        onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                        aria-label="Supprimer la question"
                        className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-background"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </Field>
              <div className="flex gap-2">
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newQuestion.trim()) {
                      setQuestions((qs) => [
                        ...qs,
                        { id: `q${Date.now()}`, label: newQuestion.trim(), required: false },
                      ]);
                      setNewQuestion("");
                    }
                  }}
                  placeholder="Ajouter une question..."
                  className={inputCls}
                />
                <button
                  onClick={() => {
                    if (!newQuestion.trim()) return;
                    setQuestions((qs) => [
                      ...qs,
                      { id: `q${Date.now()}`, label: newQuestion.trim(), required: false },
                    ]);
                    setNewQuestion("");
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-foreground px-3 text-[11px] text-background hover:opacity-90"
                >
                  <Plus className="size-3.5" /> Ajouter
                </button>
              </div>
              <Toggle
                label="M'envoyer un email à chaque réservation"
                icon={Mail}
                checked={notifyEmail}
                onChange={setNotifyEmail}
              />
              <Toggle
                label="Confirmer automatiquement les créneaux réservés"
                icon={Check}
                checked={autoConfirm}
                onChange={setAutoConfirm}
              />
            </div>
          )}

          {view === "wizard" && step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Récapitulatif
                </p>
                <h3 className="mt-1 font-display text-xl italic">{name}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
                <dl className="mt-3 space-y-1.5 text-[11px]">
                  <Row label="Durée" value={`${duration} minutes`} />
                  <Row label="Lieu" value={LOCATION_LABELS[location]} />
                  <Row
                    label="Jours"
                    value={availability.days.map((d) => d.toUpperCase()).join(" · ") || "—"}
                  />
                  <Row label="Horaires" value={`${availability.start} – ${availability.end}`} />
                  <Row label="Fuseau" value={availability.timezone} />
                  <Row label="Questions" value={`${questions.length}`} />
                  <Row label="Notifications" value={notifyEmail ? "Email activé" : "Désactivées"} />
                  <Row label="Confirmation" value={autoConfirm ? "Automatique" : "Manuelle"} />
                </dl>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Aperçu de la page publique
                </p>
                <div className="mt-2 rounded-lg border border-border bg-background p-3">
                  <p className="text-[11px] text-muted-foreground">{url}</p>
                  <p className="mt-2 text-sm font-medium">{name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {duration} min · {LOCATION_LABELS[location]}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {previewSlots(availability).map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-border px-1.5 py-1 text-center text-[11px] hover:border-primary/50"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                  <Sparkles className="size-3" /> Données simulées pour la démo.
                </p>
              </div>
            </div>
          )}

          {view === "success" && created && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-[11px] font-medium text-primary">Lien public</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-[11px] md:text-xs">
                    https://{bookingUrl(created.slug)}
                  </code>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => copy(bookingUrl(created.slug))}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[11px] text-background hover:opacity-90"
                    >
                      <Copy className="size-3.5" /> Copier
                    </button>
                    <button
                      onClick={() => toast.info("Partage simulé (démo)")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] hover:bg-surface"
                    >
                      <Share2 className="size-3.5" /> Partager
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Durée", value: `${created.duration} min`, icon: Clock },
                  { label: "Lieu", value: LOCATION_LABELS[created.location], icon: Video },
                  { label: "Statut", value: "Actif", icon: Check },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border p-3">
                    <s.icon className="size-4 text-primary" strokeWidth={1.6} />
                    <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-sm font-medium">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-[11px] font-medium">Prochaines réservations (simulées)</p>
                <div className="mt-2 space-y-1.5">
                  {mockBookingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-lg bg-surface/40 px-2.5 py-2"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {r.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px]">{r.name}</span>
                        <span className="block truncate text-[10.5px] text-muted-foreground">
                          {r.company}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px]">{r.slot}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          r.status === "confirmé"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3 md:px-6">
          {view === "wizard" ? (
            <>
              <button
                onClick={() => (step === 0 ? setView("list") : setStep((s) => s - 1))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] hover:bg-surface md:text-xs"
              >
                <ArrowLeft className="size-3.5" /> {step === 0 ? "Mes liens" : "Retour"}
              </button>
              <span className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
                Étape {step + 1} / 4
              </span>
              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[11px] text-background hover:opacity-90 md:text-xs"
                >
                  Continuer <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] text-primary-foreground hover:opacity-90 md:text-xs"
                >
                  <Link2 className="size-3.5" /> Générer le lien
                </button>
              )}
            </>
          ) : view === "success" ? (
            <>
              <button
                onClick={() => setView("list")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] hover:bg-surface md:text-xs"
              >
                Voir tous mes liens
              </button>
              <button
                onClick={onClose}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[11px] text-background hover:opacity-90 md:text-xs"
              >
                Terminé
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-muted-foreground">
                {links.length} lien{links.length > 1 ? "s" : ""} · données simulées
              </span>
              <button
                onClick={() => {
                  resetForm();
                  setView("wizard");
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[11px] text-background hover:opacity-90 md:text-xs"
              >
                <Plus className="size-3.5" /> Nouveau lien
              </button>
            </>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] outline-none transition-colors focus:border-primary/50 md:text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

function Toggle({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-surface/60"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-[12px]">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function LinksList({
  links,
  onCopy,
  onToggle,
  onDelete,
  onCreate,
}: {
  links: BookingLink[];
  onCopy: (url: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <CalendarDays className="mx-auto size-7 text-muted-foreground" strokeWidth={1.4} />
        <p className="mt-2 text-sm font-medium">Aucun lien de booking</p>
        <button
          onClick={onCreate}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[11px] text-background"
        >
          <Plus className="size-3.5" /> Créer mon premier lien
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {links.map((l) => (
        <div key={l.id} className="rounded-xl border border-border p-3 md:p-4">
          <div className="flex items-start gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-[13px] font-medium">{l.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    l.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {l.active ? "Actif" : "En pause"}
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
                {bookingUrl(l.slug)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" /> {l.duration} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <Video className="size-3" /> {LOCATION_LABELS[l.location]}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3" /> {l.views} vues
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> {l.bookings} RDV
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => onCopy(bookingUrl(l.slug))}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10.5px] hover:bg-surface"
            >
              <Copy className="size-3" /> Copier
            </button>
            <button
              onClick={() => toast.info("Aperçu de la page publique (démo)")}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10.5px] hover:bg-surface"
            >
              <ExternalLink className="size-3" /> Aperçu
            </button>
            <button
              onClick={() => onToggle(l.id)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10.5px] hover:bg-surface"
            >
              {l.active ? "Mettre en pause" : "Activer"}
            </button>
            <button
              onClick={() => onDelete(l.id)}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10.5px] text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-3" /> Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
