export function resolveApiBaseUrl(): string {
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
  )?.trim();

  if (!apiBaseUrl) {
    throw new Error('VITE_API_URL is required');
  }

  return apiBaseUrl.replace(/\/+$/, '');
}