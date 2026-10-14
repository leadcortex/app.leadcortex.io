import { useEffect, useState, type RefObject } from "react";

import type { AssistantMessage } from "./assistant-engine";

type MessageScrollRailProps = {
  messages: AssistantMessage[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onJump: (id: string) => void;
};

export function MessageScrollRail({ messages, scrollRef, onJump }: MessageScrollRailProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateActiveMessage = () => {
      const visibleMessage = Array.from(
        container.querySelectorAll<HTMLElement>("[data-message-id]"),
      ).find((message) => message.offsetTop + message.offsetHeight > container.scrollTop);
      if (visibleMessage?.dataset.messageId) {
        setActiveId(visibleMessage.dataset.messageId);
      }
    };

    container.addEventListener("scroll", updateActiveMessage, { passive: true });
    updateActiveMessage();
    return () => container.removeEventListener("scroll", updateActiveMessage);
  }, [messages, scrollRef]);

  if (messages.length < 3) return null;

  return (
    <nav
      aria-label="Navigation des messages"
      className="absolute right-1 top-1/2 z-10 max-h-[70%] -translate-y-1/2"
    >
      <div className="flex max-h-full flex-col gap-1 overflow-y-auto rounded-full border border-border bg-background/90 p-1 shadow-sm backdrop-blur">
        {messages.map((message, index) => (
          <button
            key={message.id}
            type="button"
            aria-label={`Aller au message ${index + 1}, ${
              message.role === "user" ? "vous" : "assistant"
            }`}
            aria-current={activeId === message.id ? "location" : undefined}
            title={message.text.slice(0, 100)}
            onClick={() => onJump(message.id)}
            className={`size-2.5 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeId === message.id
                ? "bg-primary"
                : message.role === "user"
                  ? "bg-muted-foreground/40 hover:bg-muted-foreground"
                  : "bg-primary/30 hover:bg-primary/70"
            }`}
          />
        ))}
      </div>
    </nav>
  );
}
