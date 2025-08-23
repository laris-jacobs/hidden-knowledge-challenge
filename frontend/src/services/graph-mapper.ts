import { Action, Item, Source } from '../models/input.model';
import { GraphResult, MiniNode, MiniEdge, GraphBuildOptions } from '../models/graph.models';

const IMG_ITEM_DEFAULT   = 'imgs/items/placeholder.png';
const IMG_ACTION_DEFAULT = 'imgs/recipes/placeholder.png';

// Defaults fürs Layout
const DEF_OPTS: Required<GraphBuildOptions> = {
  baseX: 120, colGap: 160, rowGap: 90,
  itemSize: { w: 72,  h: 72 },
  actionSize: { w: 108, h: 108 },
  // werden in dieser Basis-Variante nicht benötigt, bleiben aber für Kompatibilität
  unknownItemImg: '',
  defaultItemImg: IMG_ITEM_DEFAULT,
  defaultActionImg: IMG_ACTION_DEFAULT,
};

export function buildKnowledgeGraphStatic(
  actions: Action[],
  targetItemId: string,
  opts: GraphBuildOptions = {}
): GraphResult {
  const O = { ...DEF_OPTS, ...opts };

  // --- Indizes & Caches ---
  const actionsByOutput = new Map<string, Action[]>(); // itemId -> Actions, die dieses Item ausgeben
  const itemCache = new Map<string, Item>();           // bekannte Items aus inputs/outputs
  const nodes = new Map<string, MiniNode>();
  const edges: MiniEdge[] = [];
  const levelByNode = new Map<string, number>();       // Spalten-Index (kleiner = weiter links)
  const nextRowIndex = new Map<number, number>();      // Level -> nächste freie Zeile

  // Indexieren
  for (const act of actions) {
    for (const out of act.outputs ?? []) {
      const iid = out.item?.id; if (!iid) continue;
      const list = actionsByOutput.get(iid) ?? [];
      list.push(act);
      actionsByOutput.set(iid, list);
      if (out.item) itemCache.set(out.item.id!, out.item);
    }
    for (const inp of act.inputs ?? []) {
      if (inp.item?.id) itemCache.set(inp.item.id, inp.item);
    }
  }

  // ---------- Utils ----------
  const parseTrust = (t?: string) => {
    const n = parseFloat((t ?? '').trim());
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
  };

  const bestSource = (sources?: Source[]) => {
    if (!sources?.length) return { trust: 0.5, sourceName: 'Unknown' };
    let best = sources[0], bestT = parseTrust(best.trust);
    for (const s of sources) {
      const ts = parseTrust(s.trust);
      if (ts > bestT) { best = s; bestT = ts; }
    }
    return { trust: bestT, sourceName: best.name ?? best.id ?? 'Unknown' };
  };

  const isBase = (it?: Item) => {
    if (!it) return false;
    const v = it.is_base as any;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === 'true' || s === '1' || s === 'yes';
    }
    return it.base_harvest != null; // Base, wenn sammelbar
  };

  const addEdge = (sourceId: string, targetId: string, qty: number) => {
    if (!edges.some(e => e.source === sourceId && e.target === targetId && e.qty === qty)) {
      edges.push({ source: sourceId, target: targetId, qty });
    }
  };

  const ensureItemNode = (itemId: string, level: number, label?: string): MiniNode => {
    const ex = nodes.get(itemId);
    const it = itemCache.get(itemId);
    const name = label ?? it?.name ?? itemId;
    const img = it?.image_url && it.image_url.trim() ? it.image_url : O.defaultItemImg;
    const base = isBase(it);

    if (ex) {
      const prev = levelByNode.get(itemId) ?? level;
      if (level < prev) levelByNode.set(itemId, level);
      if (base) ex.isBase = true;
      return ex;
    }

    const node: MiniNode = {
      id: itemId,
      label: name,
      kind: 'item',
      trust: 0.95,                 // neutral für Items
      sourceName: 'Aggregated',
      img,
      x: 0, y: 0, w: O.itemSize.w, h: O.itemSize.h,
      isBase: base,
    };
    nodes.set(itemId, node);
    levelByNode.set(itemId, level);
    return node;
  };

  const buildActionLabel = (act: Action) =>
    (act.inputs ?? []).map(i => `${i.qty ?? 1} ${i.item?.name ?? i.item?.id ?? 'Unknown'}`).join(' + ')
    || (act.station ?? act.action_type_id ?? 'Action');

  const ensureActionNode = (act: Action, level: number, trust: number, sourceName: string): MiniNode => {
    const id = act.id ?? `act_${Math.random().toString(36).slice(2)}`;
    const ex = nodes.get(id);
    if (ex) {
      const prev = levelByNode.get(id) ?? level;
      if (level < prev) levelByNode.set(id, level);
      return ex;
    }
    const img = act.image_url && act.image_url.trim() ? act.image_url : O.defaultActionImg;
    const node: MiniNode = {
      id,
      label: buildActionLabel(act),
      kind: 'action',
      trust,
      sourceName,
      img,
      x: 0, y: 0, w: O.actionSize.w, h: O.actionSize.h,
    };
    nodes.set(id, node);
    levelByNode.set(id, level);
    return node;
  };

  // ---------- Rekursion (immer weiter nach links) ----------
  // Konvention:
  // - Item auf Level L
  // - Action, die dieses Item produziert, auf Level L-1
  // - Deren Input-Items auf Level L-2
  // => Ziel-Item startet bei Level 0 (rechts), Inputs zunehmend negativ (links)
  const visited = new Set<string>(); // optionaler Schutz gegen Zyklen (pro Item)

  const expandForItem = (itemId: string, level: number) => {
    // Item anlegen (auf Level L)
    ensureItemNode(itemId, level);

    // Zyklen vermeiden (bei exotischen Daten)
    const visitKey = `${itemId}@${level}`;
    if (visited.has(visitKey)) return;
    visited.add(visitKey);

    // Alle Producer-Actions (falls keine: Base-Items terminieren hier sowieso)
    const producers = actionsByOutput.get(itemId) ?? [];
    for (const act of producers) {
      const { trust, sourceName } = bestSource(act.sources);
      const actionLevel = level - 1;
      const actionNode = ensureActionNode(act, actionLevel, trust, sourceName);

      // Action → dieses Output-Item (nur die passende Output-Menge)
      const out = (act.outputs ?? []).find(o => o.item?.id === itemId);
      addEdge(actionNode.id, itemId, out?.qty ?? 1);

      // Inputs: Item → Action und rekursiv weiter nach links
      for (const inp of (act.inputs ?? [])) {
        const inItem = inp.item; if (!inItem?.id) continue;

        // Input-Item liegt zwei Spalten links vom Output-Item
        const inputLevel = level - 2;
        ensureItemNode(inItem.id, inputLevel);
        addEdge(inItem.id, actionNode.id, inp.qty ?? 1);

        // Rekursion nur, wenn kein Base-Item
        if (!isBase(inItem)) {
          expandForItem(inItem.id, inputLevel);
        } else {
          // Base-Items werden angelegt, aber nicht weiter expandiert
          ensureItemNode(inItem.id, inputLevel);
        }
      }
    }
  };

  // Start: Ziel-Item auf Level 0 (rechts)
  expandForItem(targetItemId, 0);

  // ---------- Layout ----------
  // Levels normalisieren: kleinster Level -> 0
  const allLevels = Array.from(levelByNode.values());
  const minLevel = Math.min(...allLevels);
  for (const n of nodes.values()) {
    const lvl = (levelByNode.get(n.id)! - minLevel); // >= 0
    const x = O.baseX + lvl * O.colGap;
    const row = nextRowIndex.get(lvl) ?? 0;
    const y = 120 + row * O.rowGap;
    nextRowIndex.set(lvl, row + 1);
    n.x = x; n.y = y;
  }

  return { nodes: Array.from(nodes.values()), edges };
}
