import { NamedType } from './NamedType.abstract'
import { ScalarType } from './types/ScalarType.type'

export class CustomScalarType<Name extends string, T extends ScalarType> extends NamedType<Name> {
  type: T

  constructor(typename: Name, type: T) {
    super(typename)
    this.type = type
  }
}

export function scalarType<Name extends string, T extends ScalarType>(typename: Name, type: T) {
  return new CustomScalarType(typename, type)
}
