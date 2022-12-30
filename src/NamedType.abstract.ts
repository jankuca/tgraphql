export abstract class NamedType<Name extends string> {
  typename: Name
  constructor(typename: Name) {
    this.typename = typename
  }
}
