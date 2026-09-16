"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: string; request_access?: boolean; lang?: string },
          callback: (user: Record<string, string | number> | false) => void,
        ) => void;
      };
    };
  }
}

export function TelegramLoginButton({ botId }: { botId: string }) {
  const router = useRouter();
  const scriptLoadedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  function handleLogin() {
    setError(null);

    if (!window.Telegram) {
      setError("Не удалось загрузить виджет Telegram. Проверьте подключение или блокировщик рекламы и попробуйте ещё раз.");
      return;
    }

    setLoading(true);
    window.Telegram.Login.auth({ bot_id: botId, request_access: true, lang: "ru" }, async (user) => {
      if (!user) {
        setLoading(false);
        setError("Вход через Telegram не завершён. Попробуйте ещё раз.");
        return;
      }

      try {
        const payload = Object.fromEntries(Object.entries(user).map(([k, v]) => [k, String(v)]));
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-auth`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.error ? `Ошибка входа: ${body.error}` : "Не удалось войти. Попробуйте ещё раз позже.");
          return;
        }

        const { access_token, refresh_token } = await response.json();
        const supabase = createBrowserSupabaseClient();
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionError) {
          setError("Не удалось создать сессию. Попробуйте ещё раз.");
          return;
        }

        router.push("/profile");
        router.refresh();
      } catch {
        setError("Не удалось связаться с сервером. Проверьте интернет-соединение и попробуйте снова.");
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        <TelegramIcon />
        {loading ? "Вход..." : "Войти через Telegram"}
      </button>
      {error && <p className="max-w-xs text-center text-sm text-[#b3261e]">{error}</p>}
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}
