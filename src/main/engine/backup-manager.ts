import fs from 'fs';
import path from 'path';
import os from 'os';
import { AuditLogEntry, BackupRecord } from '../../shared/types';

export class BackupManager {
  private static instance: BackupManager;
  private baseDir: string;
  private backupsFile: string;
  private auditFile: string;
  private backups: Map<string, BackupRecord> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  private constructor() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    this.baseDir = path.join(appData, 'Optimizer');
    this.backupsFile = path.join(this.baseDir, 'backups', 'backups.json');
    this.auditFile = path.join(this.baseDir, 'logs', 'audit.json');

    this.ensureDirs();
    this.load();
  }

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  private ensureDirs() {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, 'backups'),
      path.join(this.baseDir, 'logs'),
      path.join(this.baseDir, 'profiles'),
    ];
    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        try {
          fs.mkdirSync(d, { recursive: true });
        } catch (e) {
          console.error(`Erro ao criar pasta: ${d}`, e);
        }
      }
    }
  }

  private load() {
    try {
      if (fs.existsSync(this.backupsFile)) {
        const raw = fs.readFileSync(this.backupsFile, 'utf-8');
        const list: BackupRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.backups.set(item.optimizationId, item);
        }
      }
    } catch (e) {
      console.error('Erro ao ler backups.json:', e);
    }

    try {
      if (fs.existsSync(this.auditFile)) {
        const raw = fs.readFileSync(this.auditFile, 'utf-8');
        this.auditLogs = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Erro ao ler audit.json:', e);
    }
  }

  public saveBackups(): void {
    try {
      this.ensureDirs();
      const list = Array.from(this.backups.values());
      fs.writeFileSync(this.backupsFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao guardar backups.json:', e);
    }
  }

  public saveAuditLogs(): void {
    try {
      this.ensureDirs();
      fs.writeFileSync(this.auditFile, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao guardar audit.json:', e);
    }
  }

  public recordBackup(record: Omit<BackupRecord, 'id' | 'timestamp'>): BackupRecord {
    // Only record if no backup exists yet to preserve original state
    const existing = this.backups.get(record.optimizationId);
    if (existing) {
      return existing;
    }

    const fullRecord: BackupRecord = {
      ...record,
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    this.backups.set(record.optimizationId, fullRecord);
    this.saveBackups();
    return fullRecord;
  }

  public getBackup(optimizationId: string): BackupRecord | undefined {
    return this.backups.get(optimizationId);
  }

  public hasBackup(optimizationId: string): boolean {
    return this.backups.has(optimizationId);
  }

  public removeBackup(optimizationId: string): void {
    this.backups.delete(optimizationId);
    this.saveBackups();
  }

  public getAllBackups(): BackupRecord[] {
    return Array.from(this.backups.values());
  }

  public logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(fullEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.saveAuditLogs();
    return fullEntry;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
    this.saveAuditLogs();
  }
}
