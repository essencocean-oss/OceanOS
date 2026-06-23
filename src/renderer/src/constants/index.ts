export type PresetOption = {
  id: string;
  group: string;
  label: string;
  value: string;
  baseUrl?: string;
};

export type ProviderOption = {
  id: string;
  value: string;
  label: string;
  group?: string;
  apiBase?: string;
  envKey?: string;
};

export const LOCAL_PRESETS: PresetOption[] = [];

export const PROVIDERS = {
  options: [] as ProviderOption[],
};
