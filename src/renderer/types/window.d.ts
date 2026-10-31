import { OptimizerApi } from '../../main/preload';

declare global {
  interface Window {
    optimizerApi: OptimizerApi;
  }
}

export {};
