// src/app/shared/models/graph.models.ts
export type MiniKind = 'item' | 'action';

export interface MiniNode {
  id: string;
  label: string;
  kind: MiniKind;
  trust: number;
  sourceName: string;
  img: string;
  x: number; y: number; w: number; h: number;
  isUnknown?: boolean;
  isBase?: boolean;
}

export interface MiniEdge {
  source: string;
  target: string;
  qty: number;
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
