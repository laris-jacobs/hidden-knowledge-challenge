import { Action, Item, Source } from '../models/input.model';
import { GraphResult, MiniNode, MiniEdge, GraphBuildOptions } from '../models/graph.models';

const IMG_ITEM_DEFAULT   = 'imgs/items/placeholder.png';
const IMG_ACTION_DEFAULT = 'imgs/recipes/placeholder.png';
// Hinweis: Für unknown-Knoten verwenden wir jetzt bewusst '' (kein Bild).
const IMG_UNKNOWN        = '';

// Defaults fürs Layout
const DEF_OPTS: Required<GraphBuildOptions> = {
  baseX: 120, colGap: 160, rowGap: 90,
  itemSize: { w: 72,  h: 72 },
  actionSize: { w: 108, h: 108 },
  unknownItemImg: IMG_UNKNOWN,          // leer
  defaultItemImg: IMG_ITEM_DEFAULT,
  defaultActionImg: IMG_ACTION_DEFAULT,
};

export function buildKnowledgeGraphStatic(
  actions: Action[],
  targetItemId: string,
  opts: GraphBuildOptions = {}
): GraphResult {
  const O = { ...DEF_OPTS, ...opts };

  // --- Indizes & Caches (nur lokal in dieser Funktion) ---
  const actionsByOutput = new Map<string, Action[]>(); // itemId -> Actions, die dieses Item ausgeben
  const itemCache = new Map<string, Item>();           // bekannte Items aus inputs/outputs
  const nodes = new Map<string, MiniNode>();
  const edges: MiniEdge[] = [];
  const levelByNode = new Map<string, number>();       // für Spaltenlayout
  const nextRowIndex = new Map<number, number>();      // Level -> y-Reihe

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

  // ---------- Hilfsfunktionen ----------
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
    if (it.base_harvest != null) return true;
    return false;
  };

  const addEdge = (sourceId: string, targetId: string, qty: number) => {
    if (!edges.some(e => e.source === sourceId && e.target === targetId && e.qty === qty)) {
      edges.push({ source: sourceId, target: targetId, qty });
    }
  };

  const ensureItemNode = (itemId: string, level: number, label?: string, markUnknown = false): MiniNode => {
    const ex = nodes.get(itemId);
    const it = itemCache.get(itemId);
    const name = label ?? it?.name ?? itemId;
    const base = isBase(it);

    if (ex) {
      const prev = levelByNode.get(itemId) ?? level;
      if (level < prev) levelByNode.set(itemId, level);
      if (markUnknown) { ex.isUnknown = true; ex.label = `${name} (unknown)`; ex.img = ''; } // <- kein Bild
      if (base) ex.isBase = true;
      return ex;
    }

    const node: MiniNode = {
      id: itemId,
      label: markUnknown ? `${name} (unknown)` : name,
      kind: 'item',
      trust: 0.95,                 // neutral für Items
      sourceName: 'Aggregated',
      img: markUnknown ? '' : O.defaultItemImg, // <- unknown: leer
      x: 0, y: 0, w: O.itemSize.w, h: O.itemSize.h,
      isUnknown: markUnknown,
      isBase: base,
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
    trust: number,
    sourceName: string,
    customLabel?: string,
    imgOverride?: string | null
  ): MiniNode => {
    const id = act.id ?? `act_${Math.random().toString(36).slice(2)}`;
    const ex = nodes.get(id);
    if (ex) {
      const prev = levelByNode.get(id) ?? level;
      if (level < prev) levelByNode.set(id, level);
      return ex;
    }
    const node: MiniNode = {
      id,
      label: customLabel ?? buildActionLabel(act),
      kind: 'action',
      trust,
      sourceName,
      img: (imgOverride ?? undefined) !== undefined ? (imgOverride ?? '') : O.defaultActionImg, // erlaubte leere img
      x: 0, y: 0, w: O.actionSize.w, h: O.actionSize.h,
    };
    nodes.set(id, node);
    levelByNode.set(id, level);
    return node;
  };

  // Unknown-Kette: unknownItem -> unknownAction -> missingItem
  const ensureUnknownChainFor = (missingItemId: string, itemLevelHint: number) => {
    const itemLevel = levelByNode.get(missingItemId) ?? itemLevelHint;
    const actLevel = itemLevel - 1;
    const unkActId = `act_${missingItemId}_unknown`;
    const unkItemId = `unknown_input_for_${missingItemId}`;

    // Unknown Action (ohne img)
    const unkAct: Action = {
      id: unkActId,
      inputs: [],
      outputs: [],
      sources: [],
      image_url: '',
      station: '',
      action_type_id: 'unknown'
    };
    ensureActionNode(unkAct, actLevel, 0.5, 'Unknown', 'Unknown source', ''); // img ''

    // Unknown Item (ohne img)
    ensureItemNode(
      unkItemId,
      actLevel + 1,
      'Unknown Item',
      true // markUnknown true -> img ''
    );

    // Kanten: unknownItem -> unknownAction -> missingItem
    addEdge(unkItemId, unkActId, 1);
    addEdge(unkActId, missingItemId, 1);
  };

  // ---------- Rekursion: von Ziel-Item rückwärts expandieren ----------
  const expandForItem = (itemId: string, levelFromInputs: number): boolean => {
    const producers = actionsByOutput.get(itemId) ?? [];
    const produced = producers.length > 0;

    // Ziel-/Output-Item sicherstellen (liegt rechts von seiner Action)
    ensureItemNode(itemId, levelFromInputs + 1);

    for (const act of producers) {
      const { trust, sourceName } = bestSource(act.sources);
      const actLevel = levelFromInputs; // Action links vom Output-Item
      const actNode = ensureActionNode(act, actLevel, trust, sourceName);

      // Kante: Action -> Output (nur die zum gewünschten Output)
      const out = (act.outputs ?? []).find(o => o.item?.id === itemId);
      addEdge(actNode.id, itemId, out?.qty ?? 1);

      // Inputs: Item -> Action
      for (const inp of (act.inputs ?? [])) {
        const inItem = inp.item; if (!inItem?.id) continue;
        ensureItemNode(inItem.id, actLevel + 1);
        addEdge(inItem.id, actNode.id, inp.qty ?? 1);

        const hasProducer = expandForItem(inItem.id, actLevel + 1);
        if (!hasProducer && !isBase(inItem)) {
          // NEU: ganze Unknown-Kette für dieses Input-Item
          // 1) fehlendes Item als (unknown) kennzeichnen, ohne Bild
          ensureItemNode(inItem.id, actLevel + 1, inItem.name, /*markUnknown*/ true);
          // 2) Unknown-Kette unknownItem -> unknownAction -> inItem
          ensureUnknownChainFor(inItem.id, actLevel + 1);
        }
      }
    }

    return produced;
  };

  // Starte beim Ziel
  const targetHasProducer = expandForItem(targetItemId, 0);

  // Falls das Ziel selbst keinen Producer hat & nicht Base → komplette Unknown-Kette
  const tItem = itemCache.get(targetItemId);
  const tIsBase = isBase(tItem);
  const tNode = ensureItemNode(targetItemId, 1, tItem?.name ?? targetItemId, /*markUnknown*/ !targetHasProducer && !tIsBase);

  if (!targetHasProducer && !tIsBase) {
    // komplette Unknown-Kette für das Ziel
    ensureUnknownChainFor(targetItemId, 1);
    // Ziel-Node sicher als unknown ohne Bild
    tNode.isUnknown = true;
    tNode.label = `${tNode.label}`;
    tNode.img = ''; // kein Bild
  }

  // ---------- Einfaches Spalten-Layout ----------
  const levels = Array.from(levelByNode.values());
  const minLevel = Math.min(...levels);
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
