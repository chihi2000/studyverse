import { readUpload } from "@/lib/uploads";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const file = await readUpload(key);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.body, {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      // Keys are random and files are never rewritten.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
