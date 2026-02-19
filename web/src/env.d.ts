/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_VAPID_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
