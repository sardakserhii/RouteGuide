# Миграция на Supabase PostgreSQL

Этот документ описывает процесс миграции базы данных POI из SQLite в Supabase PostgreSQL.

## Проблема

Изначально данные берутся из Overpass API и сохраняются в локальную базу данных SQLite (`backend/data/poi_cache.db`). Для использования Supabase PostgreSQL необходимо:

1. Создать таблицы в Supabase
2. Настроить подключение к базе данных
3. Мигрировать существующие данные из SQLite (опционально)

## Шаг 1: Создание таблиц в Supabase

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в раздел **SQL Editor**
3. Создайте новый запрос и вставьте содержимое файла `backend/migrations/001_initial_schema.sql`
4. Выполните запрос

### Вариант B: Через Supabase CLI

```bash
# Установите Supabase CLI (если ещё не установлен)
npm install -g supabase

# Войдите в систему
supabase login

# Примените миграцию
supabase db push
```

## Шаг 2: Получение строки подключения

1. Откройте ваш проект в Supabase Dashboard
2. Перейдите в **Settings** → **Database**
3. Найдите раздел **Connection string** → **URI**
4. Скопируйте строку подключения. Она будет выглядеть примерно так:
    ```
    postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
    ```
5. Замените `[YOUR-PASSWORD]` на ваш пароль базы данных

## Шаг 3: Настройка подключения

1. Откройте файл `backend/.env`
2. Добавьте или обновите строку `DATABASE_URL`:
    ```env
    DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
    ```

## Шаг 4: Миграция данных из SQLite (опционально)

Если у вас уже есть данные в SQLite и вы хотите перенести их в PostgreSQL:

```bash
cd backend
npm run migrate:postgres
```

Этот скрипт:

-   Считает все данные из SQLite (`data/poi_cache.db`)
-   Перенесет их в Supabase PostgreSQL
-   Проверит корректность миграции

## Шаг 5: Перезапуск приложения

После настройки `DATABASE_URL` перезапустите backend:

```bash
cd backend
npm run dev
```

Теперь приложение будет:

-   ✅ Проверять наличие данных в PostgreSQL
-   ✅ Загружать новые данные из Overpass API при необходимости
-   ✅ Сохранять все данные в Supabase PostgreSQL
-   ✅ Использовать кеширование на основе тайлов

## Проверка

Убедитесь, что подключение работает:

1. При запуске backend вы должны увидеть:

    ```
    Using Postgres database
    ```

2. В Supabase Dashboard → **Table Editor** вы должны увидеть таблицы:

    - `pois` - точки интереса
    - `tiles` - тайлы для кеширования
    - `tile_pois` - связи между тайлами и POI

3. После первого запроса данные должны появиться в таблицах

## Возврат к SQLite

Если вы хотите вернуться к использованию SQLite:

1. Откройте `backend/.env`
2. Закомментируйте или удалите строку `DATABASE_URL`:
    ```env
    # DATABASE_URL=postgresql://...
    ```
3. Перезапустите backend

## Структура базы данных

### Таблица `pois`

Хранит точки интереса (POI) из Overpass API.

| Колонка    | Тип              | Описание                              |
| ---------- | ---------------- | ------------------------------------- |
| id         | TEXT             | PRIMARY KEY, формат: "node/123456"    |
| osm_type   | TEXT             | Тип OSM объекта (node/way/relation)   |
| osm_id     | BIGINT           | ID объекта в OSM                      |
| lat        | DOUBLE PRECISION | Широта                                |
| lon        | DOUBLE PRECISION | Долгота                               |
| tags       | JSONB            | Теги OSM (название, категория и т.д.) |
| updated_at | TIMESTAMP        | Дата последнего обновления            |

### Таблица `tiles`

Хранит метаданные тайлов для пространственного кеширования.

| Колонка         | Тип              | Описание                         |
| --------------- | ---------------- | -------------------------------- |
| id              | TEXT             | ID тайла (часть PRIMARY KEY)     |
| min_lat/max_lat | DOUBLE PRECISION | Границы тайла по широте          |
| min_lon/max_lon | DOUBLE PRECISION | Границы тайла по долготе         |
| filters_hash    | TEXT             | Хеш фильтров (часть PRIMARY KEY) |
| fetched_at      | TIMESTAMP        | Время загрузки данных            |

### Таблица `tile_pois`

Связывает тайлы с POI.

| Колонка      | Тип  | Описание          |
| ------------ | ---- | ----------------- |
| tile_id      | TEXT | ID тайла (FK)     |
| filters_hash | TEXT | Хеш фильтров (FK) |
| poi_id       | TEXT | ID POI (FK)       |

## Устранение неполадок

### Ошибка подключения

```
Error: connect ECONNREFUSED
```

**Решение**: Проверьте правильность строки подключения в `.env`

### Ошибка SSL

```
Error: self signed certificate in certificate chain
```

**Решение**: Убедитесь, что в `postgresAdapter.ts` установлено:

```typescript
ssl: {
    rejectUnauthorized: false;
}
```

### Данные не сохраняются

1. Проверьте, что `DATABASE_URL` установлена:

    ```bash
    cd backend
    node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')"
    ```

2. Проверьте логи при запуске:

    - "Using Postgres database" ✅
    - "Using SQLite database" ❌ (DATABASE_URL не установлена)

3. Проверьте таблицы в Supabase Dashboard → SQL Editor:
    ```sql
    SELECT COUNT(*) FROM pois;
    SELECT COUNT(*) FROM tiles;
    SELECT COUNT(*) FROM tile_pois;
    ```

## Дополнительная информация

-   [Supabase Documentation](https://supabase.com/docs)
-   [PostgreSQL Connection URIs](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
-   [Backend POI Caching Architecture](./poi-caching.md)
