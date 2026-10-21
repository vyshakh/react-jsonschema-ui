import { useCallback } from 'react';
import { Checkbox, Label, SizableText, Switch, XStack } from 'tamagui';
import type { WidgetProps } from '../../registry/types';

// Checkbox and switch render their own label beside the control; the field
// template skips its label for these widgets.

export function CheckboxWidget({
  id,
  value,
  onChange,
  onBlur,
  label,
  required,
  disabled,
  readOnly,
}: WidgetProps<boolean | undefined>) {
  const onCheckedChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      onChange(checked === true);
      onBlur();
    },
    [onChange, onBlur],
  );
  return (
    <XStack gap="2" alignItems="center">
      <Checkbox
        id={id}
        size="md"
        checked={value === true}
        onCheckedChange={onCheckedChange}
        disabled={disabled || readOnly}
      >
        <Checkbox.Indicator>
          <SizableText size="3">✓</SizableText>
        </Checkbox.Indicator>
      </Checkbox>
      {label !== undefined && (
        <Label htmlFor={id} size="3">
          {required ? `${label} *` : label}
        </Label>
      )}
    </XStack>
  );
}

export function SwitchWidget({
  id,
  value,
  onChange,
  onBlur,
  label,
  required,
  disabled,
  readOnly,
}: WidgetProps<boolean | undefined>) {
  const onCheckedChange = useCallback(
    (checked: boolean) => {
      onChange(checked);
      onBlur();
    },
    [onChange, onBlur],
  );
  return (
    <XStack gap="3" alignItems="center">
      <Switch
        id={id}
        size="sm"
        checked={value === true}
        onCheckedChange={onCheckedChange}
        disabled={disabled || readOnly}
      >
        <Switch.Thumb />
      </Switch>
      {label !== undefined && (
        <Label htmlFor={id} size="3">
          {required ? `${label} *` : label}
        </Label>
      )}
    </XStack>
  );
}
