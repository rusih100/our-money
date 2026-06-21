# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.
Язык общения в проекте — русский; код, команды и идентификаторы — английские.

## Что это

**Our Money** — десктоп-приложение для ручной разметки банковских CSV-выписок.
Пользователь загружает экспорт из банка, быстро классифицирует каждую транзакцию
горячими клавишами и выгружает обогащённый CSV с добавленными колонками.
Главный сценарий — **клавиатура-first**: мышь полностью опциональна.

Никакого облака, БД, авторизации или сети — только локальные файлы.

## Стек

- **Tauri 2** — ядро на Rust (нативный файловый I/O, диалоги, app-data).
- **React 19 + TypeScript + Vite 7** — фронтенд (web-UI внутри WebView2).
- **Tailwind CSS v4** (плагин `@tailwindcss/vite`) — плоский, плотный стиль
  (Linear/Raycast), тёмная тема по умолчанию + тумблер света.
- **Zustand** — состояние (без Redux).
- **PapaParse** — парсинг CSV на фронте.
- **@tanstack/react-virtual** — виртуализация таблицы.
- **encoding_rs** (Rust) — детект и декод Windows-1251 / UTF-8.

## Команды

```bash
npm install                          # зависимости
npm run tauri dev                    # dev-режим (открывает нативное окно, HMR)
npm run tauri build -- --no-bundle   # standalone .exe (release, без установщика)
npm run tauri build                  # полная сборка с установщиками (нужен WiX для .msi)
npm run build                        # только фронтенд: tsc --noEmit + vite build
npx tsc --noEmit                     # быстрая проверка типов фронтенда
cargo check                          # проверка Rust (из src-tauri/)
```

Среда: **Windows**, оболочка — **PowerShell**. Требуется Rust (stable),
Node.js LTS, MSVC Build Tools, WebView2 (предустановлен в Win 11).

## Архитектура

```
src/
  types.ts              доменные типы (Annotation, Transaction, Dataset, Filters). Без any.
  store.ts              Zustand: датасет, навигация, undo-стек, категории, фильтры, тема, тосты.
  hooks/useHotkeys.ts   глобальный обработчик клавиш с гейтингом по фокусу полей.
  lib/
    csv.ts              parseCsv, parseAmount, serializeCsv, deriveCategories; FIELD — имена колонок.
    storage.ts          персистентность в app-data (categories.json, progress/<key>.json).
    actions.ts          loadPath / browseAndLoad / exportDataset (диалоги + invoke Rust-команд).
    format.ts           formatAmount, shortDate.
  components/
    EmptyState.tsx      drag-and-drop + «Выбрать файл».
    TopBar.tsx          шапка: имя файла, переключатель вид, тема, экспорт, прогресс-бар.
    FocusedView.tsx     карточка одной транзакции + контролы разметки.
    ListView.tsx        виртуализированная таблица + фильтры + сводка.
    SummaryPanel.tsx    живая аналитика (need/want, повторяемость, по категориям).
    CategoryPanel.tsx   модалка управления категориями.
    HelpOverlay.tsx     шпаргалка горячих клавиш (?).
    Toast.tsx           всплывающие уведомления.
  App.tsx               компоновка, применение темы, debounced-автосейв прогресса.
src-tauri/
  src/lib.rs            Tauri-команды read_csv / write_csv (encoding_rs); регистрация плагинов.
  src/main.rs           точка входа (вызывает lib::run).
  capabilities/default.json  права плагинов (dialog, fs scope для $APPDATA).
  tauri.conf.json       окно, productName «Our Money», devUrl, bundle.
```

Поток данных: `actions.loadPath` → `invoke("read_csv")` (Rust декодирует) →
`csv.parseCsv` → `store.loadDataset` → UI читает из стора селекторами. Экспорт:
`csv.serializeCsv` → `invoke("write_csv")` (Rust кодирует в нужную кодировку).

## Аннотации (5 новых колонок, добавляются на экспорте; оригиналы не меняются)

| Колонка | Тип | Смысл |
|---|---|---|
| `true_category` | string | категория из управляемого списка |
| `is_recurring` | bool | повторяющийся vs разовый |
| `need_want` | `need` \| `want` \| `saving` | назначение траты |
| `note` | string | свободная заметка |
| `annotated` | bool | строка была размечена (прогресс/резюме) |

## Горячие клавиши

`j`/`↓` дальше · `k`/`↑` назад · `1`–`9` категория по позиции · `r` recurring ·
`n`/`w`/`s` need/want/saving · `c` фокус на заметку (`Esc` назад) · `Enter`
подтвердить+дальше · `u` undo · `/` поиск · `g``g` к первой неразмеченной ·
`?` шпаргалка · `Ctrl+S` экспорт.

## Критичные инварианты (НЕ сломать)

1. **Гейтинг хоткеев.** Пока фокус в текстовом поле (`note`/`search`), клавиши
   НЕ срабатывают — печатается текст; работает только `Esc`. Логика в
   `useHotkeys.ts` (`isEditable()` + `store.editing`). Каждое поле выставляет
   `setEditing(...)` на focus и `setEditing("none")` на blur. Это самый частый
   баг в подобных приложениях — проверять при любой правке ввода.
2. **Оригинальные колонки неизменны.** Разметка только добавляет новые колонки;
   `serializeCsv` выводит исходные ячейки дословно (запятая-десятичная и
   форматирование round-trip-ятся).
3. **Кодировка round-trip.** `read_csv` определяет кодировку (UTF-8 / Win-1251),
   `write_csv` пишет в той же. Детект: BOM → UTF-8; валидный UTF-8 → UTF-8; иначе
   Win-1251.
4. **Парсинг сумм.** `parseAmount` снимает все виды пробелов (вкл. неразрывные
   `     `), меняет `,`→`.`, юникод-минус→ASCII. Не ломать.
5. **Без `any`.** TypeScript strict, `noUnusedLocals/Parameters`. Держим типобезопасность.

## Гочи окружения

- **Vite + Windows + Node 24:** Vite по умолчанию биндится только на `::1`, и
  проба Tauri по `localhost` (IPv4) не коннектится → бесконечное «Waiting for
  your frontend dev server». Фикс уже в репо: `vite.config.ts` → `host:
  "127.0.0.1"`, `tauri.conf.json` → `devUrl: http://127.0.0.1:1420`. Не
  возвращать на `localhost`/`false`.
- **fs scope:** запись/создание app-data требует в `capabilities/default.json`
  и `$APPDATA`, и `$APPDATA/**` (маска `**` не покрывает сам каталог). Каталоги
  создаются `mkdir(recursive)` с подавлением «уже существует» в `storage.ts`.
- Имя крейта/бинаря — `our-money-scaffold` (исторически от scaffold), но
  productName приложения — «Our Money». Переименование крейта потребует правок в
  `Cargo.toml` (`package.name`, `lib.name`), `main.rs` и `tauri.conf.json`.

## Где хранятся данные

`%APPDATA%\com.ourmoney.annotator\`:
- `categories.json` — глобальный список категорий (между сессиями, общий для всех файлов).
- `progress\<hash>_<имя>.json` — прогресс разметки по каждому файлу (резюм с того же места).

Сам датасет НЕ переоткрывается автоматически — выписку надо подгрузить заново,
после чего подтягиваются прогресс и категории.

## Конвенции

- Комментарии и сообщения UI — по-русски; имена переменных/функций — английские.
- Компоненты — функциональные, типизированы (`React.ReactElement`), стор —
  через узкие селекторы `useStore((s) => s.x)`.
- Перед коммитом гонять `npx tsc --noEmit` и (при правках Rust) `cargo check`.
- Не коммитить `node_modules`, `dist`, `target`, локальные настройки `.claude/`.
