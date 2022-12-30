type ScalarType = 'ID' | 'String' | 'Int' | 'Float' | 'Bool'

abstract class NamedType<Name extends string> {
  typename: Name
  constructor(typename: Name) {
    this.typename = typename
  }
}

class ObjectType<
  Name extends string,
  S extends Record<string, { type: AnyType; optional: boolean }>
> extends NamedType<Name> {
  schema: S
  constructor(typename: Name, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<Name, S & { [k in K]: { type: T; optional: false } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false },
    })
  }

  optionalField<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<Name, S & { [k in K]: { type: T; optional: true } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: true },
    })
  }

  listField<K extends string, Ts extends readonly [AnyType] | readonly [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<Name, S & { [k in K]: { type: Ts; optional: false } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false },
    })
  }

  optionalListField<K extends string, Ts extends readonly [AnyType] | readonly [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<Name, S & { [k in K]: { type: Ts; optional: true } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: true },
    })
  }
}

class EnumValueType<S extends string> {
  enumTypeName: string
  value: S
  constructor(enumTypeName: string, value: S) {
    this.enumTypeName = enumTypeName
    this.value = value
  }
}

class EnumType<Name extends string, Vs extends ReadonlyArray<string>> extends NamedType<Name> {
  values: Array<EnumValueType<Vs[number]>>
  constructor(typename: Name, values: Vs) {
    super(typename)
    this.values = values.map((value) => new EnumValueType(typename, value))
  }
}

class UnionType<Name extends string, Ts extends ReadonlyArray<AnyObjectType>> extends NamedType<Name> {
  types: Ts
  constructor(typename: Name, types: Ts) {
    super(typename)
    this.types = types
  }
}

type AnyInputValueType =
  | ScalarType
  | EnumType<string, ReadonlyArray<string>>
  | EnumValueType<string>
  | ObjectType<AnyInputValueType, string, Record<string, { type: AnyInputValueType; optional: boolean }>>

function objectType<Name extends string>(typename: Name) {
  return new ObjectType(typename, {})
}
function enumType<Name extends string, S extends ReadonlyArray<string>>(typename: Name, ...values: S) {
  return new EnumType(typename, values)
}
function unionType<Name extends string, S extends ReadonlyArray<AnyObjectType>>(typename: Name, ...values: S) {
  return new UnionType(typename, values)
}

const CatchupAccessLevelEnum = enumType('CatchupAccessLevelEnum', 'owner', 'participant', 'viewer', 'denied')

const User = objectType('User').field('id', 'ID').field('name', 'String').field('joined_at', 'String')

const PseudoUser = objectType('PseudoUser').field('id', 'ID').field('name', 'String').field('origin_user', User)

const AnyUser = unionType('AnyUser', User, PseudoUser)

const Attendee = objectType('Attendee')
  .field('id', 'ID')
  .field('user', AnyUser)
  .optionalField('maybe_user', AnyUser)
  .field('access_level', CatchupAccessLevelEnum)
  .optionalField('maybe_access_level', CatchupAccessLevelEnum)

const Catchup = objectType('Catchup')
  .field('id', 'ID')
  .optionalField('name', 'String')
  .optionalField('author', User)
  .listField('attendees', [Attendee])

const Query = objectType('Query').listField('recentCatchups', [Catchup])

type AnyType =
  | ObjectType<string, Record<string, { type: AnyType; optional: boolean }>>
  | EnumType<string, ReadonlyArray<string>>
  | UnionType<string, ReadonlyArray<AnyObjectType>>
  | ScalarType
  | EnumValueType<string>
  | [AnyType]
  | [AnyType, null]

type ObjectValue<S extends Record<string, { type: AnyType; optional: boolean }>> = {
  [key in keyof S]: S[key]['optional'] extends true ? Value<S[key]['type']> | null : Value<S[key]['type']>
}

type Value<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? Array<Value<I>>
  : T extends [infer I extends AnyType]
  ? Array<Value<I>>
  : T extends EnumType<string, infer I>
  ? I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? Value<I[number]>
  : T extends EnumValueType<infer I>
  ? I
  : T extends ObjectType<string, infer I>
  ? ObjectValue<I>
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T

// Testing:
// type U = Value<typeof User>
// type A = Value<typeof Attendee>
// type C = Value<typeof Catchup>
// type Cs = Value<[typeof Catchup]>
// type E = Value<typeof CatchupAccessLevelEnum>
// type OA = ObjectValue<typeof Attendee['schema']>

type Resolver<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? () => Array<Value<I> | null>
  : T extends [infer I extends AnyType]
  ? () => Array<Value<I>>
  : T extends EnumType<string, infer I>
  ? () => I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? () => Resolver<I[number]>
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<string, infer I>
  ? { [key in keyof I]: () => I[key]['optional'] extends true ? Value<I[key]['type']> | null : Value<I[key]['type']> }
  : T extends ScalarType
  ? () => string
  : T

// Testing:
// type URs = Resolver<typeof User>
// type ARs = Resolver<typeof Attendee>
// type CRs = Resolver<typeof Catchup>

type SchemaResolvers<Q extends ObjectType<'Query', any>> = { Query: Resolver<Q> }

// --- DEMO: ---

type CatchupModel = { 'id': string; 'name': string | null }
type AttendeeModel = {
  'id': string
  'catchup_id': string
  'user_id': string
  'access_level': 'owner' | 'participant' | 'viewer'
}
type UserModel = { 'id': string; 'name': string }

function listRecentCatchups(): Value<[typeof Catchup]> {
  const catchupModels: Array<CatchupModel> = [{ 'id': 'c1', 'name': 'Catchup 1' }]
  const attendeeModels: Array<Omit<AttendeeModel, 'catchup_id'> & { 'user_name': UserModel['name'] }> = [
    { 'id': 'a1', 'user_id': 'u1', 'access_level': 'owner', 'user_name': 'User 1' },
    { 'id': 'a2', 'user_id': 'u2', 'access_level': 'viewer', 'user_name': 'User 2' },
  ]

  const authorAttendee = attendeeModels.find((attendeeModel) => attendeeModel['access_level'] === 'owner')

  return catchupModels.map((catchupModel) => ({
    ...catchupModel,
    'author': authorAttendee
      ? { 'id': authorAttendee['user_id'], 'name': authorAttendee['user_name'], 'joined_at': '2022-10-10' }
      : { 'id': 'author-id', 'name': 'Author', 'joined_at': '2022-10-10' },
    'attendees': attendeeModels.map((attendeeModel) => {
      const { 'user_id': userId, 'user_name': userName, ...attendee } = attendeeModel
      return {
        ...attendee,
        'maybe_user': null,
        'maybe_access_level': null,
        'user': { 'id': userId, 'name': userName, 'joined_at': '2022-10-10' },
      }
    }),
  }))
}

function createResolvers(): SchemaResolvers<typeof Query> {
  return {
    Query: {
      recentCatchups: listRecentCatchups,
    },
  }
}

function generateSchemaString(rootType: AnyType): string {
  const { hoisted } = generateSchemaPart(rootType)
  return Object.values(hoisted).join('\n\n')
}

function generateSchemaPart(type: AnyType | AnyInputValueType): { hoisted: Record<string, string>; inline: string } {
  if (Array.isArray(type)) {
    const { hoisted, inline } = generateSchemaPart(type[0])
    return { hoisted, inline: `[${inline}${type[1] === null ? '' : '!'}]` }
  }

  if (type instanceof EnumValueType) {
    return { hoisted: {}, inline: type.value }
  }

  if (type instanceof EnumType) {
    return {
      hoisted: {
        [type.typename]: [
          `enum ${type.typename} {`,
          ...type.values.map((enumValue) => `  ${enumValue.value}`),
          '}',
        ].join('\n'),
      },
      inline: type.typename,
    }
  }

  if (type instanceof UnionType) {
    const hoisted: Record<string, string> = {}
    const names: Array<string> = []

    type.types.forEach((unionType) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(unionType)
      Object.assign(hoisted, hoistedParts)
      names.push(inline)
    })

    hoisted[type.typename] = `union ${type.typename} = ${names.join(' | ')}`

    return { hoisted, inline: type.typename }
  }

  if (type instanceof ObjectType) {
    const hoisted: Record<string, string> = {}
    const schemaStringParts: Array<string> = [`type ${type.typename} {`]

    Object.entries(type.schema).forEach(([key, fieldDesc]) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(fieldDesc.type)
      Object.assign(hoisted, hoistedParts)
      schemaStringParts.push(`  ${key}: ${inline}${fieldDesc.optional ? '' : '!'}`)
    })
    schemaStringParts.push('}')
    hoisted[type.typename] = schemaStringParts.join('\n')

    return { hoisted, inline: type.typename }
  }

  // ScalarType
  return { hoisted: {}, inline: type }
}

// createResolvers()
console.log(generateSchemaString(Query))

// Queries

class ScalarQueryType<ResolverType extends AnyType> {
  resolverType: ResolverType
  constructor(resolverType: ResolverType) {
    this.resolverType = resolverType
  }
}

class UnionQueryType<
  ResolverType extends AnyUnionType,
  UnionQueries extends Record<UnionTypeNames<ResolverType>, AnyObjectQueryType>
> {
  resolverTypeUnion: ResolverType
  queries: UnionQueries
  constructor(resolverType: ResolverType, queries: UnionQueries) {
    this.resolverTypeUnion = resolverType
    this.queries = queries
  }
}

type AnyUnionType = UnionType<string, ReadonlyArray<AnyObjectType>>
type AnyObjectType = ObjectType<string, Record<string, { type: AnyType; optional: boolean }>>
type AnyObjectListType = [AnyObjectType] | [AnyObjectType, null]

type AnyScalarType = Exclude<AnyType, AnyObjectType | [...any]>
type AnyScalarListType = [AnyScalarType] | [AnyScalarType, null]
type AnyUnionListType = [AnyUnionType] | [AnyUnionType, null]

type AnyObjectQueryType = ObjectQueryType<
  ObjectType<string, Record<string, { type: AnyType; optional: boolean }>>,
  Record<string, { type: AnyInputValueType; optional: boolean }>,
  Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>,
  Record<string, { key: string; type: AnyScalarType; optional: boolean }>,
  Record<string, { key: string; type: AnyScalarListType; optional: boolean }>,
  Record<string, { key: string; type: AnyObjectType; optional: boolean }>,
  Record<string, { key: string; type: AnyObjectListType; optional: boolean }>,
  Record<string, { key: string; type: AnyUnionType; optional: boolean }>,
  Record<string, { key: string; type: AnyUnionListType; optional: boolean }>
>
type AnyUnionQueryType = UnionQueryType<AnyUnionType, Record<string, AnyObjectQueryType>>
type AnyNodeQueryType = AnyObjectQueryType | ScalarQueryType<AnyType> | AnyUnionQueryType
type AnyQueryType = AnyNodeQueryType | [AnyNodeQueryType] | [AnyNodeQueryType, null]

type FilterScalarResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
    ? never
    : Schema[K]['type'] extends AnyUnionType
    ? never
    : Schema[K]['type'] extends [...any]
    ? never
    : { key: K; type: Schema[K]['type']; optional: Schema[K]['optional'] }
}

type ScalarResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterScalarResolvers<ResolverType['schema']>[keyof FilterScalarResolvers<
    ResolverType['schema']
  >]['key']]: FilterScalarResolvers<ResolverType['schema']>[key]
}

type FilterObjectResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional'] }
    : never
}

type ObjectResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterObjectResolvers<ResolverType['schema']>[keyof FilterObjectResolvers<
    ResolverType['schema']
  >]['key']]: FilterObjectResolvers<ResolverType['schema']>[key]
}

type FilterUnionResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyUnionType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional'] }
    : never
}

type UnionResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterUnionResolvers<ResolverType['schema']>[keyof FilterUnionResolvers<
    ResolverType['schema']
  >]['key']]: FilterUnionResolvers<ResolverType['schema']>[key]
}

type FilterScalarListResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends [...any]
    ? Schema[K]['type'] extends AnyObjectListType
      ? never
      : { key: K; type: Schema[K]['type']; optional: Schema[K]['optional'] }
    : never
}

type ScalarListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterScalarListResolvers<ResolverType['schema']>[keyof FilterScalarListResolvers<
    ResolverType['schema']
  >]['key']]: FilterScalarListResolvers<ResolverType['schema']>[key]
}

type FilterObjectListResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectListType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional'] }
    : never
}

type ObjectListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterObjectListResolvers<ResolverType['schema']>[keyof FilterObjectListResolvers<
    ResolverType['schema']
  >]['key']]: FilterObjectListResolvers<ResolverType['schema']>[key]
}

type FilterUnionListResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyUnionListType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional'] }
    : never
}

type UnionListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterUnionListResolvers<ResolverType['schema']>[keyof FilterUnionListResolvers<
    ResolverType['schema']
  >]['key']]: FilterUnionListResolvers<ResolverType['schema']>[key]
}

type UnionTypeNames<U extends AnyUnionType> = U['types'][number]['typename']

type UnionTypeByName<U extends AnyUnionType, T extends UnionTypeNames<U>> = Extract<U['types'][number], { typename: T }>

type UnionSubqueries<U extends AnyUnionType, Factories extends UnionSubqueryFactories<U, any>> = {
  [T in UnionTypeNames<U>]: ReturnType<Factories[T]>
}

type UnionSubqueryFactories<
  U extends AnyUnionType,
  Variables extends Record<string, { type: AnyInputValueType; optional: boolean }>
> = {
  [T in UnionTypeNames<U>]: (
    subquery: ObjectQueryTypeOf<UnionTypeByName<U, T>, Variables>
  ) => ObjectQueryTypeOf<
    UnionTypeByName<U, T>,
    Variables,
    Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>
  >
}

type ObjectQueryTypeOf<
  ResolverType extends AnyObjectType,
  Variables extends Record<string, { type: AnyInputValueType; optional: boolean }>,
  QuerySchema extends Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }> = Record<
    never,
    any
  >
> = ObjectQueryType<
  ResolverType,
  Variables,
  QuerySchema,
  ScalarResolvers<ResolverType>,
  ScalarListResolvers<ResolverType>,
  ObjectResolvers<ResolverType>,
  ObjectListResolvers<ResolverType>,
  UnionResolvers<ResolverType>,
  UnionListResolvers<ResolverType>
>

class ObjectQueryType<
  ResolverType extends AnyObjectType,
  Variables extends Record<string, { type: AnyInputValueType; optional: boolean }>,
  QuerySchema extends Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>,
  Fields extends ScalarResolvers<ResolverType>,
  ListFields extends ScalarListResolvers<ResolverType>,
  ObjectFields extends ObjectResolvers<ResolverType>,
  ObjectListFields extends ObjectListResolvers<ResolverType>,
  UnionFields extends UnionResolvers<ResolverType>,
  UnionListFields extends UnionListResolvers<ResolverType>
> {
  resolverType: ResolverType
  schema: QuerySchema
  variables: Variables

  constructor(resolverType: ResolverType, schema: QuerySchema, variables: Variables) {
    this.resolverType = resolverType
    this.schema = schema
    this.variables = variables
  }

  field<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>,
    ListSubquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => ListSubquery
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: [ListSubquery]; params: Record<never, any> } }
  >

  field<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>,
    ObjectSubquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => ObjectSubquery
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: ObjectSubquery; params: Record<never, any> } }
  >

  field<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: {
        query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
        params: Record<never, any>
      }
    }
  >

  field<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: {
        query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
        params: Record<never, any>
      }
    }
  >

  field<K extends Extract<keyof ListFields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: [ScalarQueryType<ListFields[K]['type'][0]>]; params: Record<never, any> } }
  >

  field<K extends Extract<keyof Fields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: ScalarQueryType<Fields[K]['type']>; params: Record<never, any> } }
  >

  field(key: Extract<keyof ResolverType['schema'], string>, makeSubquery: any): any {
    const schema = this.resolverType.schema
    const fieldDesc = schema[key]
    if (!fieldDesc) throw new Error(`Field ${key} does not exist`)

    const fieldType = fieldDesc.type

    if (Array.isArray(fieldType)) {
      return fieldType[0] instanceof ObjectType
        ? this._objectListField(key, makeSubquery)
        : fieldType[0] instanceof UnionType
        ? this._unionListField(key, makeSubquery)
        : this._scalarListField(key)
    }

    return fieldType instanceof ObjectType
      ? this._objectField(key, makeSubquery)
      : fieldType instanceof UnionType
      ? this._unionField(key, makeSubquery)
      : this._scalarField(key)
  }

  _scalarField<K extends Extract<keyof Fields, string>>(key: K) {
    const schema = this.resolverType.schema as Fields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: ScalarQueryType<Fields[K]['type']>; params: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: new ScalarQueryType(fieldDesc.type), params: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _scalarListField<K extends Extract<keyof ListFields, string>>(key: K) {
    const schema = this.resolverType.schema as ListFields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [ScalarQueryType<ListFields[K]['type']>]; params: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [new ScalarQueryType(fieldDesc.type)], params: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _objectField<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>,
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => Subquery) {
    const schema = this.resolverType.schema as ObjectFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type, {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: Subquery; params: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: subquery, params: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _objectListField<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; params: Record<string, AnyInputValueType> }>,
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => Subquery) {
    const schema = this.resolverType.schema as ObjectListFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type[0], {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [Subquery]; params: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [subquery], params: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _unionField<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(key: K, makeSubqueries: SubqueryFactories) {
    const schema = this.resolverType.schema as UnionFields
    const fieldDesc = schema[key]

    const types = fieldDesc.type.types as Union['types']

    const unionQuery = new UnionQueryType(
      fieldDesc.type,
      Object.fromEntries(
        types.map((objectType) => {
          const emptySubquery = new ObjectQueryType(objectType, {}, this.variables)
          const makeSubquery = makeSubqueries[objectType.typename as UnionTypeNames<Union>]
          if (!makeSubquery) throw new Error(`Missing subquery for union type ${objectType.typename}`)
          // @ts-expect-error
          return [objectType.typename, makeSubquery(emptySubquery)]
        })
      ) as UnionSubqueries<Union, SubqueryFactories>
    )

    // @ts-expect-error
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: {
          query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
          params: Record<never, any>
        }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: unionQuery, params: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _unionListField<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(key: K, makeSubqueries: SubqueryFactories) {
    const schema = this.resolverType.schema as UnionListFields
    const fieldDesc = schema[key]

    const types = fieldDesc.type[0].types as Union['types']

    const unionQuery = new UnionQueryType(
      fieldDesc.type[0],
      Object.fromEntries(
        types.map((objectType) => {
          const emptySubquery = new ObjectQueryType(objectType, {}, this.variables)
          const makeSubquery = makeSubqueries[objectType.typename as UnionTypeNames<Union>]
          if (!makeSubquery) throw new Error(`Missing subquery for union type ${objectType.typename}`)
          // @ts-expect-error
          return [objectType.typename, makeSubquery(emptySubquery)]
        })
      ) as UnionSubqueries<Union, SubqueryFactories>
    )

    // @ts-expect-error
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: {
          query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
          params: Record<never, any>
        }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [unionQuery], params: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  variable<K extends string, T extends AnyInputValueType>(key: K, type: T) {
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables & { [key in K]: { type: T; optional: false } },
      QuerySchema
    > = new ObjectQueryType(this.resolverType, this.schema, {
      ...this.variables,
      [key]: { type, optional: false },
    })

    return nextQueryType
  }

  optionalVariable<K extends string, T extends AnyInputValueType>(key: K, type: T) {
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables & { [key in K]: { type: T; optional: true } },
      QuerySchema
    > = new ObjectQueryType(this.resolverType, this.schema, {
      ...this.variables,
      [key]: { type, optional: true },
    })

    return nextQueryType
  }
}

function queryType() {
  return new ObjectQueryType(Query, {}, {})
}

function generateQueryString<Q extends AnyObjectQueryType>(queryType: Q): string {
  return ['query', generateQueryVariableString(queryType), generateQueryStringPart(queryType)].filter(Boolean).join(' ')
}

function generateQueryVariableString<Q extends AnyObjectQueryType>(queryType: Q): string {
  const variableEntries = Object.entries(queryType.variables)
  if (variableEntries.length === 0) {
    return ''
  }

  return [
    '(',
    variableEntries
      .map(
        ([key, fieldDesc]) => `$${key}: ${generateSchemaPart(fieldDesc.type).inline}${fieldDesc.optional ? '' : '!'}`
      )
      .join(', '),
    ')',
  ].join('')
}

function generateQueryStringPart<Q extends AnyQueryType>(queryType: Q): string {
  if (Array.isArray(queryType)) {
    return generateQueryStringPart(queryType[0])
  }

  if (queryType instanceof UnionQueryType) {
    const fragments = Object.entries(queryType.queries).map(([typename, subqueryType]) => {
      return [`... on ${typename}`, generateQueryStringPart(subqueryType).trim()].join(' ')
    })

    return ['{', ...fragments.map((fragment) => fragment.replace(/^/gm, '  ')), '}'].join('\n')
  }

  if (queryType instanceof ObjectQueryType) {
    const fields = Object.entries(queryType.schema).map(([key, subqueryType]) => {
      return `${key} ${generateQueryStringPart(subqueryType.query).replace(/^/gm, '  ').trim()}`.trim()
    })

    return ['{', ...fields.map((key) => `  ${key}`), '}'].join('\n')
  }

  if (queryType instanceof ScalarQueryType) {
    return ''
  }

  throw new Error('Unknown query')
}

type QueryResult<Q extends AnyQueryType> = Q extends [infer T extends AnyObjectQueryType]
  ? Array<QueryResult<T>>
  : Q extends [infer T extends AnyUnionQueryType]
  ? Array<QueryResult<T>>
  : Q extends UnionQueryType<any, infer SubQ extends UnionSubqueries<AnyUnionType, any>>
  ? QueryResult<SubQ[keyof SubQ]>
  : Q extends ObjectQueryType<infer ResolverType, any, infer QuerySchema, any, any, any, any, any, any>
  ? {
      [K in keyof QuerySchema]:
        | QueryResult<QuerySchema[K]['query']>
        | (K extends keyof ResolverType['schema']
            ? ResolverType['schema'][K]['optional'] extends true
              ? null
              : never
            : never)
    }
  : Q extends [infer T extends ScalarQueryType<AnyType>]
  ? Array<QueryResult<T>>
  : Q extends ScalarQueryType<infer T>
  ? Value<T>
  : never

function useQuery<Q extends AnyObjectQueryType>(queryType: Q): { data: QueryResult<Q> } {
  const gql = generateQueryString(queryType)
  console.log(gql)
  return { data: {} } as any
}

// --- DEMO: ---

const q = new ObjectQueryType(Catchup, {}, {})
type QFields = keyof ScalarResolvers<typeof q.resolverType>
type QObjectLists = keyof ObjectListResolvers<typeof q.resolverType>

// new ObjectQueryType(Query, {}).field('x')
// new ObjectQueryType(Query, {}).objectField('recentCatchups', (catchup) => catchup.field('id'))
// new ObjectQueryType(Query, {}).listField('recentCatchups')
new ObjectQueryType(Query, {}, {}).field('recentCatchups', (catchup) => catchup.field('id'))

type X = UnionResolvers<typeof Attendee>
type Y = ObjectListResolvers<typeof Catchup>
type Z = keyof ScalarResolvers<typeof Attendee>
type names = UnionTypeNames<typeof AnyUser>
type k = typeof AnyUser['types'][0]['typename']

const ListCatchups = queryType()
  .variable('x', 'Int')
  .field('recentCatchups', (catchup) =>
    catchup
      .field('id')
      .field('name')
      .field('author', (author) => author.field('name'))
      // .field('attendees', (attendee) =>
      //   attendee.field('access_level').field('user', (user) => user.field('id').field('name'))
      // )
      .field('attendees', (attendee) =>
        attendee
          .field('access_level')
          .field('user', {
            'User': (user) => user.field('id').field('name').field('joined_at'),
            'PseudoUser': (user) =>
              user
                .field('id')
                .field('name')
                .field('origin_user', (originUser) => originUser.field('id').field('name')),
          })
          .field('maybe_access_level')
          .field('maybe_user', {
            'User': (user) => user.field('id').field('name').field('joined_at'),
            'PseudoUser': (user) =>
              user
                .field('id')
                .field('name')
                .field('origin_user', (originUser) => originUser.field('id').field('name')),
          })
      )
  )

type Vars = typeof ListCatchups['variables']
const nestedQ = ListCatchups.schema.recentCatchups.query[0].schema.attendees.query[0]
type NestedVars = typeof nestedQ['variables']

const queryData = useQuery(ListCatchups).data
queryData.recentCatchups[0]?.attendees[0]?.user.name
const u = queryData.recentCatchups[0]?.attendees[0]?.user
queryData.recentCatchups[0]?.attendees[0]?.maybe_user
const j = u && 'joined_at' in u ? u.joined_at : 0
// queryData.recentCatchups[0]?.name
queryData.recentCatchups[0]?.attendees[0]?.access_level
queryData.recentCatchups[0]?.attendees[0]?.maybe_access_level
