import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Blog — Training tips and BJJ travel guides",
  description:
    "Practical guides for BJJ travelers: drop-in etiquette, best destinations, gym recommendations by city and country.",
  openGraph: {
    title: "RollMap Blog — BJJ travel guides",
    description: "Practical guides for BJJ travelers.",
    type: "website",
  },
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "RollMap Blog",
    url: "https://rollmap.co/blog",
    description: "BJJ travel guides and training tips.",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://rollmap.co/blog/${p.slug}`,
      datePublished: p.date,
      author: { "@type": "Person", name: p.author },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="flex items-center gap-4 px-5 py-4 bg-bg2 border-b border-bg3">
        <Link
          href="/"
          className="text-text2 text-xl cursor-pointer hover:bg-bg3 px-2 py-1 rounded transition-colors"
        >
          &larr;
        </Link>
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Roll<span className="text-accent">Map</span>
        </Link>
      </header>

      <div className="px-5 py-8 md:px-8 bg-bg2 border-b border-bg3">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
          <span className="text-accent">RollMap</span> Blog
        </h1>
        <p className="text-text2 text-sm">
          Training tips, BJJ travel guides, and gym recommendations.
        </p>
      </div>

      <main className="flex-1 px-5 py-6 md:px-8 max-w-3xl mx-auto w-full">
        <ul className="flex flex-col gap-5">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-bg2 border border-bg3 rounded-xl p-5 hover:border-accent transition-colors group"
              >
                <div className="text-xs text-text3 mb-2">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  <span className="mx-2">·</span>
                  {post.readTime}
                </div>
                <h2 className="text-lg md:text-xl font-extrabold mb-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="text-text2 text-sm">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
