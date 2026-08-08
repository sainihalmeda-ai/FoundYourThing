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
import { COLORS, FONTS, WEB_APP_URL } from "../constants/config";

type Props = {
  /** Production site the APK must load (Render static web). */
  url?: string;
};

const ALLOWED_HOSTS = new Set([
  "foundyourthing-web.onrender.com",
  "foundyourthing-api.onrender.com",
  "expo.dev",
  "u.expo.dev",
]);

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Android/iOS shell: load the deployed Expo web app inside a configured WebView.
 * Desktop/mobile browsers keep using the native RN-web tree instead.
 */
export function WebAppShell({ url = WEB_APP_URL }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState(url);

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
    setLastUrl(nav.url);
  }, []);

  const onShouldStart = useCallback((req: { url: string }) => {
    const { url: next } = req;
    if (
      next.startsWith("mailto:") ||
      next.startsWith("tel:") ||
      next.startsWith("sms:")
    ) {
      void Linking.openURL(next);
      return false;
    }
    if (next.startsWith("about:") || next.startsWith("blob:") || next.startsWith("data:")) {
      return true;
    }
    const host = hostOf(next);
    if (!host) return false;
    if (ALLOWED_HOSTS.has(host) || host.endsWith(".onrender.com") || host.endsWith(".expo.dev")) {
      return true;
    }
    // Open unknown https links outside the app (OAuth, docs, etc.).
    if (next.startsWith("https://") || next.startsWith("http://")) {
      void Linking.openURL(next);
      return false;
    }
    return false;
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    if (__DEV__) {
      console.log("[WebView]", event.nativeEvent.data);
    }
  }, []);

  const reload = () => {
    setError(null);
    setLoading(true);
    webRef.current?.reload();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn’t load FYT</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.errorUrl} numberOfLines={2}>
            {lastUrl}
          </Text>
          <Pressable style={styles.retry} onPress={reload}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          <Pressable
            style={styles.openBrowser}
            onPress={() => void Linking.openURL(url)}
          >
            <Text style={styles.openBrowserText}>Open in browser</Text>
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
          cacheEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mixedContentMode="never"
          originWhitelist={["https://*", "http://*", "about:blank", "blob:*"]}
          startInLoadingState
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
              setError(`HTTP ${e.nativeEvent.statusCode} loading campus site.`);
            }
          }}
          onMessage={onMessage}
          // Bridge console.error → React Native for debug builds.
          injectedJavaScriptBeforeContentLoaded={`
            (function(){
              try {
                var wrap = function(level){
                  var orig = console[level];
                  console[level] = function(){
                    try {
                      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                        level + ': ' + Array.prototype.slice.call(arguments).join(' ')
                      );
                    } catch (e) {}
                    if (orig) orig.apply(console, arguments);
                  };
                };
                wrap('log'); wrap('warn'); wrap('error');
              } catch (e) {}
              true;
            })();
          `}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading FYT…</Text>
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
  root: { flex: 1, backgroundColor: COLORS.background },
  webview: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,245,247,0.55)",
  },
  loadingText: {
    fontFamily: FONTS.sansSemi,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  errorBox: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    marginBottom: 10,
  },
  errorBody: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  errorUrl: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 10,
  },
  retryText: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 14 },
  openBrowser: { alignSelf: "flex-start", paddingVertical: 8 },
  openBrowserText: {
    color: COLORS.accent,
    fontFamily: FONTS.sansSemi,
    fontSize: 14,
  },
});
