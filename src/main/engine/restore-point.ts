import { PowerShellRunner } from './powershell-runner';
import { sanitizeRestorePointDescription } from './security-utils';

export interface RestorePointInfo {
  sequenceNumber: number;
  description: string;
  creationTime: string;
  restorePointType: string;
}

export class RestorePointManager {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async isSystemRestoreEnabled(): Promise<boolean> {
    try {
      const res = await this.runner.run(
        `Get-ComputerRestorePoint -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count`
      );
      return res.success;
    } catch {
      return false;
    }
  }

  public async createRestorePoint(description = 'Optimizer Backup Ponto de Restauro'): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Enable System Restore on C: if not enabled
      await this.runner.run(`
        Enable-ComputerRestore -Drive "C:\\" -ErrorAction SilentlyContinue
      `);

      // 2. Adjust SystemRestore frequency threshold registry key to bypass the default 24h cooldown
      await this.runner.run(`
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore" -Name "SystemRestorePointCreationFrequency" -Value 0 -Force -ErrorAction SilentlyContinue
      `);

      // 3. Create the restore point (strictly sanitize description against command injection)
      const safeDesc = sanitizeRestorePointDescription(description);

      const cmd = `Checkpoint-Computer -Description "${safeDesc}" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop`;
      const res = await this.runner.run(cmd, 45000);

      if (res.success) {
        return {
          success: true,
          message: 'Ponto de restauro do sistema criado com sucesso.'
        };
      } else {
        return {
          success: false,
          message: `Não foi possível criar o ponto de restauro: ${res.stderr || 'Verifique se a Proteção do Sistema está ativada nas Definições do Windows.'}`
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: `Exceção ao criar ponto de restauro: ${e.message}`
      };
    }
  }

  public async listRestorePoints(): Promise<RestorePointInfo[]> {
    try {
      const res = await this.runner.runJson<any[]>(`
        Get-ComputerRestorePoint | Select-Object SequenceNumber, Description, CreationTime, RestorePointType
      `);
      if (!res) return [];
      const arr = Array.isArray(res) ? res : [res];
      return arr.map((item) => ({
        sequenceNumber: item.SequenceNumber || 0,
        description: item.Description || '',
        creationTime: item.CreationTime || '',
        restorePointType: item.RestorePointType || ''
      }));
    } catch {
      return [];
    }
  }
}
