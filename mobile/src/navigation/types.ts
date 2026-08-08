export type MainTabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  ClaimsTab: undefined;
};

export type RootStackParamList = {
  Login: { mode?: "login" | "register" } | undefined;
  Register: undefined;
  MainTabs: undefined;
  Home: undefined;
  Report: { mode: "lost" | "found"; linkFoundId?: number; linkLostId?: number };
  Feed: undefined;
  ItemDetail: { itemId: number };
  Claims: undefined;
};
