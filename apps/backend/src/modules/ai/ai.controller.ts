import { Hono } from "hono";
import { AiService } from "./ai.service";
import type { HonoEnv } from "../../types";

export const aiController = new Hono<HonoEnv>();

aiController.post("/chat", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "GEMINI_API_KEY is not configured on the server." }, 500);
  }

  try {
    const body = await c.req.json();
    const { userMessage, incident, requests, chatHistory, conversationHistory } = body;

    const aiService = new AiService(apiKey);
    const response = await aiService.sendChatMessage(
      userMessage,
      incident,
      requests || [],
      chatHistory || [],
      conversationHistory || []
    );

    return c.json({ response });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return c.json({ error: "Failed to generate AI chat response." }, 500);
  }
});

aiController.post("/summary", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "GEMINI_API_KEY is not configured on the server." }, 500);
  }

  try {
    const body = await c.req.json();
    const { incident, requests, chatHistory } = body;

    const aiService = new AiService(apiKey);
    const summary = await aiService.generateSummary(
      incident,
      requests || [],
      chatHistory || []
    );

    return c.json({ summary });
  } catch (error: any) {
    console.error("AI Summary Error:", error);
    return c.json({ error: `Failed to generate AI summary: ${error.message}` }, 500);
  }
});
