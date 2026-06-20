export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Catalog: undefined;
  Bookmarks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AuthStack: undefined;
  BookDetails: { bookId?: number; book?: import('./book').Book } | undefined;
  BookReader:
    | {
        bookId?: number | string;
        title?: string;
        pdfUrl?: string | null;
        cover_image_url?: string | null;
        initialPage?: number | null;
        totalPages?: number | null;
      }
    | undefined;
};
