/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@deck.gl/react';
declare module '@deck.gl/layers';
declare module '@deck.gl/extensions';
declare module '@deck.gl/core';
