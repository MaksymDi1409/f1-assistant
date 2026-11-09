"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseLiveSettings, type LiveSettings } from "@/lib/live-settings";

export type ConnectionStatus = "connecting" | "online" | "offline";

type LiveSettingsContextValue = {
  settings: LiveSettings;
  status: ConnectionStatus;
  // Застосувати зміни локально, не чекаючи WebSocket (для адмінки)
  apply: (patch: Partial<LiveSettings>) => void;
};

const LiveSettingsContext = createContext<LiveSettingsContextValue | null>(null);

const WS_URL = process.env.NEXT_PUBLIC_DIRECTUS_WS_URL ?? "ws://localhost:8055/websocket";
const MAX_RECONNECT_DELAY_MS = 30_000;

type DirectusMessage = {
  type?: string;
  event?: string;
  status?: string;
  data?: unknown;
  error?: unknown;
};

export function LiveSettingsProvider({
  initial,
  children,
}: {
  initial: LiveSettings; // значення, з якими сервер відрендерив сторінку
  children: ReactNode;
}) {
  const [settings, setSettings] = useState(initial);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let isUnmounted = false;

    function connect() {
      socket = new WebSocket(WS_URL);

      // Підписка на зміни колекції site_settings у Directus
      socket.onopen = () => {
        attempt = 0;
        socket?.send(
          JSON.stringify({
            type: "subscribe",
            collection: "site_settings",
            query: { fields: ["*"] },
          }),
        );
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        let message: DirectusMessage;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        // Directus періодично перевіряє, чи клієнт живий: на ping треба відповісти pong
        if (message.type === "ping") {
          socket?.send(JSON.stringify({ type: "pong" }));
          return;
        }

        if (message.status === "error") {
          console.warn("Directus WebSocket error:", message.error);
          return;
        }

        // init — поточні значення одразу після підписки, update — зміни
        if (message.type === "subscription" && (message.event === "init" || message.event === "update")) {
          setStatus("online");
          const item = Array.isArray(message.data) ? message.data[0] : message.data;
          if (item && typeof item === "object") {
            setSettings((prev) => parseLiveSettings(item as Record<string, unknown>, prev));
          }
        }
      };

      // З'єднання обірвалося: перепідключаємося з паузою, що росте (1, 2, 4… до 30 с)
      socket.onclose = () => {
        if (isUnmounted) return;
        setStatus("offline");

        const delay = Math.min(1000 * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
        attempt += 1;
        reconnectTimer = setTimeout(() => {
          setStatus("connecting");
          connect();
        }, delay);
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const value = useMemo<LiveSettingsContextValue>(
    () => ({
      settings,
      status,
      apply: (patch) => setSettings((prev) => parseLiveSettings({ ...prev, ...patch }, prev)),
    }),
    [settings, status],
  );

  return <LiveSettingsContext.Provider value={value}>{children}</LiveSettingsContext.Provider>;
}

export function useLiveSettings(): LiveSettingsContextValue {
  const context = useContext(LiveSettingsContext);
  if (!context) throw new Error("useLiveSettings must be used inside LiveSettingsProvider");
  return context;
}
