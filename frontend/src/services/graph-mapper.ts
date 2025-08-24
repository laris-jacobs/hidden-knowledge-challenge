import { Action, Item, Source } from '../models/input.model';
import { GraphResult, MiniNode, MiniEdge, GraphBuildOptions } from '../models/graph.models';

/**
 * Local node/edge "extensions" that we use internally. We still return the plain
 * MiniNode/MiniEdge (these are compatible because these fields are optional).
 */
type NodeEx = MiniNode & {
  __isMerged?: boolean;
  conflictKey?: string;
  isUnknown?: boolean;
  isBase?: boolean;
};

type EdgeEx = MiniEdge & {
  conflict?: boolean;
};

const IMG_ITEM_DEFAULT   = 'imgs/items/placeholder.png';
const IMG_ACTION_DEFAULT = 'imgs/recipes/placeholder.png';

const DEF_OPTS: Required<GraphBuildOptions> = {
  baseX: 120,
  colGap: 220,
  rowGap: 180,
  itemSize:   { w: 72,  h: 72 },
  actionSize: { w: 200, h: 200 },
  unknownItemImg: '',                 // unknown: no image
  defaultItemImg: IMG_ITEM_DEFAULT,
  defaultActionImg: IMG_ACTION_DEFAULT,
};

/**
 * Builds a *static* knowledge graph for a target item:
 * - Merges equivalent actions by I/O signature, prefers highest-trust sources
 * - Expands producers recursively from right (target) to left (inputs)
 * - Inserts "unknown" chain for non-base items with no producers
 * - Detects conflicts: same output & same input-ID set but differing input quantities
 * - Computes a simple grid layout by levels
 */
export function buildKnowledgeGraphStatic(
  actionsInput: Action[],
  targetItemId: string,
  opts: GraphBuildOptions = {}
): GraphResult {
  const O = { ...DEF_OPTS, ...opts };

  // ---------- Utility helpers ----------

  /** Parse trust value to [0,1]; defaults to 0.5 if missing/invalid. */
  const parseTrust = (t?: string | number | null): number => {
    if (typeof t === 'number' && Number.isFinite(t)) return Math.max(0, Math.min(1, t));
    const n = parseFloat(String(t ?? '').trim());
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
  };

  /** Pick best (highest-trust) source meta; falls back to "Unknown". */
  const bestSourceMeta = (sources?: Source[]) => {
    if (!sources?.length) return { trust: 0.5, sourceName: 'Unknown' as const };
    let best = sources[0];
    let bestT = parseTrust(best.trust);
    for (const s of sources) {
      const ts = parseTrust(s.trust);
      if (ts > bestT) { best = s; bestT = ts; }
    }
    return { trust: bestT, sourceName: best.name ?? best.id ?? 'Unknown' };
  };

  /** Determine if an item is a base resource (no production chain). */
  const isBaseItem = (it?: Item): boolean => {
    if (!it) return false;
    const v = (it as any).is_base; // model may expose both snake/camel variants
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      if (s === 'true' || s === '1' || s === 'yes') return true;
    }
    // Some datasets use `base_harvest` to flag a base item.
    return (it as any).base_harvest != null;
  };

  /** Normalize an IO list to a deterministic signature used for merge grouping. */
  const normalizeIO = (list?: Array<{ item?: Item; qty?: number }>): string =>
    (list ?? [])
      .map(x => ({ id: x.item?.id ?? '', qty: x.qty ?? 1 }))
      .filter(x => !!x.id)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(x => `${x.id}#${x.qty}`)
      .join('|');

  /** Stable signature for an action based on inputs/outputs (IDs + quantities). */
  const signatureForAction = (act: Action): string => {
    const inKey  = normalizeIO((act as any).inputs);
    const outKey = normalizeIO((act as any).outputs);
    return `IN:${inKey}||OUT:${outKey}`;
  };

  /** Deduplicate sources by id or (name+trust), keep highest-trust duplicate. */
  const dedupeSources = (arr: Source[] = []): Source[] => {
    const map = new Map<string, Source>();
    for (const s of arr) {
      const k = s.id ?? `${s.name}-${s.trust}`;
      const prev = map.get(k);
      if (!prev || parseTrust(s.trust) > parseTrust(prev.trust)) map.set(k, s);
    }
    return Array.from(map.values());
  };

  // ---------- Merge phase: group by I/O signature ----------
  const groups = new Map<string, Action[]>();
  for (const act of actionsInput) {
    const key = signatureForAction(act);
    const list = groups.get(key) ?? [];
    list.push(act);
    groups.set(key, list);
  }

  const mergedActions: Action[] = [];
  for (const acts of groups.values()) {
    if (acts.length === 1) { mergedActions.push(acts[0]); continue; }

    // Choose "best" representative by highest-trust source
    let best = acts[0];
    let bestT = bestSourceMeta(best.sources).trust;
    for (const a of acts.slice(1)) {
      const t = bestSourceMeta(a.sources).trust;
      if (t > bestT) { best = a; bestT = t; }
    }

    // Combine sources; shallow-clone I/O from first act (they are equivalent by signature)
    const combinedSources = dedupeSources(acts.flatMap(a => a.sources ?? []));
    const sample = acts[0];

    const merged: Action = {
      id: sample.id ?? `act_merged_${Math.random().toString(36).slice(2)}`,
      action_type_id: sample.action_type_id ?? 'merged',
      image_url: (best.image_url && best.image_url.trim()) ? best.image_url : (sample.image_url ?? ''),
      // Simple deep clone to avoid accidental mutation downstream
      inputs:  sample.inputs  ? JSON.parse(JSON.stringify(sample.inputs))  : [],
      outputs: sample.outputs ? JSON.parse(JSON.stringify(sample.outputs)) : [],
      sources: combinedSources,
      station: sample.station ?? '',
    };

    mergedActions.push(merged);
  }

  // ---------- Indexes & caches ----------
  const actionsByOutput = new Map<string, Action[]>();  // itemId -> actions that produce this item
  const itemCache       = new Map<string, Item>();      // known items by id
  const nodes           = new Map<string, NodeEx>();
  const edges: EdgeEx[] = [];
  const levelByNode     = new Map<string, number>();
  const nextRowIndex    = new Map<number, number>();

  for (const act of mergedActions) {
    for (const out of act.outputs ?? []) {
      const iid = out.item?.id; if (!iid) continue;
      const list = actionsByOutput.get(iid) ?? [];
      if (!list.includes(act)) list.push(act);
      actionsByOutput.set(iid, list);
      if (out.item) itemCache.set(out.item.id!, out.item);
    }
    for (const inp of act.inputs ?? []) {
      if (inp.item?.id) itemCache.set(inp.item.id, inp.item);
    }
  }

  // ---------- Node/edge helpers ----------
  const addEdge = (sourceId: string, targetId: string, qty: number, conflict = false) => {
    // Keep edges unique by (source, target, qty); OR the conflict flag
    const ex = edges.find(e => e.source === sourceId && e.target === targetId && e.qty === qty);
    if (ex) { ex.conflict = ex.conflict || conflict; return; }
    edges.push({ source: sourceId, target: targetId, qty, conflict });
  };

  const ensureItemNode = (
    itemId: string,
    level: number,
    label?: string,
    overrides?: Partial<Pick<NodeEx, 'img' | 'isUnknown' | 'isBase'>>
  ): NodeEx => {
    const ex = nodes.get(itemId);
    const it = itemCache.get(itemId);
    const name = label ?? it?.name ?? itemId;
    const base = overrides?.isBase ?? isBaseItem(it);
    const img = (overrides && 'img' in (overrides ?? {}))
      ? (overrides?.img ?? '')
      : (it?.image_url && it.image_url.trim() ? it.image_url : O.defaultItemImg);

    if (ex) {
      const prev = levelByNode.get(itemId) ?? level;
      if (level < prev) levelByNode.set(itemId, level);
      if (overrides) Object.assign(ex, overrides);
      if (base) ex.isBase = true;
      return ex;
    }

    const node: NodeEx = {
      id: itemId,
      label: name,
      kind: 'item',
      trust: 0.95,
      sourceName: 'Aggregated',
      img,
      x: 0, y: 0, w: O.itemSize.w, h: O.itemSize.h,
      isBase: base,
      isUnknown: overrides?.isUnknown ?? false,
    };

    nodes.set(itemId, node);
    levelByNode.set(itemId, level);
    return node;
  };

  const buildActionLabel = (act: Action): string =>
    (act.inputs ?? [])
      .map(i => `${i.qty ?? 1} ${i.item?.name ?? i.item?.id ?? 'Unknown'}`)
      .join(' + ')
    || (act.station || act.action_type_id || 'Action');

  const ensureActionNode = (
    act: Action,
    level: number,
    customLabel?: string,
    imgOverride?: string | null
  ): NodeEx => {
    const id = act.id ?? `act_${Math.random().toString(36).slice(2)}`;
    const ex = nodes.get(id);
    const { trust, sourceName } = bestSourceMeta(act.sources);

    if (ex) {
      const prev = levelByNode.get(id) ?? level;
      if (level < prev) levelByNode.set(id, level);
      return ex;
    }

    const img = (imgOverride !== undefined)
      ? (imgOverride ?? '')
      : (act.image_url && act.image_url.trim() ? act.image_url : O.defaultActionImg);

    const node: NodeEx = {
      id,
      label: customLabel ?? buildActionLabel(act),
      kind: 'action',
      trust,
      sourceName,
      img,
      x: 0, y: 0, w: O.actionSize.w, h: O.actionSize.h,
      __isMerged: (act.action_type_id === 'merged') || id.startsWith('act_merged_'),
    };

    nodes.set(id, node);
    levelByNode.set(id, level);
    return node;
  };

  /** Create the "unknown" chain: unknown_input_for_X -> act_X_unknown -> X */
  const ensureUnknownChainFor = (missingItemId: string, itemLevel: number) => {
    const actLevel = itemLevel - 1;
    const unkActId = `act_${missingItemId}_unknown`;
    const unkItemId = `unknown_input_for_${missingItemId}`;

    const unkAct: Action = {
      id: unkActId,
      inputs: [],
      outputs: [],
      sources: [],
      image_url: '',          // intentionally blank
      station: '',
      action_type_id: 'unknown',
    };
    ensureActionNode(unkAct, actLevel, 'Unknown source', ''); // force empty image

    ensureItemNode(unkItemId, actLevel - 1, 'Unknown Item', { img: '', isUnknown: true });

    addEdge(unkItemId, unkActId, 1);
    addEdge(unkActId, missingItemId, 1);
  };

  // ---------- Recursive expansion (right -> left) ----------
  const visited = new Set<string>();

  const expandForItem = (itemId: string, level: number) => {
    ensureItemNode(itemId, level);
    const visitKey = `${itemId}@${level}`;
    if (visited.has(visitKey)) return;
    visited.add(visitKey);

    const producers = actionsByOutput.get(itemId) ?? [];
    const it = itemCache.get(itemId);

    // Unknown chain: no producers and not base → insert placeholder chain
    if (producers.length === 0 && !isBaseItem(it)) {
      ensureUnknownChainFor(itemId, level);
      return;
    }

    // Expand each producer
    for (const act of producers) {
      const actionLevel = level - 1;
      const actionNode = ensureActionNode(act, actionLevel);

      // Action → current output item (use matching output's quantity; default 1)
      const out = (act.outputs ?? []).find(o => o.item?.id === itemId);
      addEdge(actionNode.id, itemId, out?.qty ?? 1);

      // For each input: item → action, then recurse (unless base)
      for (const inp of (act.inputs ?? [])) {
        const inItem = inp.item; if (!inItem?.id) continue;
        const inputLevel = level - 2;
        ensureItemNode(inItem.id, inputLevel);
        addEdge(inItem.id, actionNode.id, inp.qty ?? 1);

        if (!isBaseItem(inItem)) {
          expandForItem(inItem.id, inputLevel);
        } else {
          ensureItemNode(inItem.id, inputLevel); // ensure level bookkeeping
        }
      }
    }
  };

  // Seed: place target on the right (level 0) and expand
  expandForItem(targetItemId, 0);

  // ---------- Conflict annotation ----------
  const normQty = (q?: number | string) =>
    typeof q === 'string' ? (Number.isFinite(+q) ? +q : 1) : (q ?? 1);

  /**
   * Conflict rule:
   * For the same output (ItemId#Qty) AND the same set of input item *IDs* (ignoring input quantities),
   * if there exist at least two actions with *different* summed input quantities,
   * mark ONLY the output edges (action→item) for those actions as conflicted.
   * Merged actions are ignored for detection.
   */
  const annotateConflicts = () => {
    const nodeList = Array.from(nodes.values());
    const nodeById = new Map(nodeList.map(n => [n.id, n]));

    const inEdgesByAction  = new Map<string, EdgeEx[]>(); // item→action
    const outEdgesByAction = new Map<string, EdgeEx[]>(); // action→item
    const outGroups        = new Map<string, string[]>(); // "<targetItemId>#<qty>" -> actionIds[]

    // Index edges
    for (const e of edges) {
      const s = nodeById.get(e.source);
      const t = nodeById.get(e.target);
      if (!s || !t) continue;

      if (s.kind === 'item' && t.kind === 'action') {
        const arr = inEdgesByAction.get(t.id) ?? [];
        arr.push(e);
        inEdgesByAction.set(t.id, arr);
      }

      if (s.kind === 'action' && t.kind === 'item') {
        const arr = outEdgesByAction.get(s.id) ?? [];
        arr.push(e);
        outEdgesByAction.set(s.id, arr);

        const outKey = `${t.id}#${normQty(e.qty)}`;
        const acts = outGroups.get(outKey) ?? [];
        if (!acts.includes(s.id)) acts.push(s.id);
        outGroups.set(outKey, acts);
      }
    }

    // Signatures over inputs
    const buildIdOnlySig = (ins: EdgeEx[]) =>
      Array.from(new Set(ins.map(e => e.source))).sort().join('|');

    const buildQtySig = (ins: EdgeEx[]) => {
      const sums = new Map<string, number>();
      for (const e of ins) {
        const id = e.source;
        const q = normQty(e.qty);
        sums.set(id, (sums.get(id) ?? 0) + q);
      }
      return Array.from(sums.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, q]) => `${id}#${q}`)
        .join('|');
    };

    // For each output group, detect conflicts within identical input-ID sets
    for (const [outKey, actionIds] of outGroups.entries()) {
      if (actionIds.length < 2) continue;

      const byIdOnlySig = new Map<string, { aid: string; inQtySig: string }[]>();

      for (const aid of actionIds) {
        const actNode = nodeById.get(aid);
        if (!actNode || actNode.kind !== 'action' || actNode.__isMerged) continue;

        const ins = inEdgesByAction.get(aid) ?? [];
        if (ins.length === 0) continue; // skip actions with no inputs (e.g., Unknown)

        const idOnlySig = buildIdOnlySig(ins);
        const inQtySig  = buildQtySig(ins);
        const list = byIdOnlySig.get(idOnlySig) ?? [];
        list.push({ aid, inQtySig });
        byIdOnlySig.set(idOnlySig, list);
      }

      for (const rows of byIdOnlySig.values()) {
        if (rows.length < 2) continue;

        const uniqueQtySigs = new Set(rows.map(r => r.inQtySig));
        if (uniqueQtySigs.size > 1) {
          for (const { aid } of rows) {
            // mark ONLY the output edges contributing to this outKey
            for (const e of (outEdgesByAction.get(aid) ?? [])) {
              const tgt = nodeById.get(e.target);
              if (!tgt) continue;
              const eKey = `${tgt.id}#${normQty(e.qty)}`;
              if (eKey === outKey) e.conflict = true;
            }
          }
        }
      }
    }
  };

  annotateConflicts();

  // ---------- Layout (simple column/row packing by level) ----------
  const allLevels = Array.from(levelByNode.values());
  const minLevel = Math.min(...allLevels); // lowest (most left) level
  for (const n of nodes.values()) {
    const lvl = (levelByNode.get(n.id)! - minLevel);
    const x = O.baseX + lvl * O.colGap;
    const row = nextRowIndex.get(lvl) ?? 0;
    const y = 120 + row * O.rowGap;
    nextRowIndex.set(lvl, row + 1);
    n.x = x; n.y = y;
  }

  // Return as plain MiniNode/MiniEdge (extensions are compatible/optional)
  return { nodes: Array.from(nodes.values()), edges };
}
