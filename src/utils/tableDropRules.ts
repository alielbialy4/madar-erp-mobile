export type TableDragMode = 'transfer' | 'merge';

export type TableDropParticipant = {
  id: string;
  effectiveStatus: 'available' | 'occupied' | 'reserved' | 'closed';
  hasServerOrder: boolean;
  groupedIntoTableId?: string | null;
};

export function isGroupedMember(table: Pick<TableDropParticipant, 'groupedIntoTableId'>): boolean {
  return Boolean(table.groupedIntoTableId);
}

export function isValidDropTarget(
  mode: TableDragMode,
  source: TableDropParticipant,
  target: TableDropParticipant,
): boolean {
  if (source.id === target.id) return false;
  if (target.effectiveStatus === 'closed') return false;
  if (isGroupedMember(source) || isGroupedMember(target)) return false;

  if (mode === 'transfer') {
    return target.effectiveStatus === 'available' && !target.hasServerOrder;
  }

  return true;
}

export function canStartDrag(mode: TableDragMode, source: TableDropParticipant): boolean {
  if (isGroupedMember(source)) return false;
  if (source.effectiveStatus === 'closed') return false;

  if (mode === 'merge') {
    return true;
  }

  return source.effectiveStatus === 'occupied';
}
