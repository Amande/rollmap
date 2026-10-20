export const CONTACT_EMAIL = "contact@rollmap.co";

/** mailto: link with a pre-filled subject */
export function contactMailto(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
