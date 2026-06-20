import { forwardRef, useImperativeHandle, type ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type ReadingMode = 'scroll' | 'tap';

type NativePdfSource = {
  uri: string;
  cache: false;
  headers: {
    Authorization: string;
    Accept: string;
  };
};

export type NativePdfReaderHandle = {
  setPage: (page: number) => void;
};

type NativePdfReaderProps = {
  initialPage: number;
  onError: (error: unknown) => void;
  onLoadComplete: (numberOfPages: number) => void;
  onLoadProgress?: (percent: number) => void;
  onPageChanged: (page: number, numberOfPages: number) => void;
  onPageSingleTap?: () => void;
  readingMode: ReadingMode;
  renderActivityIndicator: (progress: number) => ReactElement;
  source: NativePdfSource;
  style?: StyleProp<ViewStyle>;
};

export const NativePdfReader = forwardRef<NativePdfReaderHandle, NativePdfReaderProps>(function NativePdfReader(_props, ref) {
  useImperativeHandle(
    ref,
    () => ({
      setPage() {
        // Web uses the PDF.js branch; this stub only keeps the native import web-safe.
      },
    }),
    []
  );

  return null;
});
