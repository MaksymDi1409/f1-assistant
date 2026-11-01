export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools: string[]; // які інструменти викликав ШІ
  model?: string;
  error?: string;
};