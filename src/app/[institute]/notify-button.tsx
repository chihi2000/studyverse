"use client";

import { useEffect, useState } from "react";
import { followedInstitute, subscribe, unsubscribe } from "../push-actions";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "other";

type Props = {
  vapidKey: string;
  instituteSlug: string;
  shortName: string;
  programSlug?: string;
  year?: number;
  // e.g. "Licence en Design Espace · L1" when the page is filtered.
  filterLabel?: string;
};

function base64UrlToBytes(value: string) {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
}

export function NotifyButton({ vapidKey, instituteSlug, shortName, programSlug, year, filterLabel }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // iOS only exposes push to sites added to the home screen.
        setStatus(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return setStatus("off");
      const followed = await followedInstitute(sub.endpoint);
      setStatus(followed === instituteSlug ? "on" : followed ? "other" : "off");
    })().catch(() => setStatus("unsupported"));
  }, [instituteSlug]);

  async function enable() {
    setError(null);
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setStatus(permission === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(vapidKey) }));
      const json = sub.toJSON();
      const res = await subscribe({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
        instituteSlug,
        programSlug,
        year,
      });
      if ("error" in res) throw new Error(res.error);
      setStatus("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'activer les notifications.");
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("loading");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await unsubscribe(sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("off");
  }

  const target = filterLabel ? `${shortName} · ${filterLabel}` : shortName;
  const box = "rounded-xl border border-black/10 p-3 text-sm dark:border-white/10";

  switch (status) {
    case "loading":
      return <div className={`${box} h-[46px] animate-pulse`} aria-hidden />;
    case "unsupported":
      return null;
    case "ios-install":
      return (
        <p className={box}>
          🔔 Pour recevoir les notifications sur iPhone : touche <strong>Partager</strong> puis{" "}
          <strong>Sur l&apos;écran d&apos;accueil</strong>, et ouvre Studyverse depuis l&apos;icône.
        </p>
      );
    case "denied":
      return (
        <p className={`${box} text-black/60 dark:text-white/60`}>
          Les notifications sont bloquées pour ce site. Autorise-les dans les réglages du navigateur.
        </p>
      );
    case "on":
      return (
        <div className={`${box} flex items-center gap-3`}>
          <span className="flex-1">🔔 Notifications activées pour {shortName}</span>
          <button onClick={disable} className="underline underline-offset-2">
            Désactiver
          </button>
        </div>
      );
    default:
      return (
        <div className="space-y-1">
          <button
            onClick={enable}
            className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background"
          >
            🔔 {status === "other" ? `Suivre ${target} à la place` : `Recevoir les actualités de ${target}`}
          </button>
          {error && <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>}
        </div>
      );
  }
}
