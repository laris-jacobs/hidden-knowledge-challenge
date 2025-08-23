import { Action, Item, Source } from '../models/input.model';
import { GraphResult, MiniNode, MiniEdge, GraphBuildOptions } from '../models/graph.models';

const IMG_ITEM_DEFAULT   = 'imgs/items/placeholder.png';
const IMG_ACTION_DEFAULT = 'imgs/recipes/placeholder.png';

const DEF_OPTS: Required<GraphBuildOptions> = {
  baseX: 120, colGap: 160, rowGap: 90,
  itemSize: { w: 72,  h: 72 },
  actionSize: { w: 108, h: 108 },
  unknownItemImg: '',                       // unknown: kein Bild
  defaultItemImg: IMG_ITEM_DEFAULT,
  defaultActionImg: IMG_ACTION_DEFAULT,
};

export function buildKnowledgeGraphStatic(
  actionsInput: Action[],
  targetItemId: string,
  opts: GraphBuildOptions = {}
): GraphResult {
  const O = { ...DEF_OPTS, ...opts };

  // ---------- Utils ----------
  const parseTrust = (t?: string) => {
    const n = parseFloat((t ?? '').trim());
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
  };

  const bestSourceMeta = (sources?: Source[]) => {
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
    return it.base_harvest != null;
  };

  // Für IO-Signaturen (Merge)
  const normalizeIO = (list?: { item?: Item; qty?: number }[]) =>
    (list ?? [])
      .map(x => ({ id: x.item?.id ?? '', qty: x.qty ?? 1 }))
      .filter(x => !!x.id)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(x => `${x.id}#${x.qty}`)
      .join('|');

  const signatureForAction = (act: Action) => {
    const inKey  = normalizeIO(act.inputs as any);
    const outKey = normalizeIO(act.outputs as any);
    return `IN:${inKey}||OUT:${outKey}`;
  };

  const dedupeSources = (arr: Source[] = []) => {
    const map = new Map<string, Source>();
    for (const s of arr) {
      const k = s.id ?? `${s.name}-${s.trust}`;
      const prev = map.get(k);
      if (!prev || parseTrust(s.trust) > parseTrust(prev.trust)) map.set(k, s);
    }
    return Array.from(map.values());
  };

  // ---------- Merge-Phase ----------
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
    let best = acts[0], bestT = bestSourceMeta(best.sources).trust;
    for (const a of acts.slice(1)) {
      const t = bestSourceMeta(a.sources).trust;
      if (t > bestT) { best = a; bestT = t; }
    }
    const combinedSources = dedupeSources(acts.flatMap(a => a.sources ?? []));
    const sample = acts[0];
    const merged: Action = {
      id: sample.id ?? `act_merged_${Math.random().toString(36).slice(2)}`,
      action_type_id: sample.action_type_id ?? 'merged',
      image_url: best.image_url && best.image_url.trim() ? best.image_url : (sample.image_url ?? ''),
      inputs: sample.inputs ? JSON.parse(JSON.stringify(sample.inputs)) : [],
      outputs: sample.outputs ? JSON.parse(JSON.stringify(sample.outputs)) : [],
      sources: combinedSources,
      station: sample.station ?? '',
    };
    mergedActions.push(merged);
  }

  // --- Indizes & Caches ---
  const actionsByOutput = new Map<string, Action[]>(); // itemId -> gemergte Actions, die dieses Item ausgeben
  const itemCache = new Map<string, Item>();           // bekannte Items
  const nodes = new Map<string, MiniNode>();
  const edges: MiniEdge[] = [];
  const levelByNode = new Map<string, number>();
  const nextRowIndex = new Map<number, number>();

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

  // ---------- Helpers für Nodes/Edges ----------
  const addEdge = (sourceId: string, targetId: string, qty: number) => {
    if (!edges.some(e => e.source === sourceId && e.target === targetId && e.qty === qty)) {
      edges.push({ source: sourceId, target: targetId, qty });
    }
  };

  const ensureItemNode = (
    itemId: string,
    level: number,
    label?: string,
    overrides?: Partial<Pick<MiniNode, 'img' | 'isUnknown' | 'isBase'>>
  ): MiniNode => {
    const ex = nodes.get(itemId);
    const it = itemCache.get(itemId);
    const name = label ?? it?.name ?? itemId;
    const base = overrides?.isBase ?? isBase(it);
    const img = (overrides?.img !== undefined)
      ? (overrides.img ?? '')
      : (it?.image_url && it.image_url.trim() ? it.image_url : O.defaultItemImg);

    if (ex) {
      const prev = levelByNode.get(itemId) ?? level;
      if (level < prev) levelByNode.set(itemId, level);
      if (overrides) Object.assign(ex, overrides);
      if (base) ex.isBase = true;
      return ex;
    }

    const node: MiniNode = {
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

  const buildActionLabel = (act: Action) =>
    (act.inputs ?? []).map(i => `${i.qty ?? 1} ${i.item?.name ?? i.item?.id ?? 'Unknown'}`).join(' + ')
    || (act.station ?? act.action_type_id ?? 'Action');

  const ensureActionNode = (
    act: Action,
    level: number,
    customLabel?: string,
    imgOverride?: string | null
  ): MiniNode => {
    const id = act.id ?? `act_${Math.random().toString(36).slice(2)}`;
    const ex = nodes.get(id);
    const { trust, sourceName } = bestSourceMeta(act.sources);

    if (ex) {
      const prev = levelByNode.get(id) ?? level;
      if (level < prev) levelByNode.set(id, level);
      return ex;
    }
    const img = (imgOverride ?? undefined) !== undefined
      ? (imgOverride ?? '')
      : (act.image_url && act.image_url.trim() ? act.image_url : O.defaultActionImg);

    const node: MiniNode = {
      id,
      label: customLabel ?? buildActionLabel(act),
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

  // Unknown-Kette: unknown_input_for_<item> -> act_<item>_unknown -> <item>
  const ensureUnknownChainFor = (missingItemId: string, itemLevel: number) => {
    const actLevel = itemLevel - 1;
    const unkActId = `act_${missingItemId}_unknown`;
    const unkItemId = `unknown_input_for_${missingItemId}`;

    // Unknown Action (ohne image url)
    const unkAct: Action = {
      id: unkActId,
      inputs: [],
      outputs: [],
      sources: [],
      image_url: '',               // bewusst leer
      station: '',
      action_type_id: 'unknown',
    };
    ensureActionNode(unkAct, actLevel, 'Unknown source', ''); // img ''

    // Unknown Item (ohne image url)
    ensureItemNode(unkItemId, actLevel - 1, 'Unknown Item', { img: '', isUnknown: true });

    // Kanten
    addEdge(unkItemId, unkActId, 1);
    addEdge(unkActId, missingItemId, 1);
  };

  // ---------- Rekursion (rechts -> links) ----------
  // Konvention:
  //   Item auf Level L
  //   Producer-Action auf Level L-1
  //   Deren Input-Items auf Level L-2
  const visited = new Set<string>();

  const expandForItem = (itemId: string, level: number) => {
    ensureItemNode(itemId, level);
    const visitKey = `${itemId}@${level}`;
    if (visited.has(visitKey)) return;
    visited.add(visitKey);

    const producers = actionsByOutput.get(itemId) ?? [];

    // Unknown-Logik: keine Producer & kein Base → Unknown-Kette einfügen
    const it = itemCache.get(itemId);
    if (producers.length === 0 && !isBase(it)) {
      ensureUnknownChainFor(itemId, level);
      // Bei Unknown-Items keinen weiteren Abstieg
      return;
    }

    // Producer vorhanden: expandieren
    for (const act of producers) {
      const actionLevel = level - 1;
      const actionNode = ensureActionNode(act, actionLevel);

      // Action -> dieses Output-Item (nur passende Menge)
      const out = (act.outputs ?? []).find(o => o.item?.id === itemId);
      addEdge(actionNode.id, itemId, out?.qty ?? 1);

      // Inputs: Item -> Action und rekursiv weiter
      for (const inp of (act.inputs ?? [])) {
        const inItem = inp.item; if (!inItem?.id) continue;
        const inputLevel = level - 2;
        ensureItemNode(inItem.id, inputLevel);
        addEdge(inItem.id, actionNode.id, inp.qty ?? 1);

        if (!isBase(inItem)) {
          expandForItem(inItem.id, inputLevel);
        } else {
          ensureItemNode(inItem.id, inputLevel);
        }
      }
    }
  };

  // Start: Ziel-Item rechts (Level 0)
  expandForItem(targetItemId, 0);

  // ---------- Layout ----------
  const allLevels = Array.from(levelByNode.values());
  const minLevel = Math.min(...allLevels);
  for (const n of nodes.values()) {
    const lvl = (levelByNode.get(n.id)! - minLevel);
    const x = O.baseX + lvl * O.colGap;
    const row = nextRowIndex.get(lvl) ?? 0;
    const y = 120 + row * O.rowGap;
    nextRowIndex.set(lvl, row + 1);
    n.x = x; n.y = y;
  }

  return { nodes: Array.from(nodes.values()), edges };
}
