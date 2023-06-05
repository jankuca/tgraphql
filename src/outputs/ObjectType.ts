import { NamedType } from '../NamedType.abstract'
import { AnyType } from '../types/AnyType.type'
import { Prettify } from '../types/Prettify.type'
import { AnyParamObjectType, ParamObjectType } from './ParamObjectType'

export class ObjectType<
  Name extends string,
  S extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> extends NamedType<Name> {
  schema: S
  constructor(typename: Name, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<Name, Prettify<S & { [k in K]: { type: T; optional: false; params: AnyParamObjectType | null } }>> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false, params: null },
    })
  }

  paramField<K extends string, Params extends ParamObjectType<Record<string, any>>, T extends AnyType>(
    key: K,
    paramBuilder: (params: ParamObjectType<Record<never, any>>) => Params,
    type: T
  ): ObjectType<Name, Prettify<S & { [k in K]: { type: T; optional: false; params: Params } }>> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false, params: paramBuilder(new ParamObjectType({})) },
    })
  }

  optionalField<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<Name, Prettify<S & { [k in K]: { type: T; optional: true; params: AnyParamObjectType | null } }>> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: true, params: null },
    })
  }

  listField<K extends string, Ts extends [AnyType] | [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<Name, Prettify<S & { [k in K]: { type: Ts; optional: false; params: AnyParamObjectType | null } }>> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false, params: null },
    })
  }

  listParamField<
    K extends string,
    Params extends ParamObjectType<Record<string, any>>,
    Ts extends [AnyType] | [AnyType, null]
  >(
    key: K,
    paramBuilder: (params: ParamObjectType<Record<never, any>>) => Params,
    itemTypes: Ts
  ): ObjectType<Name, Prettify<S & { [k in K]: { type: Ts; optional: false; params: Params } }>> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false, params: paramBuilder(new ParamObjectType({})) },
    })
  }

  optionalListField<K extends string, Ts extends [AnyType] | [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<Name, Prettify<S & { [k in K]: { type: Ts; optional: true; params: AnyParamObjectType | null } }>> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: true, params: null },
    })
  }
}

export function objectType<Name extends string>(typename: Name) {
  return new ObjectType(typename, {})
}

export type AnyObjectType = ObjectType<
  string,
  Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
>

export type AnyObjectListType = [AnyObjectType] | [AnyObjectType, null]
