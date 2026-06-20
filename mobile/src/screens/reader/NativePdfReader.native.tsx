import { forwardRef, useImperativeHandle, useRef, type ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Pdf from 'react-native-pdf';

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

export const NativePdfReader = forwardRef<NativePdfReaderHandle, NativePdfReaderProps>(function NativePdfReader(
  {
    initialPage,
    onError,
    onLoadComplete,
    onLoadProgress,
    onPageChanged,
    onPageSingleTap,
    readingMode,
    renderActivityIndicator,
    source,
    style,
  },
  ref
) {
  const pdfRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      setPage(page: number) {
        pdfRef.current?.setPage?.(page);
      },
    }),
    []
  );

  return (
    <Pdf
      ref={pdfRef}
      source={source}
      page={initialPage}
      horizontal={false}
      enablePaging={readingMode === 'tap'}
      enableDoubleTapZoom
      fitPolicy={readingMode === 'tap' ? 2 : 0}
      minScale={1}
      maxScale={4}
      spacing={readingMode === 'tap' ? 0 : 8}
      trustAllCerts={false}
      scrollEnabled
      showsVerticalScrollIndicator={readingMode === 'scroll'}
      onLoadComplete={onLoadComplete}
      onLoadProgress={onLoadProgress}
      onPageChanged={onPageChanged}
      onError={onError}
      onPageSingleTap={onPageSingleTap}
      renderActivityIndicator={renderActivityIndicator}
      style={style}
    />
  );
});
