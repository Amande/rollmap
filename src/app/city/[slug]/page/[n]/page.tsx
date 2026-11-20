import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CityView, { cityMetadata } from "../../CityView";

// Pages 2+ of a city listing (page 1 is /city/[slug]). ISR, like page 1.
export const revalidate = 21600;

export function generateStaticParams() {
  return [];
}

interface CityPagedProps {
  params: Promise<{ slug: string; n: string }>;
}

// "2", "3"… only; "1" redirects to the city page, anything else is a 404
function parsePage(raw: string): number | null {
  return /^[1-9]\d{0,3}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: CityPagedProps): Promise<Metadata> {
  const { slug, n } = await params;
  const page = parsePage(n);
  if (!page || page === 1) return {};
  return cityMetadata(slug, page);
}

export default async function CityPagedPage({ params }: CityPagedProps) {
  const { slug, n } = await params;
  const page = parsePage(n);
  if (!page) notFound();
  if (page === 1) permanentRedirect(`/city/${slug}`);
  return <CityView slug={slug} page={page} />;
}
