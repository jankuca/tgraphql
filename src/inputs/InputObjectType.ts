import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { NamedType } from '../NamedType.abstract'
import { ScalarType } from '../types/ScalarType.type'

export type AnyInputFieldType =
  | ScalarType
  | EnumType<string, ReadonlyArray<string>>
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
  | [AnyInputFieldType]
  | [AnyInputFieldType, null]

export class InputObjectType<
  Name extends string,
  S extends Record<string, { type: AnyInputFieldType; optional: boolean }>
> extends NamedType<Name> {
  schema: S
  constructor(typename: Name, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyInputFieldType>(
    key: K,
    type: T
  ): InputObjectType<Name, S & { [k in K]: { type: T; optional: false } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false },
    })
  }

  optionalField<K extends string, T extends AnyInputFieldType>(
    key: K,
    type: T
  ): InputObjectType<Name, S & { [k in K]: { type: T; optional: true } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: true },
    })
  }

  listField<K extends string, Ts extends [AnyInputFieldType] | [AnyInputFieldType, null]>(
    key: K,
    itemTypes: Ts
  ): InputObjectType<Name, S & { [k in K]: { type: Ts; optional: false } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false },
    })
  }

  optionalListField<K extends string, Ts extends [AnyInputFieldType] | [AnyInputFieldType, null]>(
    key: K,
    itemTypes: Ts
  ): InputObjectType<Name, S & { [k in K]: { type: Ts; optional: true } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: true },
    })
  }
}

export function inputType<Name extends string>(typename: Name) {
  return new InputObjectType(typename, {})
}
