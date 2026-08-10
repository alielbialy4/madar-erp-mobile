import { create } from 'zustand';

type ImmersiveState = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

export const useImmersiveStore = create<ImmersiveState>((set, get) => ({
  enabled: false,
  setEnabled: (value) => set({ enabled: Boolean(value) }),
  toggle: () => set({ enabled: !get().enabled }),
}));
