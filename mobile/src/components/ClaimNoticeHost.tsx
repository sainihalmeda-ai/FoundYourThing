import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchIncomingClaims, fetchMyClaims } from "../api/auth";
import { resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  dismissAcceptedClaim,
  dismissIncomingClaim,
  getDismissedAcceptedClaimIds,
  getDismissedIncomingClaimIds,
} from "../lib/acceptedClaimNotices";
import { navigate } from "../navigation/navigationRef";
import { COLORS } from "../constants/config";
import type { Claim } from "../types";

type Notice =
  | { kind: "incoming"; claim: Claim }
  | { kind: "accepted"; claim: Claim };

/**
 * Global popups after login:
 * - Finder: new contact request (with item photos)
 * - Claimant: finder accepted (with item photos)
 */
export function ClaimNoticeHost() {
  const { token } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setNotice(null);
      return;
    }
    try {
      const [incoming, mine, dismissedIncoming, dismissedAccepted] = await Promise.all([
        fetchIncomingClaims(token),
        fetchMyClaims(token),
        getDismissedIncomingClaimIds(),
        getDismissedAcceptedClaimIds(),
      ]);

      const incomingHit = incoming.find((c) => !dismissedIncoming.includes(c.id));
      if (incomingHit) {
        setNotice({ kind: "incoming", claim: incomingHit });
        return;
      }

      const acceptedHit = mine.find(
        (c) => c.status === "accepted" && !dismissedAccepted.includes(c.id),
      );
      if (acceptedHit) {
        setNotice({ kind: "accepted", claim: acceptedHit });
        return;
      }

      setNotice(null);
    } catch {
      // Keep app usable if notices fail.
    }
  }, [token]);

  useEffect(() => {
    refresh();
    if (!token) return;
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [token, refresh]);

  if (!notice) return null;

  const claim = notice.claim;
  const lost = claim.match.lost_item;
  const found = claim.match.found_item;
  const photoUrl = resolveImageUrl(
    notice.kind === "incoming" ? lost.image_url : found.image_url,
  );
  const secondaryPhoto = resolveImageUrl(
    notice.kind === "incoming" ? found.image_url : lost.image_url,
  );

  const dismiss = async () => {
    if (notice.kind === "incoming") {
      await dismissIncomingClaim(claim.id);
    } else {
      await dismissAcceptedClaim(claim.id);
    }
    setNotice(null);
    // Pick up the next notice if any.
    setTimeout(refresh, 300);
  };

  const open = async () => {
    const itemId = notice.kind === "incoming" ? found.id : lost.id;
    const kind = notice.kind;
    await dismiss();
    if (kind === "incoming") {
      navigate("Claims");
    } else {
      navigate("ItemDetail", { itemId });
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {notice.kind === "incoming" ? "New claim request" : "Claim accepted"}
          </Text>
          <Text style={styles.message}>
            {notice.kind === "incoming"
              ? `${claim.counterparty.vtu_id} thinks your found item matches their lost report. Compare the photos below.`
              : `The finder accepted your request for “${lost.title}”. Contact is unlocked.`}
          </Text>

          <View style={styles.photos}>
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUrl }} style={styles.photo} />
              <Text style={styles.photoLabel}>
                {notice.kind === "incoming" ? "Their lost item" : "Finder's item"}
              </Text>
            </View>
            <View style={styles.photoWrap}>
              <Image source={{ uri: secondaryPhoto }} style={styles.photo} />
              <Text style={styles.photoLabel}>
                {notice.kind === "incoming" ? "Your found item" : "Your lost item"}
              </Text>
            </View>
          </View>

          <Text style={styles.meta}>
            {lost.title} ↔ {found.title}
          </Text>
          {notice.kind === "accepted" &&
          claim.counterparty.phone &&
          claim.match.lost_item.status !== "closed" &&
          claim.match.found_item.status !== "recovered" ? (
            <Text style={styles.phone}>Phone: {claim.counterparty.phone}</Text>
          ) : null}

          <Pressable style={styles.primary} onPress={open}>
            <Text style={styles.primaryText}>
              {notice.kind === "incoming" ? "Review request" : "View item"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={dismiss}>
            <Text style={styles.secondaryText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 42, 67, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    textAlign: "center",
  },
  photos: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  photoWrap: {
    flex: 1,
  },
  photo: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    backgroundColor: "#EEF2F7",
  },
  photoLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  meta: {
    marginTop: 12,
    textAlign: "center",
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 13,
  },
  phone: {
    marginTop: 8,
    textAlign: "center",
    color: COLORS.success,
    fontWeight: "800",
    fontSize: 15,
  },
  primary: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
  },
});
