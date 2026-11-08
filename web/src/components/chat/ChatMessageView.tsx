"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "./types";

const TOOL_LABELS: Record<string, string> = {
  get_season_schedule: "Переглядаю календар",
  get_race_results: "Шукаю результати гонки",
  get_driver_standings: "Перевіряю таблицю пілотів",
  get_constructor_standings: "Перевіряю командний залік",
  get_driver_info: "Дивлюсь статистику пілота",
};

type Props = {
  message: UIMessage;
  isStreaming: boolean;
};

export default function ChatMessageView({ message, isStreaming }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-sm text-on-accent">
          {message.content}
        </div>
      </div>
    );
  }

  const lastTool = message.tools.at(-1);

  return (
    <div className="max-w-[85%] space-y-2">
      {isStreaming && !message.content && (
        <p className="animate-pulse text-sm text-muted">
          {lastTool ? `${TOOL_LABELS[lastTool] ?? "Шукаю дані"}…` : "Думаю…"}
        </p>
      )}

      {message.content && (
        <div className="chat-markdown rounded-2xl rounded-bl-sm bg-subtle px-4 py-3 text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              a: ({ href = "", children }) =>
                // Посилання на наш сайт — без перезавантаження сторінки
                href.startsWith("/") && !href.startsWith("//") ? (
                  <Link href={href} className="text-accent hover:underline">
                    {children}
                  </Link>
                ) : (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {children}
                  </a>
                ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}

      {message.error && <p className="text-sm text-red-400">{message.error}</p>}

      {!isStreaming && (message.model || message.tools.length > 0) && (
        <p className="text-xs text-muted">
          {[
            message.model,
            message.tools.length > 0 ? `інструментів: ${message.tools.length}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}