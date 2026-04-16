/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DRESS_RECOLOR_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
