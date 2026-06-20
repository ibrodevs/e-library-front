import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Book } from '../../types/book';
import type { BookmarkStatus } from '../../types/bookmark';
import { AppText } from '../common/AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  bookmarkStatus?: BookmarkStatus | null;
}

const STATUS_LABELS: Record<BookmarkStatus, string> = {
  liked: '\u041f\u043e\u043d\u0440\u0430\u0432\u0438\u0432\u0448\u0438\u0435\u0441\u044f',
  reading: '\u0427\u0438\u0442\u0430\u044e',
  planned: '\u041f\u0440\u043e\u0447\u0438\u0442\u0430\u044e \u043f\u043e\u0437\u0436\u0435',
  completed: '\u041f\u0440\u043e\u0447\u0438\u0442\u0430\u043d\u043e',
  dropped: '\u0411\u0440\u043e\u0448\u0435\u043d\u043e',
};

export function BookCard({ book, onPress, bookmarkStatus = null }: BookCardProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const categoryName = book.category_name?.trim();
  const author = book.author?.trim();
  const title = book.title?.trim() || '\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f';
  const coverUri = book.cover_image_url || book.cover_image || null;
  const badgeLabel = bookmarkStatus ? STATUS_LABELS[bookmarkStatus] : null;
  const yearLabel = typeof book.year !== 'undefined' && book.year !== null && book.year !== '' ? String(book.year) : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {badgeLabel ? (
        <View style={styles.badge}>
          <AppText color={theme.colors.primary} numberOfLines={1} style={styles.badgeText} variant="caption">
            {badgeLabel}
          </AppText>
        </View>
      ) : null}

      <View style={styles.cover}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <Ionicons color={theme.colors.primary} name="book-outline" size={24} />
            <AppText color={theme.colors.primary} style={styles.coverFallbackText} variant="caption">
              {'\u041a\u043d\u0438\u0433\u0430'}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={[styles.mainInfo, badgeLabel ? styles.mainInfoWithBadge : null]}>
          <AppText numberOfLines={2} style={styles.title}>
            {title}
          </AppText>
          {author ? (
            <AppText color={theme.colors.textSecondary} numberOfLines={2} variant="bodySmall">
              {author}
            </AppText>
          ) : (
            <AppText color={theme.colors.textMuted} numberOfLines={1} variant="bodySmall">
              {'\u0410\u0432\u0442\u043e\u0440 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d'}
            </AppText>
          )}
        </View>

        <View style={styles.metaLine}>
          {yearLabel ? (
            <View style={styles.metaChip}>
              <AppText color={theme.colors.textMuted} numberOfLines={1} variant="caption">
                {yearLabel}
              </AppText>
            </View>
          ) : null}
          {categoryName ? (
            <View style={[styles.metaChip, styles.category]}>
              <AppText color={theme.colors.textMuted} numberOfLines={1} variant="caption">
                {categoryName}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      height: 132,
      position: 'relative',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pressed: {
      opacity: 0.78,
    },
    cover: {
      width: 72,
      height: 108,
      borderRadius: theme.radius.md,
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
      padding: theme.spacing.xs,
    },
    coverFallbackText: {
      fontWeight: '700',
      textAlign: 'center',
    },
    body: {
      flex: 1,
      justifyContent: 'space-between',
      minWidth: 0,
    },
    mainInfo: {
      gap: theme.spacing.xxs,
    },
    mainInfoWithBadge: {
      paddingRight: 96,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    metaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      minHeight: 16,
    },
    category: {
      flex: 1,
    },
    metaChip: {
      minHeight: 22,
      borderRadius: 11,
      paddingHorizontal: theme.spacing.xs,
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    badge: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      zIndex: 2,
      height: 24,
      maxWidth: 96,
      borderRadius: 12,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    badgeText: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
    },
  });
}
