import sanitizeHtml from "sanitize-html";

/**
 * Strict whitelist for user profile Custom HTML box.
 * - Only very basic tags are allowed.
 * - Very limited attributes (no id/class/style except restricted inline styles below).
 * - Only http/https for links and images; mailto for links.
 * - No scripts, iframes, forms, embeds, objects.
 */

export const PROFILE_HTML_ALLOWED_TAGS = [
  "p",
  "b",
  "i",
  "u",
  "em",
  "strong",
  "a",
  "img",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "marquee",
] as const;

export const PROFILE_HTML_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["style"],
  a: ["href", "style"],
  img: ["src", "alt", "title", "style"],
  marquee: ["behavior", "direction", "scrollamount", "style"],
};

const colorRegexHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgbRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i;
const rgbaRegex = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i;
const pxPercent_0_999 = /^\d{1,3}(px|%)$/;

export const PROFILE_HTML_ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    color: [colorRegexHex, rgbRegex, rgbaRegex],
    "background-color": [colorRegexHex, rgbRegex, rgbaRegex],
    "text-align": [/^(left|right|center|justify)$/],
    "font-style": [/^(normal|italic|oblique)$/],
    "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/],
    "text-decoration": [/^(none|underline|line-through|overline)$/],
  },
  img: {
    "border-radius": [pxPercent_0_999],
  },
};

/**
 * Sanitize user-provided profile HTML with a strict whitelist.
 * This removes dangerous tags/attributes and limits CSS to text-level styling.
 */
export function sanitizeProfileHtml(input: string): string {
  const clean = sanitizeHtml(String(input || ""), {
    allowedTags: PROFILE_HTML_ALLOWED_TAGS as unknown as string[],
    allowedAttributes: PROFILE_HTML_ALLOWED_ATTRIBUTES,
    allowedStyles: PROFILE_HTML_ALLOWED_STYLES,
    allowProtocolRelative: false,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    selfClosing: ["br", "hr", "img"],
    // No iframes, objects, embeds, forms, style/script etc. (sanitize-html removes these by default).
    transformTags: {
      a: (tagName: string, attribs: any) => {
        const href = attribs.href || "";
        const next: any = { ...attribs, rel: "nofollow noopener noreferrer" };
        if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
          delete next.href;
        }
        if (/^javascript:/i.test(href)) {
          delete next.href;
        }
        return { tagName: "a", attribs: next };
      },
      img: (tagName: string, attribs: any) => {
        const src = attribs.src || "";
        const next: any = { ...attribs };
        if (!/^https?:\/\//i.test(src)) {
          delete next.src;
        }
        return { tagName: "img", attribs: next };
      },
    },
    parser: { lowerCaseTags: true },
  });

  return clean;
}

/**
 * Helper to enforce maximum length and sanitize.
 * Use on server before storing and on client before rendering.
 */
export function sanitizeProfileHtmlLimited(input: string, maxLen = 2000): string {
  const trimmed = String(input || "").slice(0, Math.max(0, maxLen));
  return sanitizeProfileHtml(trimmed);
}
