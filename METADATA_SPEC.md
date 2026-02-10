# Open Graph & Metadata Standards for Orion
# Priorities: WhatsApp Preview Rendering & Facebook Scraper Compliance

- IMAGE_SIZE_LIMIT: 300KB (Hard limit for WhatsApp/Mobile scrapers).
- IMAGE_DIMENSIONS: 1200x630px (Standard for high-density previews).
- IMAGE_FORMAT: Prefer .jpg or .webp for compression; .png only if under 300KB.
- PATHS: Always use Absolute URLs for `og:image` and `og:url`.
- NEXTJS_VERSION: 15.x.
- METADATA_IMPLEMENTATION: Use the Next.js Metadata API in layout.tsx.
- CRAWLER_BEHAVIOR: WhatsApp does not execute JS; all meta tags must be in the static HTML stream.