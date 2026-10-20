import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL, contactMailto } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact RollMap: add your BJJ gym, update or remove a listing, or share feedback.",
  alternates: { canonical: "/contact" },
};

const SECTIONS = [
  {
    title: "Add your gym",
    text: "Your academy is missing? Send us its name, address, website or Instagram, and whether you welcome drop-in visitors.",
    subject: "Add my gym to RollMap",
    cta: "Add a gym",
  },
  {
    title: "Update or remove a listing",
    text: "Gym owners can ask us to correct their page (drop-in price, open mat, schedule, contact) or to remove it. Please include the link to your RollMap page.",
    subject: "Update / remove a listing",
    cta: "Update a listing",
  },
  {
    title: "Anything else",
    text: "Questions, partnerships or feedback about RollMap: we read every message.",
    subject: "Hello RollMap",
    cta: "Write to us",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
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

      <main className="flex-1 px-5 py-8 md:px-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Contact</h1>
        <p className="text-text2 text-sm mb-8">
          Reach us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
          . We usually reply within a few days. Oss.
        </p>

        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="bg-bg2 rounded-xl border border-bg3 p-5">
              <h2 className="font-bold mb-1">{s.title}</h2>
              <p className="text-text2 text-sm mb-3">{s.text}</p>
              <a
                href={contactMailto(s.subject)}
                className="inline-block text-accent text-sm font-semibold hover:underline"
              >
                {s.cta} &rarr;
              </a>
            </section>
          ))}
        </div>

        <p className="text-text3 text-xs mt-8">
          Gym information on RollMap comes from public sources (federation directories,
          gym websites) and from the gyms themselves. You can ask for any listing to be
          corrected or removed at {CONTACT_EMAIL}.
        </p>
      </main>
    </div>
  );
}
