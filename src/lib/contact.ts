export const CONTACT_EMAIL = "contact@rollmap.co";
export const INSTAGRAM_URL = "https://www.instagram.com/rollmap.contact/";
export const INSTAGRAM_HANDLE = "@rollmap.contact";

/** mailto: link with a pre-filled subject */
export function contactMailto(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
