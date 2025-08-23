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
  const addEdge = (sourceId: string, targetId: string, qty: number, conflict = false) => {
    const ex = edges.find(e => e.source === sourceId && e.target === targetId && e.qty === qty);
    if (ex) { (ex as any).conflict = (ex as any).conflict || conflict; return; }
    edges.push({ source: sourceId, target: targetId, qty, conflict } as any);
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
      if (base) (ex as any).isBase = true;
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
    } as any;
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
    } as any;

    // Merger-Flag für spätere Konflikt-Erkennung (nicht berücksichtigen)
    (node as any).__isMerged = (act.action_type_id === 'merged') || (id.startsWith('act_merged_'));

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

  // ---------- Konflikte annotieren ----------
  const normQty = (q?: number | string) =>
    typeof q === 'string' ? (Number.isFinite(+q) ? +q : 1) : (q ?? 1);

  /**
   * Konfliktregel:
   * Für denselben Output (ItemId#Qty) UND denselben Satz an Input-Item-IDs (ohne Mengen)
   * gibt es mindestens zwei Actions, deren Input-Mengen (Qty) sich unterscheiden.
   * Merged-Actions werden ignoriert.
   * Markiere NUR die Output-Kanten, die zu diesem Output gehören (kein Markieren anderer Outputs/Input-Kanten).
   */
  const annotateConflicts = () => {
    const nodeList = Array.from(nodes.values());
    const nodeById = new Map(nodeList.map(n => [n.id, n]));

    // actionId -> eingehende (item->action)
    const inEdgesByAction = new Map<string, MiniEdge[]>();
    // actionId -> ausgehende (action->item)
    const outEdgesByAction = new Map<string, MiniEdge[]>();
    // "<targetItemId>#<qty>" -> actionIds[] (identischer Output)
    const outGroups = new Map<string, string[]>();

    // Kanten indexieren
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

    // Signatur-Helfer
    const buildIdOnlySig = (ins: MiniEdge[]) => {
      const ids = Array.from(new Set(ins.map(e => e.source))).sort();
      return ids.join('|');
    };
    const buildQtySig = (ins: MiniEdge[]) => {
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

    // Für jede Output-Gruppe: gleiche Input-IDs aber unterschiedliche Input-Mengen?
    for (const [outKey, actionIds] of outGroups.entries()) {
      if (actionIds.length < 2) continue;

      // gruppiere innerhalb derselben Output-Gruppe nach identischem Input-ID-Satz
      const byIdOnlySig = new Map<string, { aid: string; inQtySig: string }[]>();

      for (const aid of actionIds) {
        const actNode = nodeById.get(aid);
        // Merged-Actions bei der Konflikterkennung auslassen
        if (!actNode || actNode.kind !== 'action' || (actNode as any).__isMerged) continue;

        const ins = inEdgesByAction.get(aid) ?? [];
        if (ins.length === 0) continue; // Actions ohne Inputs ignorieren (z. B. Unknown)

        const idOnlySig = buildIdOnlySig(ins);
        const inQtySig  = buildQtySig(ins);

        const list = byIdOnlySig.get(idOnlySig) ?? [];
        list.push({ aid, inQtySig });
        byIdOnlySig.set(idOnlySig, list);
      }

      // innerhalb einer Input-ID-Gruppe: mehrere unterschiedliche Mengen-Signaturen -> Konflikt
      for (const [idOnlySig, rows] of byIdOnlySig.entries()) {
        if (rows.length < 2) continue;

        const uniqueQtySigs = new Set(rows.map(r => r.inQtySig));
        if (uniqueQtySigs.size > 1) {
          const conflictKey = `conflict:${outKey}|in:${idOnlySig}`;

          for (const { aid } of rows) {
            const actNode = nodeById.get(aid);
            if (actNode?.kind === 'action') {
              (actNode as any).conflictKey = conflictKey;
            }
            // NUR die Output-Kanten markieren, die genau zu diesem outKey gehören
            for (const e of (outEdgesByAction.get(aid) ?? [])) {
              const tgt = nodeById.get(e.target);
              if (!tgt) continue;
              const eKey = `${tgt.id}#${normQty(e.qty)}`;
              if (eKey === outKey) (e as any).conflict = true;
            }
            // Input-Kanten NICHT markieren → verhindert rote Markierung bei anderen Outputs
          }
        }
      }
    }
  };

  annotateConflicts();

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
