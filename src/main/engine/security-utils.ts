/**
 * Security utilities and input sanitization helpers for Optimizer Desktop
 */

/**
 * Checks whether an external URL is safe to open via shell.openExternal.
 * Prevents OS protocol abuse (file://, ms-msdt:, calc:, javascript:, etc.)
 */
export function isSafeExternalUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes an executable or process name, removing unsafe shell/filesystem characters
 */
export function sanitizeProcessName(processName: string): string {
  if (!processName || typeof processName !== 'string') return '';
  return processName.replace(/\.exe$/i, '').replace(/[^a-zA-Z0-9_\-]/g, '').trim();
}

/**
 * Strictly sanitizes restore point descriptions to prevent PowerShell parameter injection
 */
export function sanitizeRestorePointDescription(desc?: string): string {
  if (!desc || typeof desc !== 'string') return 'Optimizer Backup Ponto de Restauro';
  const clean = desc.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 80);
  return clean || 'Optimizer Backup';
}

/**
 * Strictly validates whether an update binary download URL belongs to official repository releases
 */
export function isOfficialReleaseUrl(downloadUrl: string): boolean {
  if (!downloadUrl || typeof downloadUrl !== 'string') return false;
  try {
    const parsedUrl = new URL(downloadUrl);
    const isOfficialHost =
      parsedUrl.hostname === 'github.com' ||
      parsedUrl.hostname === 'objects.githubusercontent.com' ||
      parsedUrl.hostname.endsWith('.githubusercontent.com');
    const isOfficialPath = parsedUrl.pathname.includes('santicoliveira-byte/Optimizer');
    return parsedUrl.protocol === 'https:' && isOfficialHost && isOfficialPath;
  } catch {
    return false;
  }
}
