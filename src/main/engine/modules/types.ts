import { OptimizationStatus } from '../../../shared/types';

export interface ModuleDetectionResult {
  status: OptimizationStatus;
  currentValue?: any;
  infoValue?: string;
  error?: string;
}

export interface ModuleApplyResult {
  success: boolean;
  message: string;
  previousValue?: any;
  newValue?: any;
  commands?: string[];
  rebootRequired?: boolean;
}

export interface ModuleRevertResult {
  success: boolean;
  message: string;
}

export interface IModuleHandler {
  detect(id: string): Promise<ModuleDetectionResult>;
  apply(id: string, isDryRun: boolean): Promise<ModuleApplyResult>;
  revert(id: string, originalValue: any): Promise<ModuleRevertResult>;
}
