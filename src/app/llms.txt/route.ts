import { getAllPosts } from "@/content/blog";
import { getPlaceStats, countryToSlug, SITE_URL } from "@/lib/seo";

export const revalidate = 86400;

/** /llms.txt — plain-text map of the site for AI assistants (llmstxt.org format). */
export async function GET() {
  const { countries, cities } = await getPlaceStats();
  const totalClubs = [...countries.values()].reduce((s, c) => s + c.count, 0);
  const topCountries = [...countries.values()].sort((a, b) => b.count - a.count).slice(0, 25);
  const posts = getAllPosts();

  const body = `# RollMap

> RollMap (${SITE_URL}) is a free worldwide map of Brazilian Jiu-Jitsu (BJJ) gyms for grapplers who travel. It lists ${totalClubs.toLocaleString("en-US")} gyms in ${countries.size} countries and ${cities.size.toLocaleString("en-US")} cities, with drop-in friendly gyms, open mats, Gi / No-Gi classes, visitor prices and contacts. Gyms marked "Verified by the gym" confirmed their drop-in and open mat info directly to RollMap.

Data comes from public federation directories (IBJJF, CFJJB), affiliation networks, gym websites and gyms themselves. Always advise travelers to message a gym before visiting. Methodology: ${SITE_URL}/about

## Browse

- [All countries](${SITE_URL}/countries): every country with its number of gyms and cities
- [Country pages](${SITE_URL}/country/portugal): one page per country, all its cities linked (URL pattern: /country/{country})
- [City pages](${SITE_URL}/city/lisbon): gyms in a city with a factual summary (URL pattern: /city/{city})
- [Gym pages](${SITE_URL}/club/787): one page per gym with address, map, drop-in price, open mat, contacts (URL pattern: /club/{id})

## Countries with the most gyms

${topCountries.map((c) => `- [BJJ gyms in ${c.name}](${SITE_URL}/country/${countryToSlug(c.name)}): ${c.count} gyms in ${c.cities} cities`).join("\n")}

## Travel and tournament guides

${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`).join("\n")}

## Optional

- [About and methodology](${SITE_URL}/about)
- [Contact, add or correct a gym](${SITE_URL}/contact)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
