# Ремонтная служба — Система управления заявками

Веб-приложение для приёма и обработки заявок в ремонтную службу.

## Стек технологий

- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **База данных:** PostgreSQL
- **Инфраструктура:** Docker Compose

## Быстрый запуск (Docker Compose)

```bash
docker compose up --build
```

Приложение будет доступно по адресу: **http://localhost:3000**

API сервер: **http://localhost:3001**

## Тестовые пользователи

| Логин | Пароль | Роль | Имя |
|---|---|---|---|
| `dispatcher` | `dispatcher123` | Диспетчер | Иванова Мария Петровна |
| `master1` | `master123` | Мастер | Сидоров Алексей Иванович |
| `master2` | `master123` | Мастер | Козлов Дмитрий Сергеевич |

На странице входа доступны кнопки быстрого входа для каждого тестового аккаунта.

## Запуск без Docker

### Требования
- Node.js 20+
- PostgreSQL 16+

### Шаги

```bash
# 1. Установить зависимости
cd backend && npm install
cd ../frontend && npm install

# 2. Настроить переменные окружения
cd ../backend
export DATABASE_URL="postgresql://user:password@localhost:5432/repair_service"
export JWT_SECRET="dev-secret"

# 3. Выполнить миграции и засеять БД
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 4. Запустить backend
npm run dev  # http://localhost:3001

# 5. Запустить frontend (в другом терминале)
cd ../frontend
npm run dev  # http://localhost:5173
```

## Проверка "гонки" (Race Condition)

Действие "Взять в работу" защищено от параллельных запросов через **optimistic concurrency control** (поле `version` в таблице `requests`).

### Автоматический скрипт

```bash
chmod +x race_test.sh
./race_test.sh http://localhost:3000
```

### Ручная проверка (два терминала)

```bash
# Терминал 1: Авторизация
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"master1","password":"master123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Создайте заявку и назначьте мастеру через UI, запомните ID заявки (например, 10)

# Терминал 1 и 2 одновременно:
curl -X PATCH http://localhost:3000/api/requests/10/take \
  -H "Authorization: Bearer $TOKEN"
```

Ожидаемый результат: один запрос получает `200 OK`, второй — `409 Conflict`.

## Автотесты

```bash
cd backend

# Требуется запущенная БД с сидами
export DATABASE_URL="postgresql://repair:repair_secret@localhost:5432/repair_service"
npm test
```

Тесты включают:
- `tests/requests.test.ts` — CRUD операции, авторизация, роли
- `tests/race.test.ts` — проверка параллельных запросов "Взять в работу"

## Структура проекта

```
├── docker-compose.yml        # Docker Compose конфигурация
├── backend/
│   ├── src/
│   │   ├── index.ts          # Точка входа
│   │   ├── app.ts            # Express приложение
│   │   ├── routes/           # API маршруты
│   │   ├── services/         # Бизнес-логика
│   │   ├── middleware/       # Auth, error handling
│   │   └── lib/              # Prisma клиент
│   ├── prisma/
│   │   ├── schema.prisma     # Схема БД
│   │   └── seed.ts           # Сиды
│   └── tests/                # Автотесты
├── frontend/
│   ├── src/
│   │   ├── pages/            # Страницы (Login, Create, Dispatcher, Master)
│   │   ├── components/       # UI компоненты
│   │   ├── context/          # React Context (Auth)
│   │   └── api.ts            # API клиент
│   └── nginx.conf            # Nginx для production
├── race_test.sh              # Скрипт проверки гонки
├── README.md
├── DECISIONS.md
└── PROMPTS.md
```

## Дополнительные фичи

- **Audit Log** — история всех действий по заявке (кто, когда, что изменил)
- **Приоритеты** — low / normal / high / urgent с цветовой индикацией
- **Комментарии** — диспетчер и мастер могут оставлять заметки к заявке
- **Статистика** — панель диспетчера показывает количество заявок по статусам
- **Поиск** — поиск заявок по клиенту, адресу, телефону, описанию
