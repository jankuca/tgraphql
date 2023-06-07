import { AnySchemaType, EmptySchemaType, SchemaType } from '../SchemaType'
import { ObjectUnionToObjectIntersection } from '../types/ObjectUnionToObjectIntersection.type'

type FilterByKey<U, K extends string> = Extract<U, { [key in K]: any }>

export type MergePartialSchemaResolvers<
  // WARN: We must not use `extends PartialSchemaResolvers` here as it would not allow using
  //   `satisfies PartialSchemaResolvers` for resolver implemention with exact inferrence.
  Rs extends object,
  S extends AnySchemaType = EmptySchemaType
> = S extends SchemaType<infer Q, infer M, infer S>
  ? Omit<ObjectUnionToObjectIntersection<Rs>, Q['typename'] | M['typename'] | S['typename']> &
      ([FilterByKey<Rs, Q['typename']>] extends [never]
        ? Record<never, any>
        : {
            [typename in Q['typename']]: ObjectUnionToObjectIntersection<FilterByKey<Rs, typename>[typename]>
          }) &
      ([FilterByKey<Rs, M['typename']>] extends [never]
        ? Record<never, any>
        : {
            [typename in M['typename']]: ObjectUnionToObjectIntersection<FilterByKey<Rs, typename>[typename]>
          }) &
      ([FilterByKey<Rs, S['typename']>] extends [never]
        ? Record<never, any>
        : {
            [typename in S['typename']]: ObjectUnionToObjectIntersection<FilterByKey<Rs, typename>[typename]>
          })
  : never
