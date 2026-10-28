import "server-only";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { institutes, posts, pushSubscriptions } from "@/db/schema";
import { categoryLabels } from "@/lib/posts";

// Subscriptions are created by anonymous visitors, so only accept endpoints of real push services;
// otherwise the server could be made to send requests to arbitrary URLs.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /\.push\.apple\.com$/,
  /\.notify\.windows\.com$/,
];

export function isAllowedEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

let configured = false;
function configure() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
  if (!configured) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

const BATCH_SIZE = 50;

/** Notifies everyone following the post's institute (and, if set, its program/year). */
export async function notifyPost(postId: string) {
  if (!configure()) {
    console.warn("[push] VAPID keys missing; notifications disabled.");
    return { sent: 0, removed: 0 };
  }

  const [post] = await db
    .select({ post: posts, slug: institutes.slug, shortName: institutes.shortName })
    .from(posts)
    .innerJoin(institutes, eq(posts.instituteId, institutes.id))
    .where(eq(posts.id, postId));
  if (!post) return { sent: 0, removed: 0 };
  const p = post.post;

  // Same rule as the feed: broad posts reach everyone, targeted posts only their program/year.
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.instituteId, post.post.instituteId!),
        p.programId
          ? or(isNull(pushSubscriptions.programId), eq(pushSubscriptions.programId, p.programId))
          : undefined,
        p.levelId ? or(isNull(pushSubscriptions.levelId), eq(pushSubscriptions.levelId, p.levelId)) : undefined,
      ),
    );

  const payload = JSON.stringify({
    title: `${post.shortName} · ${categoryLabels[p.category]}`,
    body: p.title,
    url: `/${post.slug}`,
    tag: p.id,
  });

  const delivered: string[] = [];
  const gone: string[] = [];
  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: "high",
        }),
      ),
    );
    results.forEach((r, j) => {
      if (r.status === "fulfilled") delivered.push(batch[j].id);
      else if ([404, 410].includes((r.reason as { statusCode?: number }).statusCode ?? 0)) gone.push(batch[j].id);
      else console.error("[push] send failed", (r.reason as Error).message);
    });
  }

  // Expired subscriptions (the user unsubscribed or reinstalled) are removed.
  if (gone.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  if (delivered.length) {
    await db
      .update(pushSubscriptions)
      .set({ lastSuccessAt: sql`now()` })
      .where(inArray(pushSubscriptions.id, delivered));
  }
  return { sent: delivered.length, removed: gone.length };
}
