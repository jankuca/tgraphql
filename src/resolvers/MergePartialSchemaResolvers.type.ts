import { AnySchemaType, EmptySchemaType } from '../SchemaType'
import { ObjectUnionToObjectIntersection } from '../types/ObjectUnionToObjectIntersection.type'

type FilterByKey<U, K extends string> = Extract<U, { [key in K]: any }>

export type MergePartialSchemaResolvers<
  // WARN: We must not use `extends PartialSchemaResolvers` here as it would not allow using
  //   `satisfies PartialSchemaResolvers` for resolver implemention with exact inferrence.
  Rs extends object,
  Schema extends AnySchemaType = EmptySchemaType
> = Omit<
  ObjectUnionToObjectIntersection<Rs>,
  Schema['Query']['typename'] | Schema['Mutation']['typename'] | Schema['Subscription']['typename']
> &
  ([FilterByKey<Rs, Schema['Query']['typename']>] extends [never]
    ? Record<never, any>
    : {
        [typename in Schema['Query']['typename']]: ObjectUnionToObjectIntersection<FilterByKey<Rs, typename>[typename]>
      }) &
  ([FilterByKey<Rs, Schema['Mutation']['typename']>] extends [never]
    ? Record<never, any>
    : {
        [typename in Schema['Mutation']['typename']]: ObjectUnionToObjectIntersection<
          FilterByKey<Rs, typename>[typename]
        >
      }) &
  ([FilterByKey<Rs, Schema['Subscription']['typename']>] extends [never]
    ? Record<never, any>
    : {
        [typename in Schema['Subscription']['typename']]: ObjectUnionToObjectIntersection<
          FilterByKey<Rs, typename>[typename]
        >
      })
