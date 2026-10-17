/**
 * RFC 6901 JSON Pointers are the single addressing scheme across the engine:
 * store keys, error keys and field ids all use them. They are the same format
 * Ajv reports in `instancePath`, so errors map onto fields without translation.
 */
export type JsonPointer = '' | `/${string}`;

export const ROOT_POINTER: JsonPointer = '';

const INDEX_RE = /^(?:0|[1-9]\d*)$/;

export function escapeToken(token: string | number): string {
  return String(token).replace(/~/g, '~0').replace(/\//g, '~1');
}

export function unescapeToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function joinPointer(
  base: JsonPointer,
  ...tokens: readonly (string | number)[]
): JsonPointer {
  let pointer: string = base;
  for (const token of tokens) pointer += `/${escapeToken(token)}`;
  return pointer as JsonPointer;
}

export function parsePointer(pointer: JsonPointer): string[] {
  if (pointer === '') return [];
  if (pointer[0] !== '/') throw new Error(`Invalid JSON pointer: "${pointer}"`);
  return pointer.slice(1).split('/').map(unescapeToken);
}

/** True when `pointer` equals `ancestor` or addresses something inside it. */
export function isWithin(pointer: string, ancestor: string): boolean {
  return ancestor === '' || pointer === ancestor || pointer.startsWith(`${ancestor}/`);
}

export function getIn(target: unknown, pointer: JsonPointer): unknown {
  let current = target;
  for (const token of parsePointer(pointer)) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[token];
  }
  return current;
}

/**
 * Immutable write with structural sharing: only containers on the path are
 * copied, so untouched siblings keep their identity and their selectors do not
 * fire. Writing `undefined` to an object key removes the key. Missing
 * containers are created as arrays for index tokens and objects otherwise.
 */
export function setIn<T>(target: T, pointer: JsonPointer, value: unknown): T {
  return assign(target, parsePointer(pointer), 0, value) as T;
}

function assign(current: unknown, tokens: readonly string[], i: number, value: unknown): unknown {
  const token = tokens[i];
  if (token === undefined) return value;

  if (Array.isArray(current) || (!isObject(current) && (INDEX_RE.test(token) || token === '-'))) {
    const array: unknown[] = Array.isArray(current) ? current : [];
    const index = token === '-' ? array.length : Number(token);
    const prev = array[index];
    const next = assign(prev, tokens, i + 1, value);
    if (Object.is(prev, next) && index < array.length) return array;
    const copy = array.slice();
    copy[index] = next;
    return copy;
  }

  const object = (isObject(current) ? current : {}) as Record<string, unknown>;
  const prev = object[token];
  const next = assign(prev, tokens, i + 1, value);
  if (Object.is(prev, next)) return object;
  const copy = { ...object };
  if (next === undefined) delete copy[token];
  else copy[token] = next;
  return copy;
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}
