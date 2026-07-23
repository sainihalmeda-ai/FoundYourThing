export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Report: { mode: "lost" | "found" };
  Feed: undefined;
  ItemDetail: { itemId: number };
  Claims: undefined;
};
