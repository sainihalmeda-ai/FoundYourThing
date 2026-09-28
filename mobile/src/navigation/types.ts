export type MainTabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  ClaimsTab: undefined;
};

export type RootStackParamList = {
  Login: { mode?: "login" | "register" } | undefined;
  Register: undefined;
  Download: undefined;
  Chooser: undefined;
  MainTabs: undefined;
  Home: undefined;
  Report: { mode: "lost" | "found"; linkFoundId?: number; linkLostId?: number };
  Feed: undefined;
  ItemDetail: { itemId: number };
  Claims: undefined;
  About: undefined;
  Safety: undefined;
  ReportConcern: undefined;
  ConcernDetail: { concernId: number };
  EnquiryInbox: undefined;
  EnquiryConcernDetail: { concernId: number };
};
