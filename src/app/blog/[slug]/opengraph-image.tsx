import { getPostBySlug } from "@/content/blog";
import { ogCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RollMap BJJ travel guide";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return ogCard({
    kicker: post?.event ? "Tournament guide" : "BJJ travel guide",
    title: post?.title ?? "BJJ travel guides",
    subtitle: post ? post.readTime : undefined,
  });
}
