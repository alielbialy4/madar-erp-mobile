import React, { createContext, useContext } from 'react';
import type { SidebarNavAction } from './sidebarNavMap';

export type NavShellActions = {
  openDrawer: () => void;
  openCommandPalette: () => void;
  navigate: (action: SidebarNavAction) => void;
};

const NavShellContext = createContext<NavShellActions | null>(null);

export function NavShellProvider({
  value,
  children,
}: {
  value: NavShellActions;
  children: React.ReactNode;
}) {
  return <NavShellContext.Provider value={value}>{children}</NavShellContext.Provider>;
}

export function useNavShell(): NavShellActions {
  const ctx = useContext(NavShellContext);
  if (!ctx) {
    return {
      openDrawer: () => undefined,
      openCommandPalette: () => undefined,
      navigate: () => undefined,
    };
  }
  return ctx;
}
