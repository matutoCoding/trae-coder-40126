import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname);

export class JsonRepository<T extends { id: string }> {
  private filePath: string;
  private inMemory: T[] = [];
  private persistenceEnabled: boolean;

  constructor(filename: string, initialData: T[] = []) {
    this.filePath = path.join(DB_DIR, filename);
    this.persistenceEnabled = true;
    this.load(initialData);
  }

  private load(initialData: T[]): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.inMemory = JSON.parse(raw) as T[];
        return;
      }
    } catch {
      // ignore read errors
    }
    this.inMemory = [...initialData];
    this.persist();
  }

  private persist(): void {
    if (!this.persistenceEnabled) return;
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.inMemory, null, 2), 'utf-8');
    } catch (e) {
      console.error(`[Repository] persist failed for ${this.filePath}:`, e);
    }
  }

  findAll(predicate?: (item: T) => boolean): T[] {
    if (!predicate) return [...this.inMemory];
    return this.inMemory.filter(predicate);
  }

  findById(id: string): T | undefined {
    return this.inMemory.find(item => item.id === id);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.inMemory.find(predicate);
  }

  create(item: T): T {
    this.inMemory.push(item);
    this.persist();
    return item;
  }

  update(id: string, updater: (item: T) => T): T | undefined {
    const idx = this.inMemory.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.inMemory[idx] = updater(this.inMemory[idx]);
    this.persist();
    return this.inMemory[idx];
  }

  upsert(id: string, item: T): T {
    const idx = this.inMemory.findIndex(i => i.id === id);
    if (idx === -1) {
      this.inMemory.push(item);
    } else {
      this.inMemory[idx] = item;
    }
    this.persist();
    return item;
  }

  remove(id: string): boolean {
    const idx = this.inMemory.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.inMemory.splice(idx, 1);
    this.persist();
    return true;
  }

  bulkReplace(items: T[]): void {
    this.inMemory = [...items];
    this.persist();
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.inMemory.length;
    return this.inMemory.filter(predicate).length;
  }
}
