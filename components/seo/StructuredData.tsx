/**
 * Inline JSON-LD <script> for schema.org structured data.
 *
 * Accepts either a single schema object or an array of schema objects
 * (multiple objects are wrapped in a JSON array, which is valid JSON-LD).
 *
 * Per Next.js 16 + App Router guidance, JSON-LD must be a single string,
 * so `dangerouslySetInnerHTML` is the correct (and recommended) approach.
 */
export function StructuredData({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
