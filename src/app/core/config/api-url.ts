export function resolveApiBaseUrl(): string {
  const fallbackUrl = 'http://localhost:1337';
  const metaEnv = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env;
  const globalConfig = globalThis as {
    VITE_API_URL?: string;
    __env?: { VITE_API_URL?: string };
    process?: { env?: { VITE_API_URL?: string } };
  };

  const apiBaseUrl = (
    metaEnv?.VITE_API_URL ??
    globalConfig.VITE_API_URL ??
    globalConfig.__env?.VITE_API_URL ??
    globalConfig.process?.env?.VITE_API_URL
  )?.trim() || fallbackUrl;

  return apiBaseUrl.replace(/\/+$/, '');
}