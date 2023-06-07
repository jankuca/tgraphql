import { AnySchemaType } from '../SchemaType'
import { Resolver } from './Resolver.type'
import { SchemaEntities } from './SchemaEntities.type'
import { SchemaObjectTypes } from './SchemaObjectTypes.type'

export type SchemaObjectTypeResolver<
  Schema extends AnySchemaType,
  typename extends string,
  Entities extends SchemaEntities<Schema>,
  Context
> = Resolver<
  Entities[typename] extends object
    ? Entities[typename]
    : typename extends Schema['Query']['typename']
    ? never
    : typename extends Schema['Mutation']['typename']
    ? never
    : typename extends Schema['Subscription']['typename']
    ? never
    : SchemaObjectTypes<Schema>[typename],
  SchemaObjectTypes<Schema>[typename],
  Entities,
  Context
>
