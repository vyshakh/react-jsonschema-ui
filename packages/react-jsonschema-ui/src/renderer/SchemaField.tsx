import { memo, useMemo } from 'react';
import type { ArrayFieldNode, EnumOption, FieldNode, ObjectFieldNode } from '../parser/parse';
import { useArrayField, useField, useFormSelector } from '../react/hooks';
import { useRegistry } from '../registry/registry';
import type { ObjectProperty } from '../registry/types';
import { type JsonPointer, joinPointer } from '../utils/pointer';
import { toFieldId, useFormConfig } from './context';

export interface SchemaFieldProps {
  readonly node: FieldNode;
  readonly pointer: JsonPointer;
}

/**
 * Dispatches one node to its field adapter. Memoized on `(node, pointer)`,
 * both identity-stable (nodes come from the parse cache), so a parent
 * re-rendering never cascades into untouched children; each adapter
 * subscribes to the store slices it needs.
 */
export const SchemaField = memo(function SchemaField({ node, pointer }: SchemaFieldProps) {
  const { fields, templates } = useRegistry();
  if (node.hidden) return null;

  if (node.field !== undefined) {
    const Custom = fields[node.field];
    if (Custom) return <Custom node={node} pointer={pointer} />;
    const { UnsupportedField } = templates;
    return (
      <UnsupportedField node={node} pointer={pointer} reason={`Unknown field "${node.field}"`} />
    );
  }

  switch (node.kind) {
    case 'object':
      return <ObjectField node={node} pointer={pointer} />;
    case 'array':
      // An explicit `ui:widget` (e.g. checkboxes) renders the whole array as one input.
      return node.widget === 'array' ? (
        <ArrayField node={node} pointer={pointer} />
      ) : (
        <LeafField node={node} pointer={pointer} />
      );
    default:
      return <LeafField node={node} pointer={pointer} />;
  }
});

function LeafField({ node, pointer }: SchemaFieldProps) {
  const { widgets, templates } = useRegistry();
  const config = useFormConfig();
  const field = useField(pointer);
  const { FieldTemplate, UnsupportedField } = templates;
  const Widget = widgets[node.widget];
  if (!Widget) {
    return (
      <UnsupportedField
        node={node}
        pointer={pointer}
        reason={`No widget registered for "${node.widget}"`}
      />
    );
  }

  const id = toFieldId(config.idPrefix, pointer);
  return (
    <FieldTemplate
      id={id}
      pointer={pointer}
      node={node}
      label={node.title}
      description={node.description}
      help={node.help}
      required={node.required}
      errors={field.errors}
      touched={field.touched}
    >
      <Widget
        id={id}
        pointer={pointer}
        node={node}
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        label={node.title}
        placeholder={node.placeholder}
        required={node.required}
        disabled={config.disabled || node.disabled}
        readOnly={config.readOnly || node.readOnly}
        autofocus={node.autofocus}
        errors={field.errors}
        touched={field.touched}
        enumOptions={enumOptionsOf(node)}
        options={node.options}
      />
    </FieldTemplate>
  );
}

function enumOptionsOf(node: FieldNode): readonly EnumOption[] | undefined {
  const target = node.kind === 'array' ? node.items : node;
  return target.kind === 'object' || target.kind === 'array' ? undefined : target.enumOptions;
}

function ObjectField({ node, pointer }: { node: ObjectFieldNode; pointer: JsonPointer }) {
  const { ObjectTemplate } = useRegistry().templates;
  const { idPrefix } = useFormConfig();
  const errors = useFormSelector((state) => state.errors[pointer]);
  const properties = useMemo(
    () =>
      node.properties.map((child): ObjectProperty => {
        const name = child.name as string;
        const childPointer = joinPointer(pointer, name);
        return {
          name,
          pointer: childPointer,
          node: child,
          content: <SchemaField node={child} pointer={childPointer} />,
        };
      }),
    [node, pointer],
  );

  return (
    <ObjectTemplate
      id={toFieldId(idPrefix, pointer)}
      pointer={pointer}
      node={node}
      title={node.title}
      description={node.description}
      required={node.required}
      errors={errors}
      properties={properties}
    />
  );
}

function ArrayField({ node, pointer }: { node: ArrayFieldNode; pointer: JsonPointer }) {
  const { ArrayTemplate, ArrayItemTemplate } = useRegistry().templates;
  const config = useFormConfig();
  const { keys, errors, append, remove, move } = useArrayField(pointer);

  const { minItems = 0, maxItems = Number.POSITIVE_INFINITY } = node.schema;
  const { addable, removable, orderable } = node.options;
  const editable = !(config.disabled || config.readOnly || node.disabled || node.readOnly);
  const length = keys.length;
  const canRemove = editable && removable !== false && length > minItems;
  const canOrder = editable && orderable !== false;

  const items = keys.map((key, index) => {
    const itemPointer = joinPointer(pointer, index);
    return (
      <ArrayItemTemplate
        key={key}
        id={toFieldId(config.idPrefix, itemPointer)}
        pointer={itemPointer}
        index={index}
        length={length}
        node={node.items}
        canRemove={canRemove}
        canMoveUp={canOrder && index > 0}
        canMoveDown={canOrder && index < length - 1}
        onRemove={() => remove(index)}
        onMoveUp={() => move(index, index - 1)}
        onMoveDown={() => move(index, index + 1)}
      >
        <SchemaField node={node.items} pointer={itemPointer} />
      </ArrayItemTemplate>
    );
  });

  return (
    <ArrayTemplate
      id={toFieldId(config.idPrefix, pointer)}
      pointer={pointer}
      node={node}
      title={node.title}
      description={node.description}
      required={node.required}
      errors={errors}
      items={items}
      canAdd={editable && addable !== false && length < maxItems}
      onAdd={() => append()}
    />
  );
}
