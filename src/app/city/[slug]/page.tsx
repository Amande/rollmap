import type { Metadata } from "next";
import CityView, { cityMetadata } from "./CityView";

// Rebuilt at most every 6 hours (ISR)
export const revalidate = 21600;

// Pages are generated on first visit, then cached and refreshed (ISR)
export function generateStaticParams() {
  return [];
}

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  return cityMetadata(slug, 1);
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  return <CityView slug={slug} page={1} />;
}
