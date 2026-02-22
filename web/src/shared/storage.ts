export const storage = {
  getItem: (k: string): Promise<string | null> => Promise.resolve(localStorage.getItem(k)),
  setItem: (k: string, v: string): Promise<void> => { localStorage.setItem(k, v); return Promise.resolve(); },
  removeItem: (k: string): Promise<void> => { localStorage.removeItem(k); return Promise.resolve(); },
};
