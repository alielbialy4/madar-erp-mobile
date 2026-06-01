import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import type { TableDragMode } from '@/utils/tableDropRules';
import { isValidDropTarget, type TableDropParticipant } from '@/utils/tableDropRules';

export type LayoutRect = { x: number; y: number; width: number; height: number };

export type TableDragSession = {
  mode: TableDragMode;
  sourceId: string;
  sourceName: string;
  x: number;
  y: number;
};

type DropPayload = {
  mode: TableDragMode;
  sourceId: string;
  targetId: string;
};

function pointInRect(x: number, y: number, rect: LayoutRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function findTargetAtPoint(
  x: number,
  y: number,
  layouts: Record<string, LayoutRect>,
  sourceId: string,
): string | null {
  for (const [id, rect] of Object.entries(layouts)) {
    if (id === sourceId) continue;
    if (pointInRect(x, y, rect)) return id;
  }
  return null;
}

export function useTableCardDragDrop(
  tables: TableDropParticipant[],
  onDrop: (payload: DropPayload) => void,
) {
  const [session, setSession] = useState<TableDragSession | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const layoutsRef = useRef<Record<string, LayoutRect>>({});
  const sessionRef = useRef<TableDragSession | null>(null);
  sessionRef.current = session;
  const tablesRef = useRef(tables);
  tablesRef.current = tables;

  const registerLayout = useCallback((tableId: string, rect: LayoutRect) => {
    layoutsRef.current[tableId] = rect;
  }, []);

  const startDrag = useCallback(
    (mode: TableDragMode, sourceId: string, sourceName: string, event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      const next: TableDragSession = { mode, sourceId, sourceName, x: pageX, y: pageY };
      sessionRef.current = next;
      setSession(next);
      setHoverTargetId(null);
    },
    [],
  );

  const updateHover = useCallback((x: number, y: number) => {
    const current = sessionRef.current;
    if (!current) {
      setHoverTargetId(null);
      return;
    }
    const targetId = findTargetAtPoint(x, y, layoutsRef.current, current.sourceId);
    if (!targetId) {
      setHoverTargetId(null);
      return;
    }
    const source = tablesRef.current.find((t) => t.id === current.sourceId);
    const target = tablesRef.current.find((t) => t.id === targetId);
    if (!source || !target || !isValidDropTarget(current.mode, source, target)) {
      setHoverTargetId(null);
      return;
    }
    setHoverTargetId(targetId);
  }, []);

  const endDrag = useCallback(
    (x: number, y: number) => {
      const current = sessionRef.current;
      sessionRef.current = null;
      setSession(null);
      setHoverTargetId(null);
      if (!current) return;

      const targetId = findTargetAtPoint(x, y, layoutsRef.current, current.sourceId);
      if (!targetId) return;

      const source = tablesRef.current.find((t) => t.id === current.sourceId);
      const target = tablesRef.current.find((t) => t.id === targetId);
      if (!source || !target) return;
      if (!isValidDropTarget(current.mode, source, target)) return;

      onDrop({ mode: current.mode, sourceId: current.sourceId, targetId });
    },
    [onDrop],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => sessionRef.current != null,
        onMoveShouldSetPanResponder: () => sessionRef.current != null,
        onPanResponderGrant: () => {},
        onPanResponderMove: (_evt, gesture: PanResponderGestureState) => {
          setSession((prev) =>
            prev ? { ...prev, x: gesture.moveX, y: gesture.moveY } : prev,
          );
          updateHover(gesture.moveX, gesture.moveY);
        },
        onPanResponderRelease: (_evt, gesture: PanResponderGestureState) => {
          endDrag(gesture.moveX, gesture.moveY);
        },
        onPanResponderTerminate: (_evt, gesture: PanResponderGestureState) => {
          endDrag(gesture.moveX, gesture.moveY);
        },
      }),
    [endDrag, updateHover],
  );

  const cancelDrag = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    setHoverTargetId(null);
  }, []);

  return {
    session,
    hoverTargetId,
    startDrag,
    registerLayout,
    cancelDrag,
    panHandlers: panResponder.panHandlers,
  };
}
