export const CAPTURE_ATTEMPT_TIMEOUT_MS = 12_000;

const CAPTURE_TIMEOUT_MESSAGE = 'انتهت مهلة التقاط الصورة';

export function captureAttemptTimeout(ms = CAPTURE_ATTEMPT_TIMEOUT_MS): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(CAPTURE_TIMEOUT_MESSAGE)), ms);
  });
}

export async function withCaptureTimeout<T>(
  promise: Promise<T>,
  ms = CAPTURE_ATTEMPT_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([promise, captureAttemptTimeout(ms)]);
}
