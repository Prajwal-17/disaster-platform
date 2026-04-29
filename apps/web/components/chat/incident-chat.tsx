"use client";

/**
 * IncidentChat — Collapsible chat panel for the incident detail sidebar.
 * Real-time messaging via the Durable Object WebSocket channel.
 */
import { useState, useRef, useEffect } from "react";
import { useIncidentChat, type ChatMessage } from "@/lib/hooks/use-incident-chat";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
} from "lucide-react";

type Props = {
  incidentId: string;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  ngo: "bg-amber-100 text-amber-700",
  volunteer: "bg-blue-100 text-blue-700",
  donor: "bg-green-100 text-green-700",
};

export function IncidentChat({ incidentId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  const {
    messages,
    isConnected,
    sendMessage,
    unreadCount,
    markAsRead,
    setIsVisible,
  } = useIncidentChat({ incidentId, enabled: true });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  // Mark as read when expanding
  useEffect(() => {
    if (expanded) {
      markAsRead();
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [expanded, markAsRead, setIsVisible]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#E2E8F0]">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] font-semibold text-foreground">
            Live Chat
          </span>
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-muted-foreground" />
          )}
          {unreadCount > 0 && !expanded && (
            <Badge className="h-4 min-w-4 px-1 text-[9px] font-bold bg-red-500 text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Chat body */}
      {expanded && (
        <div className="flex flex-col" style={{ height: 280 }}>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[11px] text-muted-foreground/50">
                  No messages yet. Start the conversation.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.userId === user?.id}
                />
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[#E2E8F0] px-4 py-2 flex gap-2">
            <input
              type="text"
              placeholder={
                isConnected ? "Type a message..." : "Connecting..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat Bubble ────────────────────────────────────────────────────
function ChatBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const roleClass = ROLE_COLORS[message.role] || "bg-muted text-muted-foreground";

  return (
    <div className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
      {/* Sender info */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] font-semibold text-foreground/70">
            {message.userName}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "h-3.5 px-1 text-[8px] font-bold uppercase tracking-wider border-0",
              roleClass,
            )}
          >
            {message.role}
          </Badge>
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3 py-1.5 text-[12px] leading-relaxed",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {message.text}
      </div>

      <span className="text-[9px] text-muted-foreground/50 px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
