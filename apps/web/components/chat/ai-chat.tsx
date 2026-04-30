"use client";

/**
 * AIChat — A standalone AI assistant chat panel powered by Gemini.
 * Uses incident context (incident data, requests, chat messages) to provide
 * contextual AI responses for disaster coordination.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Incident, ResourceRequest } from "@/lib/api";
import type { ChatMessage } from "@/lib/hooks/use-incident-chat";
import {
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Key,
} from "lucide-react";

type AIChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
};

type Props = {
  incident: Incident;
  requests: ResourceRequest[];
  chatMessages: ChatMessage[];
};

export function AIChat({ incident, requests, chatMessages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await sendChatMessage(
        text,
        incident,
        requests,
        chatMessages,
        history,
      );

      const aiMsg: AIChatMessage = {
        id: `a-${Date.now()}`,
        role: "model",
        text: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: AIChatMessage = {
        id: `e-${Date.now()}`,
        role: "model",
        text: "Sorry, I encountered an error. Please check your API key and try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, incident, requests, chatMessages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

  return (
    <div className="border-t border-[#E2E8F0]">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[12px] font-semibold text-foreground">
            AI Assistant
          </span>
          <span className="flex items-center gap-1 text-[9px] font-medium text-[oklch(0.45_0.15_155)] bg-[oklch(0.92_0.06_155)] px-1.5 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.45_0.15_155)]" />
            Ready
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Chat body */}
      {expanded && (
        <div className="flex flex-col" style={{ height: 320 }}>
          <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Sparkles className="h-5 w-5 text-primary/30" />
                    <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed">
                      Ask me about this incident — I can analyze
                      <br />
                      needs, suggest priorities, and help coordinate.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <AIBubble key={msg.id} message={msg} />
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Sparkles className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-[#E2E8F0] px-4 py-2 flex gap-2">
                {messages.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={handleReset}
                    title="Reset conversation"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                <input
                  type="text"
                  placeholder="Ask about this incident..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
          </>
        </div>
      )}
    </div>
  );
}

// ── AI Chat Bubble ──────────────────────────────────────────────────
function AIBubble({ message }: { message: AIChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 mt-0.5">
          <Sparkles className="h-2.5 w-2.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        <div className="whitespace-pre-wrap">{message.text}</div>
        <div
          className={cn(
            "text-[9px] mt-1",
            isUser
              ? "text-primary-foreground/50"
              : "text-muted-foreground/50",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
