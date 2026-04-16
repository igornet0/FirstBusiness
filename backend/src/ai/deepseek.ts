import OpenAI from "openai";

/** DeepSeek OpenAI-compatible endpoint (official docs allow /v1 as base_url). */
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

const openai = new OpenAI({
  baseURL: DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function deepseekChat(messages: ChatMessage[]): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from DeepSeek");
  }
  return content.trim();
}
