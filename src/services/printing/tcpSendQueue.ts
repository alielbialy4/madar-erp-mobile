const sendChains = new Map<string, Promise<void>>();

/**
 * Serialize TCP sends per printer (ip:port) so buffers never interleave on one socket.
 */
export function withTcpSendLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = sendChains.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(fn);
  sendChains.set(
    key,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

/** @internal test helper */
export function resetTcpSendLocks(): void {
  sendChains.clear();
}

/** @internal test helper */
export function peekTcpSendChain(key: string): Promise<void> | undefined {
  return sendChains.get(key);
}
