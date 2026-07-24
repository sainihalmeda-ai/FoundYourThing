export type MainTabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  ClaimsTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Home: undefined;
  Report: { mode: "lost" | "found"; linkFoundId?: number };
  Feed: undefined;
  ItemDetail: { itemId: number };
  Claims: undefined;
};
