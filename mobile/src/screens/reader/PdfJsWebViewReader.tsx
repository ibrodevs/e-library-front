import { View } from 'react-native';

type PdfJsWebViewReaderProps = {
  bookId: string;
  initialPage: number;
  onError: (message: string) => void;
  onLoaded: (totalPages: number) => void;
  onOpenStandardReader: () => void;
  onPageChange: (page: number) => void;
  onReaderPress: () => void;
  onReaderScroll: () => void;
  onRetry: () => void;
  pdfUrl: string;
  readingMode: 'scroll' | 'tap';
  retryKey: number;
  targetPage: number;
};

export function PdfJsWebViewReader(_props: PdfJsWebViewReaderProps) {
  return <View />;
}
