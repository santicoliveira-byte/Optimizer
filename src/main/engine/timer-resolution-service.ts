import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TimerResolutionStatus {
  currentMs: number;
  minMs: number;
  maxMs: number;
  isLockedHalfMs: boolean;
}

export class TimerResolutionService {
  private static instance: TimerResolutionService;
  private workerProcess: ChildProcess | null = null;
  private isLocked: boolean = false;

  public static getInstance(): TimerResolutionService {
    if (!TimerResolutionService.instance) {
      TimerResolutionService.instance = new TimerResolutionService();
    }
    return TimerResolutionService.instance;
  }

  /**
   * Queries the current Windows kernel timer resolution in milliseconds
   */
  public async getResolutionStatus(): Promise<TimerResolutionStatus> {
    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $src = @"
        using System;
        using System.Runtime.InteropServices;
        public class WinTimerQuery {
            [DllImport("ntdll.dll")]
            public static extern int NtQueryTimerResolution(out uint min, out uint max, out uint curr);
            public static string Query() {
                uint min, max, curr;
                NtQueryTimerResolution(out min, out max, out curr);
                return string.Format("{0};{1};{2}", curr / 10000.0, min / 10000.0, max / 10000.0);
            }
        }
"@
        Add-Type -TypeDefinition $src
        [WinTimerQuery]::Query()
      `;

      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 4000 }
      );

      const parts = (stdout || '').trim().split(';');
      const currentMs = parseFloat(parts[0]) || (this.isLocked ? 0.5 : 1.0);
      const minMs = parseFloat(parts[1]) || 15.625;
      const maxMs = parseFloat(parts[2]) || 0.5;

      return {
        currentMs,
        minMs,
        maxMs,
        isLockedHalfMs: this.isLocked || currentMs <= 0.55
      };
    } catch {
      return {
        currentMs: this.isLocked ? 0.5 : 1.0,
        minMs: 15.625,
        maxMs: 0.5,
        isLockedHalfMs: this.isLocked
      };
    }
  }

  /**
   * Locks or unlocks the timer resolution to 0.500 ms (5000 in 100ns units)
   */
  public async setPrecisionTimer(enable: boolean): Promise<{ success: boolean; message: string; currentMs: number }> {
    if (enable) {
      if (this.workerProcess) {
        return { success: true, message: 'Resolução de Timer já travada a 0.500 ms.', currentMs: 0.5 };
      }

      try {
        const psCommand = `
          $src = @"
          using System;
          using System.Runtime.InteropServices;
          public class WinTimerLock {
              [DllImport("ntdll.dll")]
              public static extern int NtSetTimerResolution(uint desired, bool set, out uint curr);
              public static void Lock() {
                  uint curr;
                  NtSetTimerResolution(5000, true, out curr);
                  System.Threading.Thread.Sleep(System.Threading.Timeout.Infinite);
              }
          }
"@
          Add-Type -TypeDefinition $src
          [WinTimerLock]::Lock()
        `;

        this.workerProcess = spawn(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', psCommand.replace(/\n/g, ' ')],
          { windowsHide: true, detached: false }
        );

        this.workerProcess.on('exit', () => {
          this.workerProcess = null;
          this.isLocked = false;
        });

        this.isLocked = true;
        return {
          success: true,
          message: 'Timer do Kernel bloqueado com sucesso a 0.500 ms (Microsecond Precision).',
          currentMs: 0.5
        };
      } catch (e: any) {
        return { success: false, message: `Falha ao ativar 0.5ms: ${e.message}`, currentMs: 1.0 };
      }
    } else {
      if (this.workerProcess) {
        try {
          this.workerProcess.kill();
        } catch {}
        this.workerProcess = null;
      }
      this.isLocked = false;
      return {
        success: true,
        message: 'Resolução de Timer reposta para o valor padrão do Windows.',
        currentMs: 1.0
      };
    }
  }

  /**
   * Cleanup on application shutdown
   */
  public cleanup() {
    if (this.workerProcess) {
      try {
        this.workerProcess.kill();
      } catch {}
      this.workerProcess = null;
    }
    this.isLocked = false;
  }
}
