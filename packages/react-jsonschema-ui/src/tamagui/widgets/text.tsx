import { useCallback } from 'react';
import { Input, TextArea } from 'tamagui';
import type { Widget, WidgetProps } from '../../registry/types';

type InputType = 'text' | 'password' | 'email' | 'url' | 'date' | 'datetime-local' | 'time';

/** Props shared by every text-like input. */
function inputProps({
  id,
  placeholder,
  disabled,
  readOnly,
  autofocus,
  errors,
  onBlur,
}: WidgetProps<string | undefined>) {
  const invalid = errors !== undefined && errors.length > 0;
  return {
    id,
    disabled,
    readOnly,
    autoFocus: autofocus,
    onBlur,
    ...(placeholder !== undefined && {
      placeholder,
      placeholderTextColor: '$placeholderColor' as const,
    }),
    ...(invalid && {
      'aria-invalid': true,
      'aria-describedby': `${id}__errors`,
      borderColor: '$red8' as const,
    }),
  };
}

/**
 * Tamagui 2's Input takes web `type`s and maps them to the right native
 * keyboard / secureTextEntry on iOS and Android. An empty string clears the
 * value (`undefined`), so `required` is enforced on cleared fields.
 */
function createTextWidget(type: InputType): Widget<string | undefined> {
  function TextInputWidget(props: WidgetProps<string | undefined>) {
    const { value, onChange } = props;
    const onChangeText = useCallback(
      (text: string) => onChange(text === '' ? undefined : text),
      [onChange],
    );
    return (
      <Input type={type} value={value ?? ''} onChangeText={onChangeText} {...inputProps(props)} />
    );
  }
  TextInputWidget.displayName = `TextWidget(${type})`;
  return TextInputWidget;
}

export const TextWidget = createTextWidget('text');
export const PasswordWidget = createTextWidget('password');
export const EmailWidget = createTextWidget('email');
export const UrlWidget = createTextWidget('url');
/** `format: date` (YYYY-MM-DD) matches the browser's date input value directly. */
export const DateWidget = createTextWidget('date');

export function TextareaWidget(props: WidgetProps<string | undefined>) {
  const { value, onChange, options } = props;
  const onChangeText = useCallback(
    (text: string) => onChange(text === '' ? undefined : text),
    [onChange],
  );
  const rows = typeof options.rows === 'number' ? options.rows : 4;
  return (
    <TextArea rows={rows} value={value ?? ''} onChangeText={onChangeText} {...inputProps(props)} />
  );
}

/**
 * `format: date-time` needs an RFC 3339 instant, while the browser's
 * datetime-local input yields `YYYY-MM-DDTHH:mm` in local time. The widget
 * converts in both directions; anything unparsable is passed through as typed
 * so validation can report it.
 */
export function DateTimeWidget(props: WidgetProps<string | undefined>) {
  const { value, onChange } = props;
  const onChangeText = useCallback(
    (text: string) => onChange(text === '' ? undefined : localToIso(text)),
    [onChange],
  );
  return (
    <Input
      type="datetime-local"
      value={isoToLocal(value)}
      onChangeText={onChangeText}
      {...inputProps(props)}
    />
  );
}

/**
 * `format: time` is an RFC 3339 full-time (`HH:mm:ss` plus a UTC offset); the
 * browser's time input yields `HH:mm`. The widget completes it with seconds
 * and the device's current offset.
 */
export function TimeWidget(props: WidgetProps<string | undefined>) {
  const { value, onChange } = props;
  const onChangeText = useCallback(
    (text: string) => onChange(text === '' ? undefined : localToFullTime(text)),
    [onChange],
  );
  return (
    <Input
      type="time"
      value={value?.slice(0, 5) ?? ''}
      onChangeText={onChangeText}
      {...inputProps(props)}
    />
  );
}

export function localToFullTime(local: string, date = new Date()): string {
  if (!/^\d\d:\d\d(:\d\d)?$/.test(local)) return local;
  const withSeconds = local.length === 5 ? `${local}:00` : local;
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${withSeconds}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export function localToIso(local: string): string {
  if (!LOCAL_DATETIME.test(local)) return local;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? local : date.toISOString();
}

export function isoToLocal(iso: string | undefined): string {
  if (iso === undefined) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
