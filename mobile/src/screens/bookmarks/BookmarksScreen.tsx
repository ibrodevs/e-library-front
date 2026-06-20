import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BookCard } from '../../components/books/BookCard';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useBookmarks } from '../../hooks/useBookmarks';
import { dedupeBookmarks } from '../../services/bookmarks/bookmarkStorage';
import type { AppTheme } from '../../theme';
import type { Book } from '../../types/book';
import type { BookmarkItem, BookmarkStatus } from '../../types/bookmark';

type BookmarkTab = 'all' | BookmarkStatus;

const STATUS_LABELS: Record<BookmarkStatus, string> = {
  liked: 'Понравившиеся',
  reading: 'Читаю',
  planned: 'Прочитаю позже',
  completed: 'Прочитано',
  dropped: 'Брошено',
};

const TABS: Array<{ key: BookmarkTab; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'liked', label: 'Понравившиеся' },
  { key: 'reading', label: 'Читаю' },
  { key: 'planned', label: 'Прочитаю позже' },
  { key: 'completed', label: 'Прочитано' },
  { key: 'dropped', label: 'Брошено' },
];

function bookmarkToBook(bookmark: BookmarkItem): Book {
  return {
    id: bookmark.bookId,
    title: bookmark.title,
    author: bookmark.author,
    cover_image_url: bookmark.cover_image_url,
    category_name: bookmark.category_name,
    year: bookmark.year,
    description: '',
  };
}

export function BookmarksScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { bookmarks, isLoading } = useBookmarks();
  const [activeTab, setActiveTab] = useState<BookmarkTab>('all');

  const dedupedBookmarks = useMemo(() => dedupeBookmarks(bookmarks), [bookmarks]);
  const books = useMemo(() => {
    if (activeTab === 'all') {
      return dedupedBookmarks;
    }

    return dedupedBookmarks.filter((bookmark) => bookmark.status === activeTab);
  }, [activeTab, dedupedBookmarks]);

  const emptyMessage = useMemo(() => {
    if (activeTab === 'all') {
      return 'Здесь пока нет сохранённых книг.';
    }

    return `Здесь пока нет книг со статусом "${STATUS_LABELS[activeTab]}".`;
  }, [activeTab]);

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.header}>
        <AppText variant="h1">Закладки</AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroller}
      >
        {TABS.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, pressed ? styles.pressed : null]}
            >
              <AppText color={active ? theme.colors.primary : theme.colors.textSecondary} style={styles.chipText} variant="bodySmall">
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <LoadingState message="Загружаем закладки..." />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <FlatList
        data={books}
        style={styles.listContainer}
        keyExtractor={(item) => String(item.bookId)}
        renderItem={({ item }) => {
          const book = bookmarkToBook(item);

          return (
            <BookCard
              bookmarkStatus={item.status}
              book={book}
              onPress={() =>
                navigation.navigate('BookDetails', {
                  bookId: item.bookId,
                  book,
                })
              }
            />
          );
        }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState title="Пока пусто" description={emptyMessage} />}
        ListHeaderComponent={header}
      />
    </AppScreen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screenContent: {
      padding: 0,
    },
    list: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: 120,
    },
    listContainer: {
      flex: 1,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerBlock: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    header: {
      gap: theme.spacing.xs,
    },
    tabsScroller: {
      maxHeight: 42,
    },
    tabsRow: {
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingRight: theme.spacing.lg,
    },
    chip: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 38,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      flexShrink: 0,
    },
    chipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    chipText: {
      fontWeight: '700',
    },
    separator: {
      height: theme.spacing.sm,
    },
    pressed: {
      opacity: 0.78,
    },
  });
}
