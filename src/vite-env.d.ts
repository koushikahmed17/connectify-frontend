interface ImportMetaEnv {
  readonly VITE_REACT_BACKEND_URL: string;
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
