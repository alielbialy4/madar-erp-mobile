let fontsReady = false;
const waiters: Array<() => void> = [];

export function markFontsReady(): void {
  fontsReady = true;
  for (const resolve of waiters) resolve();
  waiters.length = 0;
}

export function areFontsReady(): boolean {
  return fontsReady;
}

export function waitForFontsReady(): Promise<void> {
  if (fontsReady) return Promise.resolve();
  return new Promise((resolve) => {
    waiters.push(resolve);
  });
}
