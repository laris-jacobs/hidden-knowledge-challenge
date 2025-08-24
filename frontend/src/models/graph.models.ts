// Graph models (central — shared by mapper & UI)

export type MiniKind = 'item' | 'action';

export interface MiniNode {
  id: string;
  label: string;
  kind: MiniKind;

  img: string;
  x: number;
  y: number;
  w: number;
  h: number;

  // optional — set by the mapper
  trust?: number;        // 0..1 (for actions)
  sourceName?: string;   // e.g., "Official Wiki"
  conflictKey?: string;  // set when the action belongs to a conflict group
  isUnknown?: boolean;   // for unknown items
  isBase?: boolean;      // base items terminate expansion
}

export interface MiniEdge {
  source: string;
  target: string;
  qty?: number | string;

  // optional — set by the mapper
  id?: string;
  conflict?: boolean;    // true ⇒ red highlight in the UI
}

export interface GraphBuildOptions {
  baseX?: number;
  colGap?: number;
  rowGap?: number;
  itemSize?: { w: number; h: number; };
  actionSize?: { w: number; h: number; };
  unknownItemImg?: string;
  defaultItemImg?: string;
  defaultActionImg?: string;
}

export interface GraphResult {
  nodes: MiniNode[];
  edges: MiniEdge[];
}
