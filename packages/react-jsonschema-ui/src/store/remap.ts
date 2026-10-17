import { escapeToken, isWithin, unescapeToken } from '../utils/pointer';

/**
 * Re-keys entries of a pointer-keyed map that live under array `arrayPointer`
 * after its items moved. `mapIndex` returns the new index, or `undefined` to
 * drop entries for a removed item. Returns `map` itself when nothing changed.
 */
export function mapKeysWithin<V>(
  map: Readonly<Record<string, V>>,
  arrayPointer: string,
  mapIndex: (index: number) => number | undefined,
): Readonly<Record<string, V>> {
  const prefix = `${arrayPointer}/`;
  let changed = false;
  const result: Record<string, V> = {};
  for (const key in map) {
    const value = map[key] as V;
    if (!key.startsWith(prefix)) {
      result[key] = value;
      continue;
    }
    const rest = key.slice(prefix.length);
    const slash = rest.indexOf('/');
    const token = unescapeToken(slash === -1 ? rest : rest.slice(0, slash));
    const next = mapIndex(Number(token));
    if (next === undefined) {
      changed = true;
      continue;
    }
    const newKey = prefix + escapeToken(next) + (slash === -1 ? '' : rest.slice(slash));
    if (newKey !== key) changed = true;
    result[newKey] = value;
  }
  return changed ? result : map;
}

export function removeKeysWithin<V>(
  map: Readonly<Record<string, V>>,
  pointer: string,
): Readonly<Record<string, V>> {
  let result: Record<string, V> | undefined;
  for (const key in map) {
    if (isWithin(key, pointer)) {
      result ??= { ...map };
      delete result[key];
    }
  }
  return result ?? map;
}

export function removeIndex(index: number, removed: number): number | undefined {
  if (index === removed) return undefined;
  return index > removed ? index - 1 : index;
}

export function moveIndex(index: number, from: number, to: number): number {
  if (index === from) return to;
  if (from < to && index > from && index <= to) return index - 1;
  if (from > to && index >= to && index < from) return index + 1;
  return index;
}
