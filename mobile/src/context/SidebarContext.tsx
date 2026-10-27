import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "fyt_sidebar_collapsed";

type SidebarPref = {
  /** null = automatic (icon rail only in narrow windows); otherwise the user's choice. */
  collapsedPref: boolean | null;
  setCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarPref>({
  collapsedPref: null,
  setCollapsed: () => {},
});

/**
 * Remembers whether the user hid (collapsed) or showed the desktop sidebar.
 * Every page draws its own sidebar, so the choice lives here, above them all.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsedPref, setPref] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw === "1" || raw === "0") setPref(raw === "1");
      })
      .catch(() => {});
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setPref(collapsed);
    AsyncStorage.setItem(KEY, collapsed ? "1" : "0").catch(() => {
      // Non-fatal — the choice just won't survive a reload.
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsedPref, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarPref() {
  return useContext(SidebarContext);
}
