// Graph-Modelle (zentral – von Mapper & UI gemeinsam genutzt)

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

  // optional – vom Mapper gesetzt
  trust?: number;        // 0..1 (für Actions)
  sourceName?: string;   // z. B. "Official Wiki"
  conflictKey?: string;  // gesetzt, wenn Action in Konfliktgruppe ist
  isUnknown?: boolean;   // für Unknown-Items
  isBase?: boolean;      // Base-Items terminieren
}

export interface MiniEdge {
  source: string;
  target: string;
  qty?: number | string;

  // optional – vom Mapper gesetzt
  id?: string;
  conflict?: boolean;    // true => rote Markierung im UI
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
