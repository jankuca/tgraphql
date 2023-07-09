import { MergePartialSchemaResolvers } from '../resolvers/MergePartialSchemaResolvers.type'
import { AnySchemaType } from '../SchemaType'

export function mergeResolvers<S extends AnySchemaType, T extends object[]>(params: {
  Schema: S
  resolvers: T
}): MergePartialSchemaResolvers<T[number]> {
  const { Schema, resolvers: modules } = params

  const queryTypename = Schema['Query']['typename']
  const mutationTypename = Schema['Mutation']['typename']
  const subscriptionTypename = Schema['Subscription']['typename']

  const queryResolvers = modules.reduce(
    (merged, partial) =>
      queryTypename in partial
        ? Object.assign(
            merged ?? {},
            // @ts-expect-error The key is there.
            partial[queryTypename]
          )
        : merged,
    null
  )
  const mutationResolvers = modules.reduce(
    (merged, partial) =>
      mutationTypename in partial
        ? Object.assign(
            merged ?? {},
            // @ts-expect-error The key is there.
            partial[mutationTypename]
          )
        : merged,
    null
  )
  const subscriptionResolvers = modules.reduce(
    (merged, partial) =>
      subscriptionTypename in partial
        ? Object.assign(
            merged ?? {},
            // @ts-expect-error The key is there.
            partial[subscriptionTypename]
          )
        : merged,
    null
  )

  const mergedResolvers = Object.assign({}, ...modules)
  if (queryResolvers) {
    mergedResolvers[queryTypename] = queryResolvers
  }
  if (mutationResolvers) {
    mergedResolvers[mutationTypename] = mutationResolvers
  }
  if (subscriptionResolvers) {
    mergedResolvers[subscriptionTypename] = subscriptionResolvers
  }

  return mergedResolvers
}
