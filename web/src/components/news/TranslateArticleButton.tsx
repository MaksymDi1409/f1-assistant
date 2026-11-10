"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { translateArticleAction } from "@/lib/cms/translate-actions";

type Props = {
  articleId: number;
  hasTranslation: boolean;
  labels: {
    translate: string;
    retranslate: string;
    translating: string;
    translated: string;
  };
};

// Кнопка для редактора й адміна: перекласти статтю англійською через ШІ
export default function TranslateArticleButton({ articleId, hasTranslation, labels }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await translateArticleAction(articleId);
      if (result.ok) {
        setMessage({ ok: true, text: labels.translated });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm hover:bg-subtle disabled:opacity-50"
      >
        {isPending ? labels.translating : hasTranslation ? labels.retranslate : labels.translate}
      </button>
      {message && (
        <span className={`text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
