import { AnySchemaType } from '../SchemaType'
import { Prettify } from '../types/Prettify.type'
import { CompleteSchemaResolvers } from './CompleteSchemaResolvers.type'
import { ObjectFieldGeneratorResolver, ObjectFieldResolver } from './Resolver.type'
import { SchemaEntities } from './SchemaEntities.type'
import { SchemaObjectTypeResolver } from './SchemaObjectTypeResolver.type'

/**
 * Type that can be used to implement a part of resolvers for a schema.
 *
 * Use as `const resolvers = { … } satisfies PartialSchemaResolvers<…>` when implementing resolvers as multiple modules.
 */
export type SchemaResolvers<
  Schema extends AnySchemaType,
  Entities extends SchemaEntities<Schema> = never,
  Context = never
> = Partial<
  Prettify<
    // NOTE: Entry points (Query, Mutation, Subscription) are allowed to be defined in multiple places and merged.
    Omit<
      CompleteSchemaResolvers<Schema, Entities, Context>,
      Schema['Query']['typename'] | Schema['Mutation']['typename'] | Schema['Subscription']['typename']
    > & {
      [typename in Schema['Query']['typename']]: Partial<SchemaObjectTypeResolver<Schema, typename, Entities, Context>>
    } & {
      [typename in Schema['Mutation']['typename']]: Partial<{
        [mutationField in keyof Schema['Mutation']['schema']]: ObjectFieldResolver<
          never,
          Schema['Mutation']['schema'][mutationField],
          Entities,
          Context
        >
      }>
    } & {
      [typename in Schema['Subscription']['typename']]: Partial<{
        [subscriptionField in keyof Schema['Subscription']['schema']]: {
          subscribe: ObjectFieldGeneratorResolver<
            never,
            Schema['Subscription']['schema'][subscriptionField],
            Entities,
            Context
          >
        }
      }>
    }
  >
>
