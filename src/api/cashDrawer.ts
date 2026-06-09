import { post } from './client';

export const cashDrawerAPI = {
  /** Fire-and-forget — failures are swallowed by the caller. */
  logOpen: async (): Promise<void> => {
    await post('/cash-drawer/log-open');
  },
};
