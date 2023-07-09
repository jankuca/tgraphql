import { AnyObjectType, objectType } from './outputs/ObjectType'

export type SchemaEntrypoint = 'Query' | 'Mutation' | 'Subscription'

export class SchemaType<
  Query extends AnyObjectType,
  Mutation extends AnyObjectType,
  Subscription extends AnyObjectType
> {
  Query: Query
  Mutation: Mutation
  Subscription: Subscription

  constructor(queryType: Query, mutationType: Mutation, subscriptionType: Subscription) {
    this.Query = queryType
    this.Mutation = mutationType
    this.Subscription = subscriptionType
  }

  query<Q extends AnyObjectType>(type: Q): SchemaType<Q, Mutation, Subscription> {
    if (this.Query.typename !== 'Query') {
      throw new Error('Only types named "Query" can be used as the root Query entrypoint')
    }

    return new SchemaType(type, this.Mutation, this.Subscription)
  }

  mutation<M extends AnyObjectType>(type: M): SchemaType<Query, M, Subscription> {
    if (type.typename !== 'Mutation') {
      throw new Error('Only types named "Mutation" can be used as the root Mutation entrypoint')
    }

    return new SchemaType(this.Query, type, this.Subscription)
  }

  subscription<S extends AnyObjectType>(type: S): SchemaType<Query, Mutation, S> {
    if (type.typename !== 'Subscription') {
      throw new Error('Only types named "Subscription" can be used as the root Subscription entrypoint')
    }

    return new SchemaType(this.Query, this.Mutation, type)
  }
}

export function schemaType() {
  return new SchemaType(objectType('Query'), objectType('Mutation'), objectType('Subscription'))
}

export type EmptySchemaType = ReturnType<typeof schemaType>

export type AnySchemaType = SchemaType<AnyObjectType, AnyObjectType, AnyObjectType>
