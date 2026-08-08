import React, { useCallback, useEffect, useState } from "react";
import {
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
import { PhotoView } from "./PhotoView";
import { COLORS, FONTS, RADIUS, SHADOW } from "../constants/config";
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
  const { token, user } = useAuth();
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
        (c) =>
          c.status === "accepted" &&
          !dismissedAccepted.includes(c.id) &&
          c.match.lost_item.status !== "closed" &&
          c.match.found_item.status !== "recovered",
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
  // Either side can start the conversation, so work out which report is yours.
  const iOwnLost = lost.reporter_vtu_id === user?.vtu_id;
  const yours = iOwnLost ? lost : found;
  const theirs = iOwnLost ? found : lost;
  const photoUrl = resolveImageUrl(theirs.image_url);
  const secondaryPhoto = resolveImageUrl(yours.image_url);

  const dismiss = async () => {
    if (notice.kind === "incoming") {
      await dismissIncomingClaim(claim.id);
    } else {
      await dismissAcceptedClaim(claim.id);
    }
    setNotice(null);
    setTimeout(refresh, 300);
  };

  const open = async () => {
    const itemId = yours.id;
    const kind = notice.kind;
    await dismiss();
    if (kind === "incoming") {
      navigate("Claims");
    } else {
      navigate("ItemDetail", { itemId });
    }
  };

  const showPhone =
    notice.kind === "accepted" &&
    Boolean(claim.counterparty.phone) &&
    lost.status !== "closed" &&
    found.status !== "recovered";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>
            {notice.kind === "incoming" ? "New request" : "Contact unlocked"}
          </Text>
          <Text style={styles.title}>
            {notice.kind === "incoming" ? "New claim request" : "Claim accepted"}
          </Text>
          <Text style={styles.message}>
            {notice.kind === "incoming"
              ? iOwnLost
                ? `${claim.counterparty.vtu_id} thinks they found your lost item. Compare the photos below.`
                : `${claim.counterparty.vtu_id} thinks your found item matches their lost report. Compare the photos below.`
              : `Your request about “${theirs.title}” was accepted. Meet on campus.`}
          </Text>

          <View style={styles.photos}>
            <View style={styles.photoWrap}>
              <PhotoView uri={photoUrl} style={styles.photo} />
              <Text style={styles.photoLabel}>Their photo</Text>
            </View>
            <View style={styles.photoWrap}>
              <PhotoView uri={secondaryPhoto} style={styles.photo} />
              <Text style={styles.photoLabel}>Your photo</Text>
            </View>
          </View>

          <Text style={styles.meta}>
            {lost.title} ↔ {found.title}
          </Text>
          {showPhone ? (
            <View style={styles.phoneBox}>
              <Text style={styles.phoneLabel}>Phone</Text>
              <Text style={styles.phone}>{claim.counterparty.phone}</Text>
            </View>
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
    backgroundColor: "rgba(15,27,45,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS["3xl"],
    padding: 22,
    ...SHADOW.lift,
  },
  eyebrow: {
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  title: {
    marginTop: 6,
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  photos: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  photoWrap: { flex: 1 },
  photo: {
    width: "100%",
    height: 130,
    borderRadius: RADIUS.xl,
  },
  photoLabel: {
    marginTop: 6,
    fontFamily: FONTS.sansBold,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  meta: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: FONTS.sansSemi,
    color: COLORS.text,
    fontSize: 13,
  },
  phoneBox: {
    marginTop: 12,
    backgroundColor: "rgba(0,156,165,0.1)",
    borderRadius: RADIUS.xl,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,156,165,0.22)",
  },
  phoneLabel: {
    fontFamily: FONTS.sansSemi,
    fontSize: 11,
    color: COLORS.accent,
  },
  phone: {
    marginTop: 2,
    fontFamily: FONTS.sansBold,
    fontSize: 18,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  primary: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS["2xl"],
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: COLORS.primaryForeground,
    fontFamily: FONTS.sansBold,
  },
  secondary: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontFamily: FONTS.sansSemi,
    color: COLORS.textMuted,
  },
});
