import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { fetchBookById } from '../../services/api/bookApi';
import type { AppTheme } from '../../theme';
import type { Book } from '../../types/book';
import type { BookmarkStatus } from '../../types/bookmark';

const BOOKMARK_OPTIONS: Array<{ label: string; status: BookmarkStatus }> = [
  { label: 'Понравившиеся', status: 'liked' },
  { label: 'Читаю', status: 'reading' },
  { label: 'Прочитаю позже', status: 'planned' },
  { label: 'Прочитано', status: 'completed' },
  { label: 'Брошено', status: 'dropped' },
];

const STATUS_LABELS: Record<BookmarkStatus, string> = {
  liked: 'Понравившиеся',
  reading: 'Читаю',
  planned: 'Прочитаю позже',
  completed: 'Прочитано',
  dropped: 'Брошено',
};

function getFallbackBook(bookId = 0): Book {
  return {
    id: bookId,
    title: 'Книга',
    author: '',
    description: '',
  };
}

function getBookYear(book: Book): string | null {
  if (typeof book.year === 'number' || typeof book.year === 'string') {
    const value = String(book.year).trim();
    return value || null;
  }

  if (book.created_at) {
    const date = new Date(book.created_at);
    if (!Number.isNaN(date.getTime())) {
      return String(date.getFullYear());
    }
  }

  return null;
}

export function BookDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { getBookmarkStatus, saveBookmark } = useBookmarks();
  const routeBook = route.params?.book as Book | undefined;
  const routeBookId = route.params?.bookId as number | undefined;
  const [book, setBook] = useState<Book | null>(routeBook ?? null);
  const [isLoading, setIsLoading] = useState(!routeBook);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkModalVisible, setBookmarkModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookmarkStatus>('planned');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const idToFetch = routeBookId ?? routeBook?.id;

    async function loadBook() {
      if (!idToFetch) {
        setBook((current) => current ?? getFallbackBook());
        setIsLoading(false);
        return;
      }

      if (!book) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response = await fetchBookById(idToFetch);
        if (mounted) {
          setBook(response);
        }
      } catch {
        if (mounted && !book) {
          setError('Не удалось загрузить данные книги.');
          setBook(getFallbackBook(idToFetch));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadBook();

    return () => {
      mounted = false;
    };
  }, [routeBook?.id, routeBookId]);

  const currentBook = useMemo(() => book ?? getFallbackBook(routeBookId), [book, routeBookId]);
  const coverUri = currentBook.cover_image_url || currentBook.cover_image || null;
  const yearLabel = getBookYear(currentBook);
  const currentBookmarkStatus = currentBook.id ? getBookmarkStatus(currentBook.id) : null;
  const currentBookmarkLabel = currentBookmarkStatus ? STATUS_LABELS[currentBookmarkStatus] : null;
  const description = currentBook.description?.trim() || 'Описание отсутствует';
  const { progress: readingProgress, reload: reloadReadingProgress } = useReadingProgress(currentBook.id || null);
  const readButtonTitle = readingProgress?.currentPage ? 'Продолжить чтение' : 'Читать';

  useFocusEffect(
    useCallback(() => {
      void reloadReadingProgress();
    }, [reloadReadingProgress])
  );

  useEffect(() => {
    if (currentBookmarkStatus) {
      setSelectedStatus(currentBookmarkStatus);
    }
  }, [currentBookmarkStatus]);

  const handleRead = () => {
    navigation.navigate('BookReader', {
      bookId: currentBook.id,
      title: currentBook.title ?? 'Книга',
      pdfUrl: currentBook.pdf_file_url,
      cover_image_url: coverUri,
      initialPage: readingProgress?.currentPage ?? null,
      totalPages: currentBook.total_pages ?? readingProgress?.totalPages ?? null,
    });
  };

  const handleSelectBookmark = async (status: BookmarkStatus) => {
    setSelectedStatus(status);

    await saveBookmark({
      bookId: currentBook.id,
      title: currentBook.title ?? 'Без названия',
      author: currentBook.author ?? '',
      cover_image_url: currentBook.cover_image_url ?? currentBook.cover_image ?? undefined,
      category_name: currentBook.category_name ?? undefined,
      year: currentBook.year ?? null,
      status,
    });

    setSavedMessage(`Статус обновлён: ${STATUS_LABELS[status]}`);
    setBookmarkModalVisible(false);
  };

  if (isLoading) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <LoadingState message="Загружаем книгу..." />
      </AppScreen>
    );
  }

  if (error && !currentBook.id) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <ErrorState message={error} onRetry={() => navigation.goBack()} />
      </AppScreen>
    );
  }

  return (
    <View style={styles.root}>
      <AppScreen scrollable contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
          <Ionicons color={theme.colors.primary} name="chevron-back" size={18} />
          <AppText color={theme.colors.primary} style={styles.backText} variant="label">
            Вернуться
          </AppText>
        </Pressable>

        <View style={styles.coverWrap}>
          <View style={styles.coverFrame}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons color={theme.colors.primary} name="book-outline" size={42} />
                <AppText color={theme.colors.primary} style={styles.coverFallbackText} variant="bodySmall">
                  Без обложки
                </AppText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoBlock}>
          <AppText style={styles.title} variant="h1">
            {currentBook.title || 'Книга'}
          </AppText>
          <AppText color={currentBook.author ? theme.colors.textSecondary : theme.colors.textMuted} variant="title">
            {currentBook.author || 'Автор не указан'}
          </AppText>

          <View style={styles.metaRow}>
            {yearLabel ? (
              <View style={styles.metaChip}>
                <AppText color={theme.colors.textSecondary} variant="caption">
                  {yearLabel}
                </AppText>
              </View>
            ) : null}
            {currentBook.category_name ? (
              <View style={styles.metaChip}>
                <AppText color={theme.colors.textSecondary} variant="caption">
                  {currentBook.category_name}
                </AppText>
              </View>
            ) : null}
            {currentBookmarkLabel ? (
              <View style={styles.statusBadge}>
                <AppText color={theme.colors.primary} style={styles.statusText} variant="caption">
                  {currentBookmarkLabel}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {readingProgress?.currentPage ? (
          <View style={styles.progressBox}>
            <Ionicons color={theme.colors.primary} name="bookmarks-outline" size={18} />
            <AppText color={theme.colors.textSecondary} style={styles.progressText} variant="bodySmall">
              Вы остановились на странице {readingProgress.currentPage}
              {readingProgress.totalPages ? ` из ${readingProgress.totalPages}` : ''}
            </AppText>
          </View>
        ) : null}

        <View style={styles.descriptionBlock}>
          <AppText variant="title">Краткое описание</AppText>
          <AppText color={theme.colors.textSecondary} style={styles.descriptionText}>
            {description}
          </AppText>
        </View>

        {savedMessage ? (
          <View style={styles.savedBox}>
            <Ionicons color={theme.colors.success} name="checkmark-circle-outline" size={18} />
            <AppText color={theme.colors.success} style={styles.savedText} variant="bodySmall">
              {savedMessage}
            </AppText>
          </View>
        ) : null}
      </AppScreen>

      <View style={styles.actionBarWrap}>
        <SafeAreaView>
          <View style={styles.actionBar}>
            <AppButton
              onPress={() => setBookmarkModalVisible(true)}
              style={styles.actionButton}
              title="В закладки"
              variant="secondary"
            />
            <AppButton
              onPress={handleRead}
              style={styles.actionButton}
              title={readButtonTitle}
            />
          </View>
        </SafeAreaView>
      </View>

      <BookmarkModal
        onClose={() => setBookmarkModalVisible(false)}
        onSelect={handleSelectBookmark}
        selectedStatus={selectedStatus}
        visible={bookmarkModalVisible}
      />
    </View>
  );
}

function BookmarkModal({
  onClose,
  onSelect,
  selectedStatus,
  visible,
}: {
  onClose: () => void;
  onSelect: (status: BookmarkStatus) => Promise<void>;
  selectedStatus: BookmarkStatus;
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
              <AppText variant="h2">В закладки</AppText>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
                <Ionicons color={theme.colors.textPrimary} name="close" size={18} />
              </Pressable>
            </View>

            <View style={styles.optionList}>
              {BOOKMARK_OPTIONS.map((option) => {
                const active = option.status === selectedStatus;

                return (
                  <Pressable
                    key={option.status}
                    onPress={() => void onSelect(option.status)}
                    style={({ pressed }) => [
                      styles.optionItem,
                      active ? styles.optionItemActive : null,
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
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 168,
      gap: theme.spacing.lg,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
      minHeight: 40,
      paddingRight: theme.spacing.sm,
    },
    backText: {
      fontWeight: '700',
    },
    coverWrap: {
      alignItems: 'center',
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
    },
    coverFrame: {
      width: 220,
      height: 320,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
    },
    coverFallbackText: {
      fontWeight: '700',
      textAlign: 'center',
    },
    infoBlock: {
      gap: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
    },
    title: {
      lineHeight: 34,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    metaChip: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statusBadge: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    statusText: {
      fontWeight: '700',
    },
    progressBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    progressText: {
      flex: 1,
    },
    descriptionBlock: {
      gap: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    descriptionText: {
      lineHeight: 23,
    },
    savedBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.successSoft,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
    savedText: {
      flex: 1,
    },
    actionBarWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.readerSurface,
    },
    actionBar: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
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
    optionList: {
      gap: theme.spacing.xs,
    },
    optionItem: {
      minHeight: 46,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.spacing.md,
      justifyContent: 'center',
    },
    optionItemActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    pressed: {
      opacity: 0.78,
    },
  });
}
