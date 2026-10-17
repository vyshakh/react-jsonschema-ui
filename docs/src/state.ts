import { type Sample, sampleById, samples } from '@react-jsonschema-ui/samples';
import { useReducer } from 'react';
import type { JSONSchema, UiSchema, ValidateMode } from 'react-jsonschema-ui';

export interface EditorState<T> {
  readonly text: string;
  /** Last successfully parsed value; kept while the text is invalid. */
  readonly value: T;
  readonly error: string | undefined;
}

export interface PlaygroundOptions {
  validateMode: ValidateMode;
  disabled: boolean;
  readOnly: boolean;
}

export interface PlaygroundState {
  readonly sample: Sample | undefined;
  readonly schema: EditorState<JSONSchema>;
  readonly uiSchema: EditorState<UiSchema>;
  readonly formData: EditorState<unknown>;
  /** Bumped when form data is replaced from outside the form, to rebuild the store. */
  readonly formVersion: number;
  readonly options: PlaygroundOptions;
}

type Action =
  | { type: 'loadSample'; sample: Sample }
  | { type: 'loadShared'; shared: SharedState }
  | { type: 'editSchema'; text: string }
  | { type: 'editUiSchema'; text: string }
  | { type: 'editFormData'; text: string }
  | { type: 'formChanged'; values: unknown }
  | { type: 'setOptions'; options: PlaygroundOptions };

export interface SharedState {
  schema: string;
  uiSchema: string;
  formData: string;
}

const stringify = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

function editor<T>(value: T): EditorState<T> {
  return { text: stringify(value), value, error: undefined };
}

function edit<T>(prev: EditorState<T>, text: string): EditorState<T> {
  try {
    return { text, value: JSON.parse(text) as T, error: undefined };
  } catch (error) {
    return { ...prev, text, error: error instanceof Error ? error.message : String(error) };
  }
}

const DEFAULT_OPTIONS: PlaygroundOptions = {
  validateMode: 'onBlur',
  disabled: false,
  readOnly: false,
};

function fromSample(sample: Sample, version: number, options: PlaygroundOptions): PlaygroundState {
  return {
    sample,
    schema: editor(sample.schema),
    uiSchema: editor(sample.uiSchema ?? {}),
    formData: editor(sample.formData ?? {}),
    formVersion: version,
    options,
  };
}

function reducer(state: PlaygroundState, action: Action): PlaygroundState {
  switch (action.type) {
    case 'loadSample':
      return fromSample(action.sample, state.formVersion + 1, state.options);
    case 'loadShared':
      return {
        ...state,
        sample: undefined,
        schema: edit(state.schema, action.shared.schema),
        uiSchema: edit(state.uiSchema, action.shared.uiSchema),
        formData: edit(state.formData, action.shared.formData),
        formVersion: state.formVersion + 1,
      };
    case 'editSchema':
      return { ...state, schema: edit(state.schema, action.text) };
    case 'editUiSchema':
      return { ...state, uiSchema: edit(state.uiSchema, action.text) };
    case 'editFormData': {
      const formData = edit(state.formData, action.text);
      // Only a parsed change replaces the form's values.
      const replaced = formData.error === undefined && formData.value !== state.formData.value;
      return { ...state, formData, formVersion: state.formVersion + (replaced ? 1 : 0) };
    }
    case 'formChanged':
      // Mirrors the form into the editor without rebuilding the form.
      return { ...state, formData: editor(action.values) };
    case 'setOptions':
      return { ...state, options: action.options };
  }
}

export function usePlayground(initial: { sampleId?: string; shared?: SharedState }) {
  return useReducer(reducer, initial, ({ sampleId, shared }) => {
    const base = fromSample(
      (sampleId && sampleById.get(sampleId)) || (samples[0] as Sample),
      0,
      DEFAULT_OPTIONS,
    );
    return shared ? reducer(base, { type: 'loadShared', shared }) : base;
  });
}

// --- Sharing: the editors' text travels in the URL hash -------------------------

export function encodeShared(shared: SharedState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(shared));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShared(encoded: string): SharedState | undefined {
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharedState>;
    if (typeof parsed.schema !== 'string') return undefined;
    return {
      schema: parsed.schema,
      uiSchema: parsed.uiSchema ?? '{}',
      formData: parsed.formData ?? '{}',
    };
  } catch {
    return undefined;
  }
}

export function readHash(): { sampleId?: string; shared?: SharedState } {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const state = params.get('state');
  const shared = state ? decodeShared(state) : undefined;
  if (shared) return { shared };
  const sampleId = params.get('sample');
  return sampleId ? { sampleId } : {};
}
