# Грядка — ручная настройка backend

Эти шаги нельзя выполнить автоматически — их должен сделать человек с
доступом к @BotFather и к панели Supabase.

## 1. Telegram-бот для входа

1. Открыть @BotFather в Telegram, выполнить `/newbot`, задать имя и username.
2. Выполнить `/setdomain` и указать домен, на котором будет жить сайт
   (например `gryadka.example.com`) — Telegram Login Widget работает только
   с зарегистрированным доменом.
3. Скопировать токен бота.

## 2. Secrets для Edge Function `telegram-auth`

В панели Supabase (не через MCP-инструменты — они не поддерживают secrets):
Project Settings → Edge Functions → Secrets, добавить:

- `TELEGRAM_BOT_TOKEN` — токен из шага 1.
- `SUPABASE_ANON_KEY` — anon-ключ проекта (Project Settings → API,
  `https://dojevarrfczgmyxzpfbx.supabase.co`).

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase добавляет
автоматически для каждой Edge Function — их задавать не нужно.

## 3. Подставить username бота в TelegramLoginButton

В `app/profile/page.tsx` заменить `"TODO_SET_AFTER_BOTFATHER"` на реальный
username бота (без `@`).

## 4. Приветственное сообщение от бота

При первой регистрации через Telegram бот сам пишет пользователю
"✅ Вы авторизовались на Грядке" с кнопкой "Открыть грядку". Кнопка сейчас
ведёт на плейсхолдер `https://gryadka.example/profile` — заменить на
настоящий домен сайта в `supabase/functions/telegram-auth` (функция
`sendWelcomeMessage`), когда сайт будет опубликован.

## 5. Реальный Telegram-канал для промо-блока на главной

Не связано с авторизацией — кнопка на главной странице в блоке про Telegram
(`app/page.tsx`) всё ещё указывает на `https://t.me/gryadka` (плейсхолдер).
Заменить на реальную ссылку, когда канал будет создан.

## Что уже работает без этих шагов

Каталог, поиск, карта, предложения, страница поставщика, форма «Стать
поставщиком» — всё уже на реальной базе данных и работает без Telegram.
Вход через Telegram нужен только для отзывов, формы «Добавить поставщика» и
полноценного профиля — до шагов выше кнопка входа просто не будет работать.
