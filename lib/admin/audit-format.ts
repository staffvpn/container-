const fieldLabels: Record<string, string> = {
  name: "Название",
  short_description: "Краткое описание",
  about: "Описание",
  founded_year: "Год основания",
  logo_url: "Логотип",
  city_id: "Город",
  status: "Статус",
  verification_level: "Проверка",
  website_url: "Сайт",
  telegram: "Telegram",
  phone: "Телефон",
  email: "Email",
  contact_notes: "Другие способы связи",
  terms_notes: "Доп. условия",
  admin_notes: "Заметки администратора",
  min_order: "Минимальный заказ",
  delivery_available: "Доставка",
  pickup_available: "Самовывоз",
  works_with_legal_entities: "Работа с юрлицами",
  works_with_individual_entrepreneurs: "Работа с ИП",
  deferred_payment: "Отсрочка платежа",
  payment_methods: "Способы оплаты",
  category_ids: "Категории",
  categorySlugs: "Категории",
  service_city_ids: "Города обслуживания",
  address: "Адрес",
  lat: "Широта",
  lng: "Долгота",
  label: "Тип адреса",
  region: "Регион",
  postal_code: "Индекс",
  working_hours: "Часы работы",
  comment: "Комментарий",
  is_primary: "Основной адрес",
  geocoding_status: "Геокодирование",
  position: "Должность",
  role: "Роль",
  role_offered: "Предложенная роль",
  role_granted: "Назначенная роль",
  note: "Заметка",
  invited_user_id: "Приглашённый пользователь",
  owner_user_id: "Владелец",
  previous_owner_fate: "Судьба прежнего владельца",
  permissions: "Права",
  issueType: "Тип проблемы",
  supplierSlug: "Поставщик",
  city: "Город",
  companyName: "Название компании",
  contactName: "Контактное лицо",
  user_id: "Пользователь",
  id: "ID",
};

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  pending: "На проверке",
  published: "Опубликован",
  hidden: "Скрыт",
  rejected: "Отклонён",
  blocked: "Заблокирован",
  archived: "В архиве",
};

const roleLabels: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор компании",
  editor: "Редактор",
  viewer: "Только просмотр",
};

const verificationLabels: Record<string, string> = {
  none: "Не подтверждён",
  confirmed: "Профиль подтверждён",
  verified: "Проверен Грядкой",
};

const geocodingLabels: Record<string, string> = {
  pending: "Ожидает",
  success: "Определены автоматически",
  failed: "Не удалось определить",
  manual: "Указаны вручную",
};

const issueTypeLabels: Record<string, string> = {
  wrong_phone: "Неверный телефон",
  wrong_website: "Неверный сайт",
  company_closed: "Компания больше не работает",
  wrong_address: "Неверный адрес",
  wrong_category: "Неправильная категория",
  other: "Другое",
};

const previousOwnerFateLabels: Record<string, string> = {
  demote: "стал администратором компании",
  remove: "потерял доступ",
};

const enumFieldLabels: Record<string, Record<string, string>> = {
  status: statusLabels,
  role: roleLabels,
  role_offered: roleLabels,
  role_granted: roleLabels,
  verification_level: verificationLabels,
  geocoding_status: geocodingLabels,
  issueType: issueTypeLabels,
  previous_owner_fate: previousOwnerFateLabels,
};

function humanizeKey(key: string): string {
  return fieldLabels[key] ?? key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatScalar(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (Array.isArray(value)) return value.map((v) => formatScalar(key, v)).join(", ");
  if (key === "permissions") {
    if (value === "full_access") return "Полный доступ";
    if (Array.isArray(value) && value.length === 0) return "Ограниченные (без дополнительных прав)";
  }
  const enumLabels = enumFieldLabels[key];
  if (enumLabels && typeof value === "string" && enumLabels[value]) return enumLabels[value];
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export type AuditField = { label: string; oldText?: string; newText: string };

export function formatAuditValues(oldValue: unknown, newValue: unknown): AuditField[] {
  const oldObj = oldValue && typeof oldValue === "object" && !Array.isArray(oldValue) ? (oldValue as Record<string, unknown>) : null;
  const newObj = newValue && typeof newValue === "object" && !Array.isArray(newValue) ? (newValue as Record<string, unknown>) : null;

  if (oldObj && newObj) {
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const fields: AuditField[] = [];
    for (const key of keys) {
      const before = formatScalar(key, oldObj[key]);
      const after = formatScalar(key, newObj[key]);
      if (before === after) continue;
      fields.push({ label: humanizeKey(key), oldText: before, newText: after });
    }
    return fields;
  }

  const only = newObj ?? oldObj;
  if (only) {
    return Object.entries(only).map(([key, value]) => ({
      label: humanizeKey(key),
      newText: formatScalar(key, value),
    }));
  }

  if (newValue !== undefined && newValue !== null) {
    return [{ label: "Значение", newText: formatScalar("value", newValue) }];
  }
  return [];
}
