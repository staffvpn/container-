import type { Offer } from "../types";

export const offers: Offer[] = [
  {
    id: "o1",
    supplierSlug: "rostery-nord",
    title: "Бесплатная доставка от 15 000 ₽",
    description: "Доставка кофе по Москве без наценки при заказе от 15 000 ₽.",
    city: "moscow",
    category: "coffee-tea",
    expiresAt: "2026-12-31",
  },
  {
    id: "o2",
    supplierSlug: "sirop-lab",
    title: "−15% новым клиентам",
    description: "Скидка на первый заказ сиропов и топпингов для новых кофеен.",
    city: "spb",
    category: "coffee-tea",
    expiresAt: "2026-11-30",
  },
  {
    id: "o3",
    supplierSlug: "vino-yug",
    title: "Специальные условия для баров",
    description: "Расширенная отсрочка платежа для баров при заказе от 10 000 ₽.",
    city: "krasnodar",
    category: "alcohol",
    expiresAt: "2026-10-31",
  },
  {
    id: "o4",
    supplierSlug: "eco-pack-nsk",
    title: "Бесплатный образец упаковки",
    description: "Пробный набор биоразлагаемой упаковки для новых клиентов.",
    city: "novosibirsk",
    category: "packaging",
    expiresAt: "2026-12-15",
  },
];
