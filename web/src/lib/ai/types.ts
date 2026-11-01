export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Інструмент (функція), яку ШІ може викликати.
// parameters описуються у форматі JSON Schema, який розуміють
// усі провайдери: Gemini, Claude, OpenAI
export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

// Події, які сервер надсилає в браузер
export type ChatEvent =
  | { type: "text"; text: string } // шматок відповіді
  | { type: "tool"; name: string } // ШІ викликає інструмент
  | { type: "model"; name: string } // яка модель відповідає
  | { type: "error"; message: string };

export type ChatRequest = {
  system: string;
  messages: ChatMessage[];
  tools: ToolDefinition[];
};

export interface AIProvider {
  name: string;
  streamChat(request: ChatRequest): AsyncGenerator<ChatEvent>;
}