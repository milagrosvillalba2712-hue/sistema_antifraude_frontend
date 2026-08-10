export const INSTALACION_STORAGE_KEY = 'instalacionId';

export const fingerprintNavegador = (): string => {
  const fixture = `${navigator.platform ?? ''}-${navigator.language ?? ''}-${navigator.userAgent ?? ''}`;
  return `web-${fixture.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 128)}`;
};

export const venceEnDias = (fecha?: string): number | null => {
  if (!fecha) return null;
  const fin = new Date(fecha).getTime();
  if (Number.isNaN(fin)) return null;
  const diffDias = (fin - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diffDias);
};