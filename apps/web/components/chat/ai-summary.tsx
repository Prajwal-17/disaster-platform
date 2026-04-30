"use client";

/**
 * AISummary — Generates an AI-powered situation report (SITREP) for an incident.
 * Uses Gemini to analyze incident data, resource requests, and chat history.
 */
import { useState, useCallback } from "react";
import { generateSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Incident, ResourceRequest } from "@/lib/api";
import type { ChatMessage } from "@/lib/hooks/use-incident-chat";
import {
  Sparkles,
  FileText,
  Loader2,
  RotateCcw,
  Key,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Props = {
  incident: Incident;
  requests: ResourceRequest[];
  chatMessages: ChatMessage[];
};

export function AISummary({ incident, requests, chatMessages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateSummary(
        incident,
        requests,
        chatMessages,
      );
      setSummary(result);
    } catch (err) {
      setError("Failed to generate summary. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  }, [incident, requests, chatMessages]);

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  const handleRegenerate = () => {
    setSummary(null);
    handleGenerate();
  };

  return (
    <div className="border-t border-[#E2E8F0]">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[12px] font-semibold text-foreground">
            AI Summary
          </span>
          {summary && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-[oklch(0.45_0.15_250)] bg-[oklch(0.92_0.05_250)] px-1.5 py-0.5 rounded-full">
              Generated
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-4">
          {!summary && !isLoading && !error ? (
            /* Generate prompt */
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                Generate an AI-powered situation report
                <br />
                analyzing{" "}
                <span className="font-semibold text-foreground">
                  {requests.length} requests
                </span>
                {chatMessages.length > 0 && (
                  <>
                    {" "}
                    and{" "}
                    <span className="font-semibold text-foreground">
                      {chatMessages.length} chat messages
                    </span>
                  </>
                )}
              </p>
              <Button
                size="sm"
                onClick={handleGenerate}
                className="h-8 gap-1.5 text-[11px] font-semibold rounded-lg"
              >
                <Sparkles className="h-3 w-3" />
                Generate SITREP
              </Button>
            </div>
          ) : isLoading ? (
            /* Loading */
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
              <p className="text-[11px] text-muted-foreground">
                Analyzing incident data...
              </p>
            </div>
          ) : error ? (
            /* Error */
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <p className="text-[11px] text-destructive font-medium">
                {error}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                className="h-8 gap-1.5 text-[11px] rounded-lg"
              >
                <RotateCcw className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          ) : (
            /* Summary result */
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 border border-border/50 p-4">
                <div className="prose-sm text-[12px] leading-relaxed text-foreground whitespace-pre-wrap summary-content">
                  {summary}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground/50">
                  Generated by Gemini · Based on current incident data
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-2.5 w-2.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRegenerate}
                    className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
