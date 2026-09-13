"use client";

import { useState } from "react";
import Link from "next/link";

const points = [
  {
    title: "Поставщики разбросаны по десяткам сайтов и чатов",
    detail:
      "Каждый поставщик — отдельный сайт, прайс-лист или чат в Telegram. Чтобы сравнить пять поставщиков кофе, приходится открывать пять вкладок и переписываться в разных местах. Грядка собирает всё в одном каталоге.",
  },
  {
    title: "Сложно сравнить условия, доставку и минимальный заказ",
    detail:
      "Минимальный заказ, способы оплаты, отсрочка платежа и регионы доставки — у каждого поставщика указаны по-своему или вообще нигде. В карточке поставщика в Грядке эти условия показаны в одном виде, который легко сравнить.",
  },
  {
    title: "Непонятно, кому из поставщиков можно доверять",
    detail:
      "Статусы «Профиль подтверждён» и «Проверен Грядкой» присваиваются только после проверки — это не декоративный значок, а реальная отметка о том, что информация прошла проверку.",
  },
  {
    title: "Поиск нового поставщика занимает недели",
    detail:
      "Вместо звонков по знакомым и поиска в поисковике — фильтр по городу, категории и условиям работы, который сразу показывает подходящих поставщиков.",
  },
];

export function WhyGryadkaSection() {
  const [active, setActive] = useState(0);
  const current = points[active];

  return (
    <section className="grid grid-cols-1 gap-10 md:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col gap-6">
        <span className="w-fit rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Почему мы
        </span>
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
          Не искать поставщика по десяти сайтам
        </h2>
        <div className="flex flex-col gap-3">
          {points.map((point, i) => {
            const isActive = i === active;
            return (
              <button
                key={point.title}
                onClick={() => setActive(i)}
                className={`flex items-center gap-4 rounded-[20px] px-5 py-4 text-left transition-colors ${
                  isActive ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-panel)]"
                }`}
              >
                <span
                  className={`text-2xl font-semibold ${
                    isActive ? "text-white/40" : "text-[var(--color-ink-soft)]/40"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium">{point.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex aspect-[4/3] items-center justify-center rounded-[28px] bg-[var(--color-panel)] text-sm text-[var(--color-ink-soft)] md:aspect-auto md:min-h-[420px]">
          Фото
        </div>
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-sm text-[var(--color-ink-soft)]">{current.detail}</p>
          <Link
            href="/suppliers"
            className="shrink-0 rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Смотреть поставщиков
          </Link>
        </div>
      </div>
    </section>
  );
}
