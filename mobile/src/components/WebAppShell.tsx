import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";
import Constants from "expo-constants";
import { COLORS, WEB_APP_URL } from "../constants/config";

type Props = {
  url?: string;
};

/**
 * Load the live Render website. Keep navigation filtering minimal on Android —
 * aggressive onShouldStartLoadWithRequest handlers commonly cause a blank WebView.
 */
export function WebAppShell({ url = WEB_APP_URL }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState(url);
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "?";

  // Hard timeout so a hung load never looks like an endless blank screen.
  useEffect(() => {
    if (!loading || error) return;
    const id = setTimeout(() => {
      setLoading(false);
      setError(
        "The campus site is taking too long. Check mobile data/Wi‑Fi, then Retry. " +
          "If this keeps happening, open FYT in Chrome instead.",
      );
    }, 45000);
    return () => clearTimeout(id);
  }, [loading, error]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    if (nav.url) setLastUrl(nav.url);
  }, []);

  const onShouldStart = useCallback((req: { url: string }) => {
    const next = req.url;
    if (
      next.startsWith("mailto:") ||
      next.startsWith("tel:") ||
      next.startsWith("sms:")
    ) {
      void Linking.openURL(next);
      return false;
    }
    // Allow every normal navigation inside the WebView (required for SPA + assets).
    return true;
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    if (__DEV__) console.log("[WebView]", event.nativeEvent.data);
  }, []);

  const reload = () => {
    setError(null);
    setLoading(true);
    webRef.current?.reload();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>FYT {version} · WebView</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn’t open FYT</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.errorUrl} numberOfLines={3}>
            {lastUrl}
          </Text>
          <Pressable style={styles.retry} onPress={reload}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          <Pressable style={styles.openBrowser} onPress={() => void Linking.openURL(url)}>
            <Text style={styles.openBrowserText}>Open in Chrome</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: url }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          cacheEnabled={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mixedContentMode="compatibility"
          originWhitelist={["*"]}
          startInLoadingState
          androidLayerType="hardware"
          applicationNameForUserAgent="FYT-Android-WebView"
          onNavigationStateChange={onNavChange}
          onShouldStartLoadWithRequest={onShouldStart}
          onLoadStart={() => {
            setLoading(true);
            setError(null);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            setLoading(false);
            setError(e.nativeEvent.description || "WebView failed to load the page.");
          }}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) {
              setLoading(false);
              setError(`HTTP ${e.nativeEvent.statusCode} while loading the campus site.`);
            }
          }}
          onMessage={onMessage}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading campus site…</Text>
              <Text style={styles.loadingHint}>{url}</Text>
            </View>
          )}
        />
      )}

      {loading && !error ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#102A56",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  webview: { flex: 1, backgroundColor: "#FFFFFF" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 10,
    padding: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  loadingText: { color: "#111827", fontSize: 15, fontWeight: "600" },
  loadingHint: { color: "#667085", fontSize: 11, textAlign: "center" },
  errorBox: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667085",
    marginBottom: 8,
  },
  errorUrl: {
    fontSize: 12,
    color: "#667085",
    marginBottom: 20,
  },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: "#102A56",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 10,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  openBrowser: { alignSelf: "flex-start", paddingVertical: 8 },
  openBrowserText: { color: "#009CA5", fontWeight: "600", fontSize: 14 },
});
