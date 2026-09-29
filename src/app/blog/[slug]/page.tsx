import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getAllPosts } from "@/content/blog";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | RollMap`,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

// Minimal markdown-like renderer (headings, links, bold, lists, paragraphs)
function renderContent(md: string): React.ReactNode {
  const lines = md.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedList = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item, i) => (
      <li key={i} className="text-text2 mb-2" dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
    ));
    blocks.push(
      orderedList ? (
        <ol key={blocks.length} className="list-decimal pl-6 mb-5">{items}</ol>
      ) : (
        <ul key={blocks.length} className="list-disc pl-6 mb-5">{items}</ul>
      )
    );
    listBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={blocks.length} className="text-xl md:text-2xl font-extrabold mt-8 mb-3 text-text">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={blocks.length} className="text-lg font-bold mt-6 mb-2 text-text">
          {line.slice(4)}
        </h3>
      );
    } else if (/^\d+\.\s/.test(line)) {
      if (!orderedList && listBuffer.length > 0) flushList();
      orderedList = true;
      listBuffer.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("- ")) {
      if (orderedList && listBuffer.length > 0) flushList();
      orderedList = false;
      listBuffer.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={blocks.length} className="text-text2 mb-4 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
  }
  flushList();
  return blocks;
}

function renderInline(text: string): string {
  // Escape HTML first
  let out = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text">$1</strong>');
  // Links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => {
    const external = /^https?:\/\//.test(url);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${url}" class="text-accent hover:underline"${rel}>${txt}</a>`;
  });
  return out;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    url: `https://rollmap.co/blog/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "RollMap",
      url: "https://rollmap.co",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rollmap.co" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://rollmap.co/blog" },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <header className="flex items-center gap-4 px-5 py-4 bg-bg2 border-b border-bg3">
        <Link href="/blog" className="text-text2 text-xl cursor-pointer hover:bg-bg3 px-2 py-1 rounded transition-colors">
          &larr;
        </Link>
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Roll<span className="text-accent">Map</span>
        </Link>
      </header>

      <main className="flex-1 px-5 py-8 md:px-8 max-w-3xl mx-auto w-full">
        <nav className="text-xs text-text3 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/blog" className="hover:text-accent transition-colors">Blog</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text2">{post.title}</span>
        </nav>

        <article>
          <header className="mb-8 pb-6 border-b border-bg3">
            <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight">{post.title}</h1>
            <p className="text-text2 text-base mb-3">{post.description}</p>
            <div className="text-text3 text-xs">
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              <span className="mx-2">·</span>
              {post.readTime}
              <span className="mx-2">·</span>
              By {post.author}
            </div>
          </header>

          <div className="prose-content">{renderContent(post.content)}</div>

          {/* Related city/country links */}
          {(post.cityLinks?.length || post.countryLinks?.length) && (
            <div className="mt-10 pt-6 border-t border-bg3">
              <h3 className="text-xs font-bold text-text3 uppercase tracking-widest mb-3">
                Find gyms
              </h3>
              <div className="flex gap-2 flex-wrap">
                {post.countryLinks?.map((slug) => (
                  <Link
                    key={slug}
                    href={`/country/${slug}`}
                    className="bg-bg2 border border-bg3 px-3 py-1.5 rounded-full text-xs font-semibold text-text2 hover:text-accent hover:border-accent transition-colors"
                  >
                    {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Link>
                ))}
                {post.cityLinks?.map((slug) => (
                  <Link
                    key={slug}
                    href={`/city/${slug}`}
                    className="bg-bg2 border border-bg3 px-3 py-1.5 rounded-full text-xs font-semibold text-text2 hover:text-accent hover:border-accent transition-colors"
                  >
                    {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
