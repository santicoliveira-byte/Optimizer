import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LicenseStatus } from '../../shared/types';

const LICENSE_SALT = 'OPTIMIZER_ENTERPRISE_SECRET_SALT_2026';

export class LicenseService {
  private static instance: LicenseService;
  private licenseFilePath: string = '';
  private currentStatus: LicenseStatus = {
    isPro: false,
    plan: 'Free'
  };

  private constructor() {
    try {
      const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Roaming');
      const optDir = path.join(appData, 'Optimizer');
      if (!fs.existsSync(optDir)) {
        fs.mkdirSync(optDir, { recursive: true });
      }
      this.licenseFilePath = path.join(optDir, 'license.json');
      this.loadLicense();
    } catch {
      this.currentStatus = { isPro: false, plan: 'Free' };
    }
  }

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  private loadLicense(): void {
    try {
      if (fs.existsSync(this.licenseFilePath)) {
        const raw = fs.readFileSync(this.licenseFilePath, 'utf8');
        const data = JSON.parse(raw);
        if (data && data.licenseKey && this.verifyKey(data.licenseKey)) {
          this.currentStatus = {
            isPro: true,
            plan: 'PRO',
            licenseKey: data.licenseKey,
            activatedAt: data.activatedAt || new Date().toLocaleDateString(),
            ownerName: data.ownerName || 'Utilizador PRO'
          };
          return;
        }
      }
    } catch {}
    this.currentStatus = { isPro: false, plan: 'Free' };
  }

  private saveLicense(license: LicenseStatus): void {
    try {
      if (this.licenseFilePath) {
        fs.writeFileSync(this.licenseFilePath, JSON.stringify(license, null, 2), 'utf8');
      }
    } catch {}
  }

  /**
   * Cryptographically validates a license key:
   * Format: OPT-PRO-XXXX-YYYY-ZZZZ
   * Checks SHA-256 HMAC checksum embedded in the key
   */
  public verifyKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const cleanKey = key.trim().toUpperCase();

    // Master / Universal developer license key
    if (cleanKey === 'OPT-PRO-LIFETIME-VIP-2026' || cleanKey === 'OPT-PRO-CREATOR-SANTIAGO-VIP') {
      return true;
    }

    const parts = cleanKey.split('-');
    if (parts.length !== 5 || parts[0] !== 'OPT' || parts[1] !== 'PRO') {
      return false;
    }

    const payload = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`;
    const expectedChecksum = crypto
      .createHmac('sha256', LICENSE_SALT)
      .update(payload)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();

    return parts[4] === expectedChecksum;
  }

  /**
   * Helper to generate authentic lifetime PRO keys for buyers
   */
  public generateKey(prefixSegment = 'GMR99'): string {
    const cleanSeg = prefixSegment.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5) || 'VIP01';
    const randomSeg = crypto.randomBytes(2).toString('hex').toUpperCase();
    const payload = `OPT-PRO-${cleanSeg}-${randomSeg}`;
    const checksum = crypto
      .createHmac('sha256', LICENSE_SALT)
      .update(payload)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();

    return `${payload}-${checksum}`;
  }

  public getStatus(): LicenseStatus {
    return { ...this.currentStatus };
  }

  public async activate(licenseKey: string, ownerName?: string): Promise<{ success: boolean; message: string; isPro: boolean }> {
    const cleanKey = (licenseKey || '').trim().toUpperCase();
    if (!cleanKey) {
      return { success: false, message: 'Por favor, insere uma chave de licença válida.', isPro: false };
    }

    if (!this.verifyKey(cleanKey)) {
      return {
        success: false,
        message: 'Chave de licença inválida ou inexistente. Verifica se copiaste corretamente.',
        isPro: false
      };
    }

    this.currentStatus = {
      isPro: true,
      plan: 'PRO',
      licenseKey: cleanKey,
      activatedAt: new Date().toLocaleDateString(),
      ownerName: ownerName || 'Membro PRO'
    };

    this.saveLicense(this.currentStatus);

    return {
      success: true,
      message: '🎉 Licença Optimizer PRO Ativada com Sucesso! Todas as funcionalidades foram desbloqueadas.',
      isPro: true
    };
  }

  public async deactivate(): Promise<{ success: boolean; message: string }> {
    this.currentStatus = {
      isPro: false,
      plan: 'Free'
    };

    try {
      if (fs.existsSync(this.licenseFilePath)) {
        fs.unlinkSync(this.licenseFilePath);
      }
    } catch {}

    return {
      success: true,
      message: 'Licença desativada. A aplicação voltou ao plano gratuito.'
    };
  }
}
