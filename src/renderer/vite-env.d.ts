/// <reference types="vite/client" />
import type { OptimizerApi } from '../main/preload';

declare global {
  interface Window {
    optimizerApi: OptimizerApi;
  }
}
