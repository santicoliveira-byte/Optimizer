import { spawn } from 'child_process';

export interface PowerShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class PowerShellRunner {
  private static instance: PowerShellRunner;

  private constructor() {}

  public static getInstance(): PowerShellRunner {
    if (!PowerShellRunner.instance) {
      PowerShellRunner.instance = new PowerShellRunner();
    }
    return PowerShellRunner.instance;
  }

  private executeRaw(command: string, timeoutMs = 30000): Promise<PowerShellResult> {
    return new Promise((resolve) => {
      // Encode UTF-8 script wrapper to ensure clean execution and error catching
      const fullScript = `
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        $ErrorActionPreference = 'Continue'
        try {
          ${command}
        } catch {
          [Console]::Error.WriteLine($_)
          exit 1
        }
      `;

      const child = spawn('powershell.exe', [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        fullScript
      ], {
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try {
            child.kill();
          } catch {}
          resolve({
            stdout,
            stderr: `${stderr}\n[Timeout] Execução ultrapassou ${timeoutMs}ms.`,
            exitCode: -1,
            success: false
          });
        }
      }, timeoutMs);

      child.stdout.on('data', (data) => {
        stdout += data.toString('utf-8');
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString('utf-8');
      });

      child.on('close', (code) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          const sErr = stderr.trim();
          const sOut = stdout.trim();
          const hasElevationErr =
            sErr.includes('requires elevation') ||
            sErr.includes('Acesso negado') ||
            sErr.includes('Access is denied') ||
            sErr.includes('UnauthorizedAccessException') ||
            sOut.includes('requires elevation') ||
            sOut.includes('Acesso negado');

          resolve({
            stdout: sOut,
            stderr: sErr,
            exitCode: code ?? 0,
            success: (code ?? 0) === 0 && !hasElevationErr
          });
        }
      });

      child.on('error', (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve({
            stdout,
            stderr: err.message,
            exitCode: 1,
            success: false
          });
        }
      });
    });
  }

  public async run(command: string, timeoutMs = 30000, allowElevation = true): Promise<PowerShellResult> {
    const res = await this.executeRaw(command, timeoutMs);
    if (!res.success && allowElevation) {
      const combined = `${res.stderr} ${res.stdout}`;
      const isElevationErr =
        combined.includes('requires elevation') ||
        combined.includes('Acesso negado') ||
        combined.includes('Access is denied') ||
        combined.includes('UnauthorizedAccessException');

      if (isElevationErr) {
        // Attempt elevated execution via Start-Process powershell -Verb RunAs
        try {
          const encoded = Buffer.from(command, 'utf16le').toString('base64');
          const elevateScript = `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList "-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}"`;
          const elevatedRes = await this.executeRaw(elevateScript, timeoutMs);
          if (elevatedRes.success) {
            return {
              stdout: 'Executado com privilégios de Administrador.',
              stderr: '',
              exitCode: 0,
              success: true
            };
          }
        } catch {}
      }
    }
    return res;
  }

  public async runJson<T = any>(command: string, timeoutMs = 30000): Promise<T | null> {
    const jsonCommand = `& {
      ${command}
    } | ConvertTo-Json -Depth 5 -Compress`;
    const res = await this.run(jsonCommand, timeoutMs);
    if (!res.success || !res.stdout) {
      return null;
    }
    try {
      return JSON.parse(res.stdout) as T;
    } catch {
      return null;
    }
  }
}
