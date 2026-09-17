"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const errorMessages: Record<string, string> = {
  "Invalid login credentials": "Неверная почта или пароль.",
  "User already registered": "Пользователь с такой почтой уже зарегистрирован.",
  "Password should be at least 6 characters": "Пароль должен быть не короче 6 символов.",
  "Email not confirmed": "Подтвердите почту по ссылке из письма перед входом.",
};

function translateError(message: string): string {
  return errorMessages[message] ?? message;
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();

    if (mode === "register") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || null } },
      });

      if (signUpError) {
        setError(translateError(signUpError.message));
        setLoading(false);
        return;
      }

      if (!data.session) {
        setNotice("Регистрация почти завершена — подтвердите почту по ссылке из письма, затем войдите.");
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(translateError(signInError.message));
        setLoading(false);
        return;
      }
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex rounded-full bg-[var(--color-panel)] p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-full py-2 font-medium transition ${
            mode === "login" ? "bg-white shadow-sm" : "text-[var(--color-ink-soft)]"
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-full py-2 font-medium transition ${
            mode === "register" ? "bg-white shadow-sm" : "text-[var(--color-ink-soft)]"
          }`}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Имя"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          required
          placeholder="Почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
        {error && <p className="text-center text-sm text-[#b3261e]">{error}</p>}
        {notice && <p className="text-center text-sm text-[var(--color-ink-soft)]">{notice}</p>}
      </form>
    </div>
  );
}
