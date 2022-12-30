import { EnumValueType } from './EnumValueType'
import { NamedType } from './NamedType.abstract'

export class EnumType<Name extends string, Vs extends ReadonlyArray<string>> extends NamedType<Name> {
  values: Array<EnumValueType<Vs[number]>>
  constructor(typename: Name, values: Vs) {
    super(typename)
    this.values = values.map((value) => new EnumValueType(typename, value))
  }
}

export function enumType<Name extends string, S extends ReadonlyArray<string>>(typename: Name, ...values: S) {
  return new EnumType(typename, values)
}
