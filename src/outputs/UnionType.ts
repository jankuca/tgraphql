import { NamedType } from '../NamedType.abstract'
import { AnyObjectType } from './ObjectType'

export class UnionType<Name extends string, Ts extends ReadonlyArray<AnyObjectType>> extends NamedType<Name> {
  types: Ts
  constructor(typename: Name, types: Ts) {
    super(typename)
    this.types = types
  }
}

export function unionType<Name extends string, S extends ReadonlyArray<AnyObjectType>>(typename: Name, ...values: S) {
  return new UnionType(typename, values)
}

export type AnyUnionType = UnionType<string, ReadonlyArray<AnyObjectType>>

export type AnyUnionListType = [AnyUnionType] | [AnyUnionType, null]

export type UnionTypeNames<U extends AnyUnionType> = U['types'][number]['typename']

export type UnionTypeByName<U extends AnyUnionType, T extends UnionTypeNames<U>> = Extract<
  U['types'][number],
  { typename: T }
>
