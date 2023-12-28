import { AnyObjectType } from '../outputs/ObjectType'
import { AnyUnionType, UnionTypeNames } from '../outputs/UnionType'
import { AnySchemaType } from '../SchemaType'
import { Prettify } from '../types/Prettify.type'
import { Value } from '../types/Value.type'
import { AutoresolvedEntityNames } from './AutoresolvedEntityNames.type'
import { ObjectFieldGeneratorResolver, ObjectFieldResolver } from './Resolver.type'
import { SchemaEntities } from './SchemaEntities.type'
import { SchemaObjectTypeResolver } from './SchemaObjectTypeResolver.type'
import { SchemaObjectTypes } from './SchemaObjectTypes.type'
import { SchemaUnionTypes } from './SchemaUnionTypes.type'
import { UnionResolver } from './UnionResolver.type'

/**
 * Type that can be used to implement a complete set of resolvers for a schema.
 */
export type CompleteSchemaResolvers<
  Schema extends AnySchemaType,
  Entities extends SchemaEntities<Schema> = never,
  Context = never
> = Prettify<
  // Auto-resolved entities (see above) are not required to have dedicated resolvers.
  {
    [typename in Exclude<
      Extract<keyof SchemaObjectTypes<Schema>, string>,
      | AutoresolvedEntityNames<Schema, Entities>
      | Schema['Query']['typename']
      | Schema['Mutation']['typename']
      | Schema['Subscription']['typename']
    >]: SchemaObjectTypes<Schema>[typename] extends AnyObjectType
      ? SchemaObjectTypeResolver<Schema, typename, Entities, Context>
      : never
  } & {
    // Unresolved entities are required to have dedicated resolvers.
    [typename in Extract<
      keyof SchemaObjectTypes<Schema>,
      AutoresolvedEntityNames<Schema, Entities>
    >]?: SchemaObjectTypes<Schema>[typename] extends AnyObjectType
      ? SchemaObjectTypeResolver<Schema, typename, Entities, Context>
      : never
  } & {
    // Unions are never considered auto-resolved.
    [typename in Extract<
      keyof SchemaUnionTypes<Schema>,
      string
    >]: SchemaUnionTypes<Schema>[typename] extends AnyUnionType
      ? UnionResolver<
          Value<SchemaUnionTypes<Schema>[typename]>,
          UnionTypeNames<SchemaUnionTypes<Schema>[typename]>,
          Context
        >
      : never
  } & // Define Query/Mutation/Subscription resolvers only when they have fields.
    (Schema['Query']['schema'] extends Record<never, any>
      ? Record<never, any>
      : {
          [typename in Schema['Query']['typename']]: SchemaObjectTypeResolver<Schema, typename, Entities, Context>
        }) &
    (Schema['Mutation']['schema'] extends Record<never, any>
      ? Record<never, any>
      : {
          [typename in Schema['Mutation']['typename']]: {
            [mutationField in keyof Schema['Mutation']['schema']]: ObjectFieldResolver<
              never,
              Schema['Mutation']['schema'][mutationField],
              Entities,
              Context
            >
          }
        }) &
    (Schema['Subscription']['schema'] extends Record<never, any>
      ? Record<never, any>
      : {
          [typename in Schema['Subscription']['typename']]: {
            [subscriptionField in keyof Schema['Subscription']['schema']]: {
              subscribe: ObjectFieldGeneratorResolver<
                never,
                Schema['Subscription']['schema'][subscriptionField],
                Entities,
                Context
              >
            }
          }
        })
>
