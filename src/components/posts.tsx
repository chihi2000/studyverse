import type { posts } from "@/db/schema";
import {
  categoryLabels,
  categoryMarks,
  dateParts,
  formatPeriod,
  formatShortDate,
  type PostCategory,
} from "@/lib/posts";
import { CalendarIcon, ExternalIcon, FileIcon, VerifiedIcon } from "./icons";

type Post = typeof posts.$inferSelect;

export function CategoryLabel({ category }: { category: PostCategory }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
      <span aria-hidden className={`size-2 shrink-0 ${categoryMarks[category]}`} />
      {categoryLabels[category]}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[0.8rem] font-medium text-success">
      <VerifiedIcon size={15} />
      Vérifié
    </span>
  );
}

/** Who a post is for: the whole country, a university, or a program/year. */
export function audienceLabel(post: Post, programName?: string | null, levelLabel?: string | null) {
  if (!post.instituteId) return post.universityId ? "Toute l'université" : "National";
  if (programName) return [programName, levelLabel].filter(Boolean).join(" · ");
  return null;
}

export function AgendaItem({ post }: { post: Post }) {
  const when = post.startsAt ?? post.publishedAt;
  const { day, month, weekday } = dateParts(when);
  const period = formatPeriod(post.startsAt, post.endsAt);
  return (
    <li className="grid grid-cols-[3.5rem_1fr] items-start gap-4 py-4">
      <time
        dateTime={when.toISOString()}
        className="flex flex-col items-center border-e border-line pe-4 text-center leading-none"
      >
        <span className="display text-[2rem]">{day}</span>
        <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">{month}</span>
      </time>
      <div className="min-w-0 space-y-1">
        <CategoryLabel category={post.category} />
        <p className="font-medium leading-snug">{post.title}</p>
        <p className="text-sm text-muted">{post.endsAt && period ? period : <span className="capitalize">{weekday}</span>}</p>
      </div>
    </li>
  );
}

export function FeedItem({
  post,
  audience,
  eventDate = false,
}: {
  post: Post;
  audience: string | null;
  /** In agenda views, lead with the date of the event instead of the publication date. */
  eventDate?: boolean;
}) {
  const period = formatPeriod(post.startsAt, post.endsAt);
  const file = post.sourceFileKey;
  const source = post.sourceUrl && /^https?:\/\//i.test(post.sourceUrl) ? post.sourceUrl : null;
  const lead = eventDate && post.startsAt ? post.startsAt : post.publishedAt;

  return (
    <article className="grid gap-3 py-6 sm:grid-cols-[6.5rem_1fr] sm:gap-6">
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
        <CategoryLabel category={post.category} />
        <time
          dateTime={lead.toISOString()}
          className={`sm:order-first ${eventDate ? "display text-xl text-ink" : "text-sm text-muted"}`}
        >
          {formatShortDate(lead)}
        </time>
      </div>

      <div className="min-w-0 space-y-2">
        <h3 className="display text-[1.4rem] leading-tight">{post.title}</h3>

        {(audience || post.verified) && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {audience && <span>{audience}</span>}
            {post.verified && <VerifiedBadge />}
          </p>
        )}

        {period && (
          <p className="flex items-center gap-2 text-sm font-medium">
            <CalendarIcon size={16} className="shrink-0 text-brand" />
            {period}
          </p>
        )}

        {post.body && <p className="max-w-prose leading-relaxed text-ink/85">{post.body}</p>}

        {file &&
          (file.endsWith(".pdf") ? (
            <a
              href={`/files/${file}`}
              target="_blank"
              className="flex max-w-sm items-center gap-3 border border-line bg-surface px-3 py-2.5 text-sm transition-colors hover:border-ink"
            >
              <FileIcon className="text-brand" />
              <span className="flex-1">Affiche officielle</span>
              <span className="text-xs font-semibold text-muted">PDF</span>
            </a>
          ) : (
            <a href={`/files/${file}`} target="_blank" className="group block max-w-md">
              <figure className="border border-line bg-surface p-2 transition-colors group-hover:border-ink">
                {/* eslint-disable-next-line @next/next/no-img-element -- user uploads, served as-is */}
                <img
                  src={`/files/${file}`}
                  alt={`Affiche : ${post.title}`}
                  loading="lazy"
                  className="max-h-80 w-full object-contain"
                />
                <figcaption className="pt-2 text-xs text-muted">Affiche officielle · agrandir</figcaption>
              </figure>
            </a>
          ))}

        {source && (
          <p>
            <a href={source} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 text-sm">
              Source officielle
              <ExternalIcon size={14} />
            </a>
          </p>
        )}
      </div>
    </article>
  );
}
