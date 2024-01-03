import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { Prettify } from '../types/Prettify.type'
import { ScalarType } from '../types/ScalarType.type'
import { InputObjectValue } from '../types/Value.type'

export type AnyParamType =
  | ScalarType
  | CustomScalarType<string, ScalarType>
  | EnumType<string, string[]>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
  | [AnyParamType]
  | [AnyParamType, null]

export type ParamValue<T extends AnyParamType> = T extends [infer I extends AnyParamType, null]
  ? ParamValue<
      // NOTE: Break infinite recursion
      Exclude<I, [AnyParamType, null]>
    > | null
  : T extends [infer I extends AnyParamType]
  ? Array<ParamValue<I>>
  : T extends InputObjectType<string, infer I extends Record<string, { type: AnyInputFieldType; optional: boolean }>>
  ? InputObjectValue<I>
  : T extends EnumType<string, infer Vs>
  ? Vs[number]
  : T extends EnumValueType<infer I>
  ? I
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends CustomScalarType<string, infer I>
  ? I extends ScalarType
    ? string
    : I
  : T extends ScalarType
  ? string
  : T

type ParamDescriptor<T extends { type: AnyParamType; optional: boolean }> = {
  type: T['type']
  optional: T['optional']
  defaultValue: ParamValue<T['type']> | undefined
}

export class ParamObjectType<S extends Record<string, ParamDescriptor<{ type: AnyParamType; optional: boolean }>>> {
  schema: S

  constructor(schema: S) {
    this.schema = schema
  }

  field<K extends string, T extends AnyParamType>(
    key: K,
    type: T,
    defaultValue?: ParamValue<T>
  ): ParamObjectType<Prettify<S & { [k in K]: ParamDescriptor<{ type: T; optional: false }> }>> {
    const newParam: ParamDescriptor<{ type: T; optional: false }> = { type, optional: false, defaultValue }
    return new ParamObjectType({
      ...this.schema,
      [key]: newParam,
    })
  }

  optionalField<K extends string, T extends AnyParamType>(
    key: K,
    type: T,
    defaultValue?: ParamValue<T>
  ): ParamObjectType<Prettify<S & { [k in K]: ParamDescriptor<{ type: T; optional: true }> }>> {
    const newParam: ParamDescriptor<{ type: T; optional: true }> = { type, optional: true, defaultValue }
    return new ParamObjectType({
      ...this.schema,
      [key]: newParam,
    })
  }

  listField<K extends string, Ts extends [AnyParamType] | [AnyParamType, null]>(
    key: K,
    itemTypes: Ts,
    defaultValue?: ParamValue<Ts>
  ): ParamObjectType<Prettify<S & { [k in K]: ParamDescriptor<{ type: Ts; optional: false }> }>> {
    const newParam: ParamDescriptor<{ type: Ts; optional: false }> = {
      type: itemTypes,
      optional: false,
      defaultValue,
    }
    return new ParamObjectType({
      ...this.schema,
      [key]: newParam,
    })
  }

  optionalListField<K extends string, Ts extends [AnyParamType] | [AnyParamType, null]>(
    key: K,
    itemTypes: Ts,
    defaultValue?: ParamValue<Ts>
  ): ParamObjectType<Prettify<S & { [k in K]: ParamDescriptor<{ type: Ts; optional: true }> }>> {
    const newParam: ParamDescriptor<{ type: Ts; optional: true }> = { type: itemTypes, optional: true, defaultValue }
    return new ParamObjectType({
      ...this.schema,
      [key]: newParam,
    })
  }
}

export type AnyParamObjectType = ParamObjectType<
  Record<string, ParamDescriptor<{ type: AnyParamType; optional: boolean }>>
>

type RequiredParamKeys<T extends Record<string, { optional: boolean }>> = {
  [key in keyof T]: T[key]['optional'] extends true ? never : key
}[keyof T]

export type ParamValues<P extends AnyParamObjectType> = P extends ParamObjectType<infer T>
  ? {
      [key in RequiredParamKeys<T>]: ParamValue<T[key]['type']>
    } & {
      [key in Exclude<keyof T, RequiredParamKeys<T>>]?: ParamValue<T[key]['type']> | null
    }
  : never
