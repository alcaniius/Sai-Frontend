import '@testing-library/jest-dom/vitest';

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
});
