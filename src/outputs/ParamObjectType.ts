import { CustomScalarType } from '../CustomScalarType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { ScalarType } from '../types/ScalarType.type'

export type AnyParamType =
  | ScalarType
  | CustomScalarType<string, ScalarType>
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
  | [AnyParamType]
  | [AnyParamType, null]

type ParamValue<T extends AnyParamType> = T extends [infer I extends AnyParamType, null]
  ? Array<ParamValue<I>>
  : T extends [infer I extends AnyParamType]
  ? Array<ParamValue<I>>
  : T extends EnumValueType<infer I>
  ? I
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T

type ParamDescriptor<T extends { type: AnyParamType; optional: boolean }> = {
  type: T['type']
  optional: T['optional']
  defaultValue: true extends T['optional'] ? any : ParamValue<T['type']>
}

export class ParamObjectType<S extends Record<string, ParamDescriptor<{ type: AnyParamType; optional: boolean }>>> {
  schema: S

  constructor(schema: S) {
    this.schema = schema
  }

  field<K extends string, T extends AnyParamType>(
    key: K,
    type: T
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: T; optional: false }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type, optional: false, defaultValue: null },
    })
  }

  optionalField<K extends string, T extends AnyParamType>(
    key: K,
    type: T,
    defaultValue: ParamValue<T>
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: T; optional: true }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type, optional: true, defaultValue },
    })
  }

  listField<K extends string, Ts extends [AnyParamType] | [AnyParamType, null]>(
    key: K,
    itemTypes: Ts
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: Ts; optional: false }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type: itemTypes, optional: false, defaultValue: null },
    })
  }

  optionalListField<K extends string, Ts extends [AnyParamType] | [AnyParamType, null]>(
    key: K,
    itemTypes: Ts,
    defaultValue: ParamValue<Ts>
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: Ts; optional: true }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type: itemTypes, optional: true, defaultValue },
    })
  }
}

export type AnyParamObjectType = ParamObjectType<
  Record<string, ParamDescriptor<{ type: AnyParamType; optional: boolean }>>
>

export type ParamValues<P extends AnyParamObjectType> = P extends ParamObjectType<infer T>
  ? {
      [key in keyof T]: ParamValue<T[key]['type']>
    }
  : never
