import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { MDXContent } from "@/components/mdx-content";
import { getBlogPosts, getBlogPost } from "@/lib/content";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.dek };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <Section border={false} className="pb-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All posts
        </Link>

        <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.dek}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {formatDate(post.publishedAt)} · {post.readingTime} · {post.author}
        </p>

        <div className="mt-10">
          <MDXContent source={post.body} />
        </div>
      </div>
    </Section>
  );
}
