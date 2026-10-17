import { Button, Form, Label, Paragraph, SizableText, XStack, YStack } from 'tamagui';
import type {
  ArrayItemTemplateProps,
  ArrayTemplateProps,
  FieldTemplateProps,
  FormTemplateProps,
  ObjectTemplateProps,
  SubmitButtonProps,
  Templates,
  UnsupportedFieldProps,
} from '../registry/types';

/** Widgets that render their own label next to the control. */
const INLINE_LABEL_WIDGETS = new Set(['checkbox', 'switch']);

export function FormTemplate({ children, onSubmit }: FormTemplateProps) {
  return (
    <Form onSubmit={onSubmit} gap="$4">
      {children}
    </Form>
  );
}

export function FieldTemplate({
  id,
  node,
  label,
  description,
  help,
  required,
  errors,
  children,
}: FieldTemplateProps) {
  const showLabel = label !== undefined && !INLINE_LABEL_WIDGETS.has(node.widget);
  return (
    <YStack gap="$1.5">
      {showLabel && <FieldLabel htmlFor={id} label={label} required={required} />}
      {description !== undefined && <Description text={description} />}
      {children}
      <Errors id={id} errors={errors} />
      {help !== undefined && (
        <SizableText size="$2" color="$color10">
          {help}
        </SizableText>
      )}
    </YStack>
  );
}

export function ObjectTemplate({
  pointer,
  title,
  description,
  errors,
  properties,
}: ObjectTemplateProps) {
  const nested = pointer !== '';
  return (
    <YStack
      gap="$3"
      {...(nested && {
        borderWidth: 1,
        borderColor: '$borderColor',
        borderRadius: '$4',
        padding: '$3',
      })}
    >
      {title !== undefined && (
        <SizableText size={nested ? '$5' : '$7'} fontWeight="600">
          {title}
        </SizableText>
      )}
      {description !== undefined && <Description text={description} />}
      {properties.map((property) => (
        <YStack key={property.name}>{property.content}</YStack>
      ))}
      <Errors id={pointer} errors={errors} />
    </YStack>
  );
}

export function ArrayTemplate({
  id,
  title,
  description,
  errors,
  items,
  canAdd,
  onAdd,
}: ArrayTemplateProps) {
  return (
    <YStack gap="$2">
      {title !== undefined && (
        <SizableText size="$5" fontWeight="600">
          {title}
        </SizableText>
      )}
      {description !== undefined && <Description text={description} />}
      {items}
      <Errors id={id} errors={errors} />
      {canAdd && (
        <Button
          size="$3"
          alignSelf="flex-start"
          onPress={onAdd}
          aria-label={`Add item to ${title ?? id}`}
        >
          + Add
        </Button>
      )}
    </YStack>
  );
}

export function ArrayItemTemplate({
  index,
  children,
  canRemove,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ArrayItemTemplateProps) {
  const position = `item ${index + 1}`;
  return (
    <XStack gap="$2" alignItems="flex-start">
      <YStack flex={1}>{children}</YStack>
      {(canMoveUp || canMoveDown) && (
        <>
          <Button
            size="$3"
            chromeless
            disabled={!canMoveUp}
            onPress={onMoveUp}
            aria-label={`Move ${position} up`}
          >
            ↑
          </Button>
          <Button
            size="$3"
            chromeless
            disabled={!canMoveDown}
            onPress={onMoveDown}
            aria-label={`Move ${position} down`}
          >
            ↓
          </Button>
        </>
      )}
      {canRemove && (
        <Button
          size="$3"
          chromeless
          theme="red"
          onPress={onRemove}
          aria-label={`Remove ${position}`}
        >
          ✕
        </Button>
      )}
    </XStack>
  );
}

export function SubmitButton({ label, disabled, onSubmit }: SubmitButtonProps) {
  // `onPress` rather than a native submit: one code path for web and native,
  // and Tamagui's web Button is `type="button"`, so the form never double-submits.
  return (
    <Button theme="accent" alignSelf="flex-start" disabled={disabled} onPress={onSubmit}>
      {label}
    </Button>
  );
}

export function UnsupportedField({ pointer, reason }: UnsupportedFieldProps) {
  return (
    <YStack theme="yellow" backgroundColor="$background" borderRadius="$3" padding="$2">
      <SizableText size="$2" color="$color11">
        {`Unsupported field ${pointer || '(root)'}: ${reason}`}
      </SizableText>
    </YStack>
  );
}

export function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} size="$3" lineHeight="$3">
      {required ? `${label} *` : label}
    </Label>
  );
}

function Description({ text }: { text: string }) {
  return (
    <Paragraph size="$2" color="$color10">
      {text}
    </Paragraph>
  );
}

function Errors({ id, errors }: { id: string; errors: readonly string[] | undefined }) {
  if (!errors || errors.length === 0) return null;
  return (
    <YStack role="alert" id={`${id}__errors`}>
      {errors.map((error) => (
        <SizableText key={error} size="$2" theme="red" color="$color10">
          {error}
        </SizableText>
      ))}
    </YStack>
  );
}

export const tamaguiTemplates: Templates = {
  FormTemplate,
  FieldTemplate,
  ObjectTemplate,
  ArrayTemplate,
  ArrayItemTemplate,
  SubmitButton,
  UnsupportedField,
};
