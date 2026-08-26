import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { getBlogPosts } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on demand testing, go/no-go thresholds, and building only what's already proven to hit.",
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <Section border={false} className="pb-24">
      <SectionHeading
        eyebrow="Blog"
        title="Notes from the field"
        description="Short, direct pieces on demand testing — not thought leadership, just what we've seen work and not work."
      />

      <div className="mx-auto mt-14 max-w-2xl divide-y divide-border">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block py-6 first:pt-0">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{post.dek}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatDate(post.publishedAt)} · {post.readingTime}
            </p>
          </Link>
        ))}
      </div>
    </Section>
  );
}
