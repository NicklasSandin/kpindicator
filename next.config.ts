import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the tracing root to this project — a sibling directory outside this
  // repo has its own pnpm-lock.yaml, which Next would otherwise infer as
  // the workspace root and mis-scope build tracing.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
