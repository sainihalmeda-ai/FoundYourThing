import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  ClaimsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: { mode?: "login" | "register" } | undefined;
  Register: undefined;
  Download: undefined;
  Chooser: undefined;
  /** Pass { screen: "FeedTab" } etc. to land on a specific tab. */
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Report: { mode: "lost" | "found"; linkFoundId?: number; linkLostId?: number };
  ItemDetail: { itemId: number };
  About: undefined;
  Safety: undefined;
  ReportConcern: undefined;
  ConcernDetail: { concernId: number };
  EnquiryInbox: undefined;
  EnquiryConcernDetail: { concernId: number };
  Hostel: undefined;
  HostelComplaintNew: undefined;
  HostelComplaintDetail: { complaintId: number };
  HostelInbox: undefined;
};
