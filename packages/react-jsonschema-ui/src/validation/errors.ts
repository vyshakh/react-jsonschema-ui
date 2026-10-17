import { isWithin } from '../utils/pointer';
import type { ErrorMap, FieldError } from './types';

export const EMPTY_ERRORS: ErrorMap = Object.freeze({});

export function toErrorMap(errors: readonly FieldError[]): ErrorMap {
  if (errors.length === 0) return EMPTY_ERRORS;
  const map: Record<string, string[]> = {};
  for (const { pointer, message } of errors) {
    const messages = map[pointer];
    if (!messages) map[pointer] = [message];
    else if (!messages.includes(message)) messages.push(message);
  }
  return map;
}

export function hasErrorsWithin(errors: ErrorMap, pointer: string): boolean {
  for (const key in errors) if (isWithin(key, pointer)) return true;
  return false;
}

/**
 * Replaces only the entries at or below `pointer`, leaving errors elsewhere
 * untouched, so fields the user has not interacted with stay quiet.
 */
export function replaceErrorsWithin(prev: ErrorMap, next: ErrorMap, pointer: string): ErrorMap {
  const merged: Record<string, readonly string[]> = {};
  for (const key in prev) if (!isWithin(key, pointer)) merged[key] = prev[key] as readonly string[];
  for (const key in next) if (isWithin(key, pointer)) merged[key] = next[key] as readonly string[];
  return shareErrors(prev, merged);
}

/**
 * Structural sharing for error maps: keeps the previous array when a field's
 * messages did not change, and the previous map when nothing changed, so a
 * per-field selector only re-renders the fields whose errors changed.
 */
export function shareErrors(prev: ErrorMap, next: ErrorMap): ErrorMap {
  const nextKeys = Object.keys(next);
  if (nextKeys.length === 0) return Object.keys(prev).length === 0 ? prev : EMPTY_ERRORS;
  let same = nextKeys.length === Object.keys(prev).length;
  const result: Record<string, readonly string[]> = {};
  for (const key of nextKeys) {
    const before = prev[key];
    const after = next[key] as readonly string[];
    if (before && arraysEqual(before, after)) {
      result[key] = before;
    } else {
      result[key] = after;
      same = false;
    }
  }
  return same ? prev : result;
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}
