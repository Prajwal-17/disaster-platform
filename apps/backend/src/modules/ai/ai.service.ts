import { GoogleGenerativeAI } from "@google/generative-ai";


export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getModel() {
    return this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are DisasterLink AI — a concise, empathetic disaster-coordination assistant.
You help coordinate disaster relief operations, triage resource requests, and provide situational awareness.

Guidelines:
- Keep responses short (2-4 sentences unless the user asks for detail).
- Use clear, actionable language suitable for emergency responders.
- When summarizing, highlight: severity, active needs, and recommended next steps.
- If asked about something outside disaster coordination, politely redirect.
- Never fabricate data — if you're uncertain, say so.
- Format lists with bullet points when there are 3+ items.`,
    });
  }

  private buildIncidentContext(
    incident: any,
    requests: any[],
    chatHistory: any[],
  ): string {
    const lines: string[] = [
      `=== INCIDENT: ${incident.title} ===`,
      `Type: ${incident.type} | Status: ${incident.status}`,
      `Location: ${Number(incident.lat).toFixed(4)}, ${Number(incident.lng).toFixed(4)} | Radius: ${incident.radiusKm} km`,
      `Description: ${incident.description}`,
      `Created: ${new Date(incident.createdAt).toLocaleString()}`,
      "",
    ];

    if (requests && requests.length > 0) {
      lines.push(`=== RESOURCE REQUESTS (${requests.length}) ===`);
      const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = [...requests].sort(
        (a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4),
      );

      for (const req of sorted.slice(0, 15)) {
        lines.push(
          `• [${req.urgency.toUpperCase()}] ${req.title} (${req.type}) — Status: ${req.status}`,
        );
      }

      if (requests.length > 15) {
        lines.push(`  ... and ${requests.length - 15} more requests`);
      }

      const stats = {
        open: requests.filter((r) => r.status === "open").length,
        inProgress: requests.filter((r) => r.status === "in_progress").length,
        fulfilled: requests.filter((r) => r.status === "fulfilled").length,
        critical: requests.filter((r) => r.urgency === "critical").length,
        high: requests.filter((r) => r.urgency === "high").length,
      };
      lines.push("");
      lines.push(
        `Summary: ${stats.open} open, ${stats.inProgress} in-progress, ${stats.fulfilled} fulfilled | ${stats.critical} critical, ${stats.high} high priority`,
      );
      lines.push("");
    }

    if (chatHistory && chatHistory.length > 0) {
      lines.push(`=== RECENT CHAT (last ${Math.min(chatHistory.length, 20)} messages) ===`);
      const recent = chatHistory.slice(-20);
      for (const msg of recent) {
        const time = new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        lines.push(`[${time}] ${msg.userName} (${msg.role}): ${msg.text}`);
      }
    }

    return lines.join("\n");
  }

  async sendChatMessage(
    userMessage: string,
    incident: any,
    requests: any[],
    chatHistory: any[],
    conversationHistory: Array<{ role: "user" | "model"; text: string }>,
  ): Promise<string> {
    const model = this.getModel();
    const context = this.buildIncidentContext(incident, requests, chatHistory);

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `Here is the current incident context I'm working with:\n\n${context}\n\nPlease use this context to help me coordinate the response.`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "I've reviewed the incident data. I'm ready to help you coordinate the response. What do you need?",
            },
          ],
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
      ],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  }

  async generateSummary(
    incident: any,
    requests: any[],
    chatHistory: any[],
  ): Promise<string> {
    const model = this.getModel();
    const context = this.buildIncidentContext(incident, requests, chatHistory);

    const prompt = `Based on the following disaster incident data, provide a concise situation report (SITREP).

${context}

Structure your report as:
1. **Situation Overview** — 1-2 sentence summary of the incident
2. **Critical Needs** — Most urgent unmet needs (if any)
3. **Resource Status** — Brief status of requests and volunteer coverage
4. **Coordination Notes** — Key observations from chat (if any)
5. **Recommended Actions** — 2-3 concrete next steps

Keep it brief and actionable. Use bullet points.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
