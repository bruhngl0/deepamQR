import type { D1Database as MiniflareD1Database } from "@miniflare/d1";

declare module "cloudflare:workers" {
  export const env: { DB?: D1Database; [key: string]: unknown };
}

declare global {
  type Fetcher = {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };

  type D1Database = MiniflareD1Database;
}

export {};
