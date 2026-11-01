/**
 * Single source of truth for the Application Version in the Renderer
 * Injected automatically by Vite via package.json
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__
    ? __APP_VERSION__
    : '2.2.8';

export const getDisplayVersion = (version: string = APP_VERSION): string => {
  if (!version) return 'v2.2.8';
  return version.startsWith('v') ? version : `v${version}`;
};
