//frontend\routes\app.conversations.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConversationsSkeleton } from "@/components/skeletons";
import { ConversationList } from "@/components/conversations/conversation-list";
import { ConversationThread } from "@/components/conversations/conversation-thread";
import { ConversationSettings } from "@/components/conversations/conversation-settings";
import { NewConversationModal } from "@/components/conversations/new-conversation-modal";
import {
  simulatedReply,
  threads as seedThreads,
  type ChannelId,
  type ChatAttachment,
  type ProspectThread,
} from "@/lib/conversations-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations multicanal — LeadCortex" },
      {
        name: "description",
        content:
          "Échangez avec vos prospects sur LinkedIn, WhatsApp, Email, SMS et Instagram depuis une messagerie unifiée.",
      },
      { property: "og:title", content: "Conversations multicanal — LeadCortex" },
      {
        property: "og:description",
        content:
          "Messagerie unifiée B2B : pièces jointes, thématisation par réseau et paramètres prospect.",
      },
    ],
  }),
  pendingComponent: () => <ConversationsSkeleton />,
  component: ConversationsPage,
});

const LIST_STORAGE_KEY = "lc.conv.listWidth";
const LIST_MIN = 248;
const LIST_MAX = 560;
const LIST_DEFAULT = 320;

function ConversationsPage() {
  const [threads, setThreads] = useState<ProspectThread[]>(seedThreads);
  const [selectedId, setSelectedId] = useState(seedThreads[0]!.id);
  const [channel, setChannel] = useState<ChannelId>(seedThreads[0]!.channel);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<ProspectThread | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const [listWidth, setListWidth] = useState(LIST_DEFAULT);
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(LIST_STORAGE_KEY);
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isNaN(n)) setListWidth(Math.min(LIST_MAX, Math.max(LIST_MIN, n)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LIST_STORAGE_KEY, String(listWidth));
  }, [listWidth]);

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? threads[0]!,
    [threads, selectedId],
  );

  const selectThread = (t: ProspectThread) => {
    setSelectedId(t.id);
    setChannel(t.channel);
    setMobileView("thread");
    setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, unread: 0 } : x)));
  };

  const sendMessage = (text: string, attachments: ChatAttachment[] = []) => {
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const message = {
      id: `m${Date.now()}`,
      me: true,
      text: text || "(pièce jointe)",
      time,
      status: "envoyé" as const,
      attachments: attachments.length ? attachments : undefined,
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? {
              ...t,
              last: message.text,
              time,
              messages: {
                ...t.messages,
                [channel]: [...(t.messages[channel] ?? []), message],
              },
            }
          : t,
      ),
    );

    window.setTimeout(() => {
      const reply = {
        id: `r${Date.now()}`,
        me: false,
        text: simulatedReply(channel),
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? {
                ...t,
                last: reply.text,
                time: reply.time,
                messages: {
                  ...t.messages,
                  [channel]: [...(t.messages[channel] ?? []), reply],
                },
              }
            : t,
        ),
      );
    }, 1400);
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = listWidth;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(LIST_MAX, Math.max(LIST_MIN, startW + (ev.clientX - startX)));
      setListWidth(next);
    };
    const onUp = () => {
      setResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) return prev;
      if (id === selectedId) {
        setSelectedId(next[0]!.id);
        setChannel(next[0]!.channel);
      }
      return next;
    });
  };

  const handleToggleFavorite = (id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)));
  };

  const handleToggleUnread = (id: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: t.unread ? 0 : 1 } : t)));
  };

  const handleEditThread = (t: ProspectThread) => {
    setEditing(t);
    setNewOpen(true);
  };

  return (
    // Le wrapper racine est TOUJOURS en flex-row, mais en `overflow-hidden`
    // strict : ainsi aucun enfant ne peut déborder du conteneur scrollable
    // principal (bug observé en mobile, où la largeur de la liste forçait
    // l'écran à s'élargir).
    <div className="flex h-full min-h-0 w-full overflow-hidden md:gap-0 md:bg-muted/40 md:p-2">
      <div
        className={cn(
          "h-full min-h-0 w-full shrink-0 overflow-hidden bg-background",
          "md:w-[var(--conv-list-w)] md:rounded-xl md:border md:border-border md:shadow-sm",
          mobileView === "list" ? "block" : "hidden md:block",
        )}
        style={{ ["--conv-list-w" as string]: `${listWidth}px` }}
      >
        <ConversationList
          threads={threads}
          selectedId={selected.id}
          onSelect={selectThread}
          onNew={() => {
            setEditing(null);
            setNewOpen(true);
          }}
          onDelete={handleDeleteThread}
          onEdit={handleEditThread}
          onToggleFavorite={handleToggleFavorite}
          onToggleUnread={handleToggleUnread}
        />
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner la liste des conversations"
        onPointerDown={startResize}
        onDoubleClick={() => setListWidth(LIST_DEFAULT)}
        title="Glisser pour redimensionner · double-clic pour réinitialiser"
        className="group relative z-30 hidden w-2 shrink-0 cursor-ew-resize md:block"
      >
        <span className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-border/70 transition-colors group-hover:bg-primary" />
      </div>

      <div
        className={cn(
          "h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-background",
          "md:rounded-xl md:border md:border-border md:shadow-sm",
          mobileView === "thread" ? "block" : "hidden md:block",
        )}
      >
        <ConversationThread
          thread={selected}
          channel={channel}
          messages={selected.messages[channel] ?? []}
          onChannelChange={setChannel}
          onSend={sendMessage}
          onBack={() => setMobileView("list")}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <ConversationSettings
        open={settingsOpen}
        thread={selected}
        channel={channel}
        onChannelChange={(c) => setChannel(c)}
        onClose={() => setSettingsOpen(false)}
      />

      <NewConversationModal
        open={newOpen}
        thread={editing}
        onClose={() => {
          setNewOpen(false);
          setEditing(null);
        }}
        onCreate={(t) => {
          if (editing) {
            setThreads((prev) =>
              prev.map((x) => (x.id === editing.id ? { ...x, ...t, id: x.id } : x)),
            );
            setSelectedId(editing.id);
          } else {
            setThreads((prev) => [t, ...prev]);
            setSelectedId(t.id);
          }
          setChannel(t.channel);
          setMobileView("thread");
        }}
      />
    </div>
  );
}
