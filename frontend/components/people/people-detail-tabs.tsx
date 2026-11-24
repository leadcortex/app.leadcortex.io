// frontend/components/people/people-detail-tabs.tsx

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  FileText,
  Mail,
  Phone,
  Radio,
  Send,
  Users,
  AlertCircle,
} from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/common/ui-primitives";
import type { ActivityItem, NoteItem } from "@/lib/people/helpers";
import { cn } from "@/lib/core/utils";

export function BreakdownRow({
  label,
  ok,
  value,
}: {
  label: string;
  ok: boolean;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
      ) : (
        <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
      )}
      <span className="flex-1 text-muted-foreground truncate text-xs md:text-sm">{label}</span>
      <span
        className={cn(
          "font-mono text-xs shrink-0 tabular-nums",
          value > 0 ? "text-primary" : "text-amber-600",
        )}
      >
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function OverviewTab({ lead }: { lead: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
      <div className="list-item-atelier p-3 md:p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
          <Mail className="size-3 text-primary" /> Coordonnées
        </h3>
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono truncate">{lead.email}</span>
              <Badge tone="success">Vérifié</Badge>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono">{lead.phone}</span>
            </div>
          )}
          {!lead.email && !lead.phone && (
            <p className="text-xs text-muted-foreground">Aucune coordonnée disponible.</p>
          )}
        </div>
      </div>

      <div className="list-item-atelier p-3 md:p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
          <Building2 className="size-3 text-primary" /> Entreprise
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium truncate ml-2">{lead.company}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industrie</span>
            <span className="truncate ml-2">{lead.industry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Localisation</span>
            <span className="truncate ml-2">{lead.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const activityIcon: Record<ActivityItem["type"], React.ComponentType<{ className?: string }>> = {
  email: Send,
  call: Phone,
  meeting: CalendarDays,
  note: FileText,
  view: Users,
  signal: Radio,
};

export function ActivityTab({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-xs md:text-sm text-muted-foreground text-center py-6">
        Aucune activité pour l'instant.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {activities.map((a) => {
        const Icon = activityIcon[a.type] ?? CircleDot;
        return (
          <li key={a.id} className="list-item-atelier p-3 flex items-start gap-3">
            <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
              <Icon className="size-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium">{a.label}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{a.detail}</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground/60 mt-0.5">
                {a.time}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function NotesTab({
  notes,
  onAddNote,
}: {
  notes: NoteItem[];
  onAddNote: (text: string) => void;
}) {
  const [note, setNote] = useState("");
  const addNote = () => {
    if (!note.trim()) return;
    onAddNote(note.trim());
    setNote("");
    toast.success("Note ajoutée");
  };
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter une note sur ce prospect..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] shadow-[0_2px_0_var(--border)] focus:shadow-none focus:translate-y-[2px]"
        />
        <button
          onClick={addNote}
          className="h-fit px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm hover:brightness-110 transition-all shrink-0 shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_60%,black)] active:translate-y-[2px] active:shadow-none"
        >
          Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="list-item-atelier p-3">
            <p className="text-xs md:text-sm">{n.text}</p>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{n.author}</span>
              <span>·</span>
              <span>{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmailsTab({ lead: _lead }: { lead: any }) {
  const emails = [
    {
      id: "e1",
      subject: "Proposition d'automatisation",
      preview: "Bonjour, je vous propose…",
      time: "il y a 2h",
      direction: "sent" as const,
    },
    {
      id: "e2",
      subject: "Re: Proposition d'automatisation",
      preview: "Merci pour votre message…",
      time: "il y a 1h",
      direction: "received" as const,
    },
  ];
  return (
    <ul className="space-y-2">
      {emails.map((e) => (
        <li key={e.id} className="list-item-atelier flex items-center gap-3 p-3 cursor-pointer">
          <div
            className={cn(
              "size-8 rounded-full grid place-items-center shrink-0",
              e.direction === "sent" ? "bg-primary/10 text-primary" : "bg-secondary",
            )}
          >
            {e.direction === "sent" ? <Send className="size-3.5" /> : <Mail className="size-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium truncate">{e.subject}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{e.preview}</p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{e.time}</span>
        </li>
      ))}
    </ul>
  );
}
