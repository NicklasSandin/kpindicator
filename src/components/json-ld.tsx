/**
 * Renders schema.org JSON-LD. `<` is escaped so a stray sequence in content
 * can never break out of the script tag.
 */
export function JsonLd({
  schema,
}: {
  schema: Record<string, unknown> | Record<string, unknown>[];
}) {
  const nodes = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(node).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
