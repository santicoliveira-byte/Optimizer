/// <reference types="vite/client" />
import type { OptimizerApi } from '../main/preload';

declare const __APP_VERSION__: string;

declare global {
  const __APP_VERSION__: string;
  interface Window {
    optimizerApi: OptimizerApi;
  }
}
