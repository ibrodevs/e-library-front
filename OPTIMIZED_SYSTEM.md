# 📚 Оптимизированная система каталога электронных книг

## 🎯 Реализованные функции

### ✅ 1. Каталог книг с виртуализацией

- **Технология**: React Virtuoso для рендеринга только видимых элементов
- **Производительность**: Поддержка тысяч книг без потери производительности
- **Компонент**: `src/pages/CatalogOptimized.tsx`

### ✅ 2. Prefetching (Предзагрузка)

- При наведении на карточку книги (`onMouseEnter`) автоматически загружаются:
  - Метаданные книги
  - Первая страница PDF
- **Hook**: `usePrefetchBook()` из`src/hooks/useBookQueries.ts`

### ✅ 3. Мгновенный переход с Initial Data

- При клике на книгу ридер открывается**мгновенно**
- Используются данные из кэша списка (`useBookInitialData`)
- Отображается обложка и название пока грузится PDF
- **Hook**: `useBookInitialData()` из `src/hooks/useBookQueries.ts`

### ✅ 4. Оптимизация ридера

- **staleTime: Infinity** - данные книги не меняются
- **Ленивая загрузка**: загружаются только текущая + соседние страницы
- **Prefetch соседних страниц**: `usePrefetchPages()`
- **Компонент**: `src/pages/BookReaderOptimized.tsx`

### ✅ 5. UI/UX компоненты

- Красивые скелетоны для обложек (`BookCardSkeleton`)
- Индикатор прогресса загрузки PDF (`PdfLoadingIndicator`)
- Анимации и плавные переходы
- **Компоненты**: `src/components/skeletons/BookSkeleton.tsx`

## 📁 Структура проекта

```
src/
├── api/
│   └── bookApi.ts              # API слой с TypeScript
├── components/
│   └── skeletons/
│       └── BookSkeleton.tsx    # Скелетоны и лоадеры
├── hooks/
│   └── useBookQueries.ts       # TanStack Query hooks
├── lib/
│   └── queryClient.ts          # QueryClient настройка
├── pages/
│   ├── CatalogOptimized.tsx    # Каталог с виртуализацией
│   └── BookReaderOptimized.tsx # Оптимизированный ридер
├── types/
│   └── book.ts                 # TypeScript типы
└── App.tsx                     # Root с QueryClientProvider
```

## 🚀 Использование

### 1. QueryClient Provider

Приложение обернуто в `QueryClientProvider`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

<QueryClientProvider client={queryClient}>
  <Router>
    <Layout />
  </Router>
</QueryClientProvider>;
```

### 2. Каталог с виртуализацией

```tsx
import CatalogOptimized from "./pages/CatalogOptimized";

// Использует:
// - useBooks() для загрузки списка
// - usePrefetchBook() для предзагрузки
// - Virtuoso для виртуализации
```

### 3. Hooks для работы с книгами

#### Получение списка книг

```tsx
const {
  data: books,
  isLoading,
  error,
} = useBooks({
  language: "ru",
  category: "1",
});
```

#### Prefetch книги

```tsx
const prefetchBook = usePrefetchBook();

// При наведении на карточку
<div onMouseEnter={() => prefetchBook(bookId)}>{/* Book card */}</div>;
```

#### Получение книги с initial data

```tsx
const initialData = useBookInitialData(bookId);
const { data: book } = useBook(bookId); // Использует initial data автоматически
```

#### Prefetch соседних страниц

```tsx
const prefetchPages = usePrefetchPages(bookId, currentPage);

useEffect(() => {
  prefetchPages(); // Загружает currentPage-1 и currentPage+1
}, [currentPage]);
```

## 🔧 Конфигурация

### QueryClient настройки

```typescript
// src/lib/queryClient.ts
{
  staleTime: 1000 * 60 * 5,    // 5 минут (общее)
  gcTime: 1000 * 60 * 30,      // 30 минут кэширования
  retry: 3,
  refetchOnWindowFocus: false
}

// Для книг:
staleTime: Infinity  // Данные не меняются
```

### Query Keys

Централизованное управление ключами:

```typescript
queryKeys.books.all; // ['books']
queryKeys.books.list(params); // ['books', 'list', params]
queryKeys.books.detail(id); // ['books', 'detail', id]
queryKeys.pages.page(id, page); // ['pages', id, pageNumber]
```

## 🎨 Компоненты UI

### Book Card Skeleton

```tsx
import { BookCardSkeleton } from "./components/skeletons/BookSkeleton";

{
  isLoading && <BookCardSkeleton />;
}
```

### PDF Loading Indicator

```tsx
import { PdfLoadingIndicator } from "./components/skeletons/BookSkeleton";

<PdfLoadingIndicator progress={75} />;
```

## 📊 React Query DevTools

В режиме разработки доступны DevTools:

- Просмотр всех queries
- Состояние кэша
- Время жизни данных
- Ручная инвалидация

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />;
```

## 🔍 TypeScript Types

### Основные типы

```typescript
interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  category: number;
  cover_image_url?: string;
  pdf_file_url?: string;
  total_pages?: number;
}

interface Category {
  id: number;
  name: string;
}
```

## ⚡ Оптимизации

### 1. Виртуализация

- Рендерятся только видимые книги
- Scroll performance оптимизирован
- Поддержка тысяч элементов

### 2. Smart Caching

- Автоматическое кэширование запросов
- Переиспользование данных между компонентами
- Минимум запросов к API

### 3. Prefetching

- Проактивная загрузка при hover
- Загрузка соседних страниц в ридере
- Мгновенный UX

### 4. Code Splitting

- Lazy loading компонентов (при необходимости)
- Tree shaking
- Минимальный bundle size

## 🛠️ Команды

```bash
# Разработка
npm run dev

# TypeScript проверка
npx tsc --noEmit

# Build
npm run build

# Preview
npm run preview
```

## 📝 Примеры использования

### Создание новой страницы с TanStack Query

```tsx
import { useBooks } from "../hooks/useBookQueries";

const MyPage = () => {
  const { data, isLoading, error } = useBooks();

  if (isLoading) return <BookGridSkeleton />;
  if (error) return <ErrorDisplay />;

  return (
    <div>
      {data.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};
```

### Инвалидация кэша

```tsx
import { useInvalidateBooks } from "../hooks/useBookQueries";

const invalidate = useInvalidateBooks();

// После обновления книги
invalidate(); // Обновит все запросы к books
```

## 🎯 Лучшие практики

1. **Всегда используйте TypeScript типы** для безопасности
2. **Используйте queryKeys** из `lib/queryClient.ts`
3. **Prefetch** данных при возможности (hover, route anticipation)
4. **Initial data** для мгновенных переходов
5. **staleTime: Infinity** для статичных данных
6. **Виртуализация** для больших списков

## 🐛 Отладка

### DevTools

- Открыть: клик на иконку React Query в правом нижнем углу
- Просмотреть queries, mutations, кэш
- Ручная инвалидация и рефетч

### Логирование

```typescript
// Включить debug режим
queryClient.setLogger({
  log: console.log,
  warn: console.warn,
  error: console.error,
});
```

## 📚 Дополнительные ресурсы

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Virtuoso](https://virtuoso.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Разработано с ❤️ используя React, TanStack Query v5, TypeScript и Tailwind CSS**
