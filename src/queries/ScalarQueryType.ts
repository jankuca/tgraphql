import { AnyType } from '../types/AnyType.type'

export class ScalarQueryType<ResolverType extends AnyType> {
  resolverType: ResolverType
  constructor(resolverType: ResolverType) {
    this.resolverType = resolverType
  }
}
