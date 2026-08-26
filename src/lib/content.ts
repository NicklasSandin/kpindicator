import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const CONTENT_DIR = path.join(process.cwd(), "content");

const caseStudyFrontmatter = z.object({
  title: z.string(),
  slug: z.string(),
  dek: z.string(),
  segment: z.string(),
  packageUsed: z.string(),
  timeframe: z.string(),
  illustrative: z.boolean().default(true),
  publishedAt: z.string(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })),
});
export type CaseStudy = z.infer<typeof caseStudyFrontmatter> & { body: string };

const blogFrontmatter = z.object({
  title: z.string(),
  slug: z.string(),
  dek: z.string(),
  publishedAt: z.string(),
  author: z.string(),
  readingTime: z.string(),
});
export type BlogPost = z.infer<typeof blogFrontmatter> & { body: string };

function readCollection<T>(dir: string, schema: z.ZodType<T>): (T & { body: string })[] {
  const fullDir = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(fullDir)) return [];

  return fs
    .readdirSync(fullDir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(fullDir, file), "utf-8");
      const { data, content } = matter(raw);
      const frontmatter = schema.parse(data);
      return { ...frontmatter, body: content };
    })
    .sort((a, b) => {
      const ad = (a as { publishedAt?: string }).publishedAt ?? "";
      const bd = (b as { publishedAt?: string }).publishedAt ?? "";
      return ad < bd ? 1 : -1;
    });
}

export function getCaseStudies(): CaseStudy[] {
  return readCollection(path.join("case-studies"), caseStudyFrontmatter);
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return getCaseStudies().find((c) => c.slug === slug);
}

export function getBlogPosts(): BlogPost[] {
  return readCollection(path.join("blog"), blogFrontmatter);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find((p) => p.slug === slug);
}
