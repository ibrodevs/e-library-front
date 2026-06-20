import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { BookCard } from '../../components/books/BookCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useBookmarks } from '../../hooks/useBookmarks';
import { getBooks, getCategories } from '../../services/api/bookApi';
import type { AppTheme } from '../../theme';
import type { Book, Category } from '../../types/book';
import type { BookmarkStatus } from '../../types/bookmark';

type CategoryFilter = 'all' | string;
type SortMode = 'default' | 'newest' | 'oldest' | 'title_asc' | 'title_desc';

const TEXT = {
  sortDefault: '\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e',
  sortNewest: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u043e\u0432\u044b\u0435',
  sortOldest: '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u0442\u0430\u0440\u044b\u0435',
  sortTitleAsc: '\u041f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e \u0410-\u042f',
  sortTitleDesc: '\u041f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e \u042f-\u0410',
  loadError:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.',
  catalog: '\u041a\u0430\u0442\u0430\u043b\u043e\u0433',
  search: '\u041f\u043e\u0438\u0441\u043a',
  searchPlaceholder:
    '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435, \u0430\u0432\u0442\u043e\u0440 \u0438\u043b\u0438 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
  filters: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b',
  sorting: '\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430',
  category: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f',
  all: '\u0412\u0441\u0435',
  apply: '\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c',
  reset: '\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c',
  resetFilters: '\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043a\u0430\u0442\u0430\u043b\u043e\u0433...',
  nothingFound: '\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e',
  emptyDescription:
    '\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a\u043e\u0432\u044b\u0439 \u0437\u0430\u043f\u0440\u043e\u0441, \u0444\u0438\u043b\u044c\u0442\u0440 \u0438\u043b\u0438 \u0441\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0443',
} as const;

const SORT_OPTIONS: Array<{ key: SortMode; label: string }> = [
  { key: 'default', label: TEXT.sortDefault },
  { key: 'newest', label: TEXT.sortNewest },
  { key: 'oldest', label: TEXT.sortOldest },
  { key: 'title_asc', label: TEXT.sortTitleAsc },
  { key: 'title_desc', label: TEXT.sortTitleDesc },
];

function normalizeText(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function getCategoryLabel(category?: Category | null): string {
  return category?.name?.trim() || category?.title?.trim() || '';
}

function getCategoryKey(category: Category): string {
  return (category.id != null ? String(category.id) : getCategoryLabel(category)).toLowerCase();
}

function getBookCategoryKey(book: Book): string {
  if (book.category && typeof book.category === 'object') {
    return getCategoryKey(book.category);
  }

  if (typeof book.category === 'number' || typeof book.category === 'string') {
    return String(book.category).toLowerCase();
  }

  return normalizeText(book.category_name);
}

function getYearValue(book: Book): number | null {
  const year = book.year;

  if (typeof year === 'number' && Number.isFinite(year)) {
    return year;
  }

  if (typeof year === 'string') {
    const parsed = Number.parseInt(year, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const createdAt = book.created_at ? Date.parse(book.created_at) : Number.NaN;
  return Number.isFinite(createdAt) ? createdAt : null;
}

function getSortLabel(sortMode: SortMode): string {
  return SORT_OPTIONS.find((option) => option.key === sortMode)?.label ?? TEXT.sortDefault;
}

export function CatalogScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { getBookmarkStatus } = useBookmarks();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [draftCategory, setDraftCategory] = useState<CategoryFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [draftSortMode, setDraftSortMode] = useState<SortMode>('default');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const [nextBooks, nextCategories] = await Promise.all([getBooks('ru'), getCategories('ru')]);
      setBooks(nextBooks);
      setCategories(nextCategories);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || requestError?.message || TEXT.loadError);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredBooks = useMemo(() => {
    const query = normalizeText(searchQuery);
    const categoryFilter = selectedCategory;

    const nextBooks = books.filter((book) => {
      const matchesQuery =
        !query ||
        [book.title, book.author, book.description]
          .filter(Boolean)
          .some((field) => normalizeText(field).includes(query));

      const matchesCategory =
        categoryFilter === 'all' ||
        (() => {
          const selected = categories.find((item) => getCategoryKey(item) === categoryFilter);

          if (!selected) {
            return true;
          }

          const selectedKey = getCategoryKey(selected);
          const selectedLabel = normalizeText(getCategoryLabel(selected));
          const bookCategoryKey = getBookCategoryKey(book);

          return (
            bookCategoryKey === selectedKey ||
            bookCategoryKey === selectedLabel ||
            normalizeText(book.category_name) === selectedLabel ||
            normalizeText(book.category_name) === categoryFilter
          );
        })();

      return matchesQuery && matchesCategory;
    });

    if (sortMode === 'default') {
      return nextBooks;
    }

    const sorted = [...nextBooks];

    sorted.sort((left, right) => {
      if (sortMode === 'title_asc' || sortMode === 'title_desc') {
        const leftTitle = normalizeText(left.title);
        const rightTitle = normalizeText(right.title);
        const comparison = leftTitle.localeCompare(rightTitle, 'ru', { sensitivity: 'base' });
        return sortMode === 'title_asc' ? comparison : -comparison;
      }

      const leftYear = getYearValue(left);
      const rightYear = getYearValue(right);
      const leftHasYear = leftYear !== null;
      const rightHasYear = rightYear !== null;

      if (leftHasYear && rightHasYear) {
        return sortMode === 'newest' ? rightYear! - leftYear! : leftYear! - rightYear!;
      }

      if (leftHasYear && !rightHasYear) {
        return -1;
      }

      if (!leftHasYear && rightHasYear) {
        return 1;
      }

      return normalizeText(left.title).localeCompare(normalizeText(right.title), 'ru', { sensitivity: 'base' });
    });

    return sorted;
  }, [books, categories, searchQuery, selectedCategory, sortMode]);

  const hasActiveCategory = selectedCategory !== 'all';
  const hasActiveSort = sortMode !== 'default';
  const hasActiveFilters = hasActiveCategory || hasActiveSort;
  const activeCategoryLabel =
    selectedCategory === 'all'
      ? null
      : getCategoryLabel(categories.find((item) => getCategoryKey(item) === selectedCategory));
  const filterCategories = useMemo(() => categories.filter((category) => getCategoryLabel(category)), [categories]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setDraftCategory('all');
    setSortMode('default');
    setDraftSortMode('default');
  };

  const applyCategoryFilter = () => {
    setSelectedCategory(draftCategory);
    setFilterModalVisible(false);
  };

  const applySort = () => {
    setSortMode(draftSortMode);
    setSortModalVisible(false);
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.header}>
        <AppText variant="h1">{TEXT.catalog}</AppText>
        <AppText color={theme.colors.textSecondary} variant="bodySmall">
          {filteredBooks.length} / {books.length}
        </AppText>
      </View>

      <AppInput
        autoCapitalize="none"
        autoCorrect={false}
        label={TEXT.search}
        onChangeText={setSearchQuery}
        placeholder={TEXT.searchPlaceholder}
        value={searchQuery}
      />

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            setDraftCategory(selectedCategory);
            setFilterModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.toolbarButton,
            hasActiveCategory ? styles.toolbarButtonActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons color={theme.colors.primary} name="options-outline" size={18} />
          <AppText color={theme.colors.textPrimary} style={styles.toolbarButtonText} variant="label">
            {TEXT.filters}
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => {
            setDraftSortMode(sortMode);
            setSortModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.toolbarButton,
            hasActiveSort ? styles.toolbarButtonActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons color={theme.colors.primary} name="swap-vertical-outline" size={18} />
          <AppText color={theme.colors.textPrimary} style={styles.toolbarButtonText} variant="label">
            {TEXT.sorting}
          </AppText>
        </Pressable>
      </View>

      {hasActiveFilters ? (
        <View style={styles.activeFilters}>
          {activeCategoryLabel ? (
            <View style={styles.activeChip}>
              <AppText color={theme.colors.primary} variant="caption">
                {TEXT.category}: {activeCategoryLabel}
              </AppText>
            </View>
          ) : null}
          {hasActiveSort ? (
            <View style={styles.activeChip}>
              <AppText color={theme.colors.primary} variant="caption">
                {TEXT.sorting}: {getSortLabel(sortMode)}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons color={theme.colors.primary} name="library-outline" size={18} />
          <View>
            <AppText style={styles.statValue} variant="title">
              {books.length}
            </AppText>
            <AppText color={theme.colors.textMuted} variant="caption">
              {TEXT.catalog}
            </AppText>
          </View>
        </View>
        <View style={styles.statCard}>
          <Ionicons color={theme.colors.primary} name="search-outline" size={18} />
          <View>
            <AppText style={styles.statValue} variant="title">
              {filteredBooks.length}
            </AppText>
            <AppText color={theme.colors.textMuted} variant="caption">
              {TEXT.search}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <LoadingState message={TEXT.loading} />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <ErrorState message={error} onRetry={() => void loadData(true)} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <FlatList
        data={filteredBooks}
        style={styles.listContainer}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CatalogBookItem bookmarkStatus={getBookmarkStatus(item.id)} book={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState title={TEXT.nothingFound} description={TEXT.emptyDescription} />
            {hasActiveFilters ? <AppButton title={TEXT.resetFilters} onPress={resetFilters} variant="secondary" /> : null}
          </View>
        }
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshing={isRefreshing}
        onRefresh={() => void loadData(true)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FilterModal
        categories={filterCategories}
        onApply={applyCategoryFilter}
        onClose={() => setFilterModalVisible(false)}
        onReset={() => {
          resetFilters();
          setFilterModalVisible(false);
        }}
        onSelectCategory={setDraftCategory}
        selectedCategory={draftCategory}
        visible={filterModalVisible}
      />

      <SortModal
        onApply={applySort}
        onClose={() => setSortModalVisible(false)}
        onReset={() => {
          setDraftSortMode('default');
          setSortMode('default');
          setSortModalVisible(false);
        }}
        onSelectSortMode={setDraftSortMode}
        selectedSortMode={draftSortMode}
        visible={sortModalVisible}
      />
    </AppScreen>
  );
}

function CatalogBookItem({ book, bookmarkStatus }: { book: Book; bookmarkStatus: BookmarkStatus | null }) {
  const navigation = useNavigation<any>();

  return <BookCard bookmarkStatus={bookmarkStatus} book={book} onPress={() => navigation.navigate('BookDetails', { book })} />;
}

function FilterModal({
  categories,
  onApply,
  onClose,
  onReset,
  onSelectCategory,
  selectedCategory,
  visible,
}: {
  categories: Category[];
  onApply: () => void;
  onClose: () => void;
  onReset: () => void;
  onSelectCategory: (category: CategoryFilter) => void;
  selectedCategory: CategoryFilter;
  visible: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <AppText variant="h2">{TEXT.filters}</AppText>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
                <Ionicons color={theme.colors.textPrimary} name="close" size={18} />
              </Pressable>
            </View>

            <AppText color={theme.colors.textSecondary} variant="bodySmall">
              {TEXT.category}
            </AppText>

            <View style={styles.chipsWrap}>
              <Pressable
                onPress={() => onSelectCategory('all')}
                style={({ pressed }) => [
                  styles.modalChip,
                  selectedCategory === 'all' ? styles.modalChipActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppText color={selectedCategory === 'all' ? theme.colors.primary : theme.colors.textSecondary} variant="bodySmall">
                  {TEXT.all}
                </AppText>
              </Pressable>

              {categories.map((category) => {
                const key = getCategoryKey(category);
                const label = getCategoryLabel(category);
                const active = selectedCategory === key;

                return (
                  <Pressable
                    key={key}
                    onPress={() => onSelectCategory(key)}
                    style={({ pressed }) => [
                      styles.modalChip,
                      active ? styles.modalChipActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <AppText color={active ? theme.colors.primary : theme.colors.textSecondary} variant="bodySmall">
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sheetActions}>
              <AppButton title={TEXT.apply} onPress={onApply} style={styles.sheetActionButton} />
              <AppButton title={TEXT.reset} onPress={onReset} style={styles.sheetActionButton} variant="ghost" />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SortModal({
  onApply,
  onClose,
  onReset,
  onSelectSortMode,
  selectedSortMode,
  visible,
}: {
  onApply: () => void;
  onClose: () => void;
  onReset: () => void;
  onSelectSortMode: (mode: SortMode) => void;
  selectedSortMode: SortMode;
  visible: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <AppText variant="h2">{TEXT.sorting}</AppText>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
                <Ionicons color={theme.colors.textPrimary} name="close" size={18} />
              </Pressable>
            </View>

            <View style={styles.sortList}>
              {SORT_OPTIONS.map((option) => {
                const active = selectedSortMode === option.key;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => onSelectSortMode(option.key)}
                    style={({ pressed }) => [
                      styles.sortItem,
                      active ? styles.sortItemActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <AppText color={active ? theme.colors.primary : theme.colors.textSecondary}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sheetActions}>
              <AppButton title={TEXT.apply} onPress={onApply} style={styles.sheetActionButton} />
              <AppButton title={TEXT.reset} onPress={onReset} style={styles.sheetActionButton} variant="ghost" />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
    headerBlock: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    header: {
      gap: theme.spacing.xs,
    },
    toolbar: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    toolbarButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
    },
    toolbarButtonActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    toolbarButtonText: {
      fontWeight: '700',
    },
    activeFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    activeChip: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    statCard: {
      flex: 1,
      minHeight: 68,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    statValue: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '700',
    },
    separator: {
      height: theme.spacing.sm,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emptyWrap: {
      gap: theme.spacing.md,
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-end',
    },
    modalSafeArea: {
      justifyContent: 'flex-end',
    },
    sheet: {
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
      ...theme.shadows.raised,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.border,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceMuted,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    modalChip: {
      height: 38,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalChipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    sheetActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    sheetActionButton: {
      flex: 1,
    },
    sortList: {
      gap: theme.spacing.xs,
    },
    sortItem: {
      minHeight: 46,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.spacing.md,
      justifyContent: 'center',
    },
    sortItemActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    pressed: {
      opacity: 0.78,
    },
  });
}
