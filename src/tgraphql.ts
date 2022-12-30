type ScalarType = 'ID' | 'String' | 'Int' | 'Float' | 'Bool'

abstract class NamedType {
  typename: string
  constructor(typename: string) {
    this.typename = typename
  }
}

class ObjectType<S extends Record<string, { type: AnyType; optional: boolean }>> extends NamedType {
  schema: S
  constructor(typename: string, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<S & { [k in K]: { type: T; optional: false } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false },
    })
  }

  listField<K extends string, Ts extends readonly [AnyType] | readonly [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<S & { [k in K]: { type: Ts; optional: false } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false },
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

class EnumType<Vs extends ReadonlyArray<string>> extends NamedType {
  values: Array<EnumValueType<Vs[number]>>
  constructor(typename: string, values: Vs) {
    super(typename)
    this.values = values.map((value) => new EnumValueType(typename, value))
  }
}

function objectType(typename: string) {
  return new ObjectType(typename, {})
}
function enumType<S extends ReadonlyArray<string>>(typename: string, ...values: S) {
  return new EnumType(typename, values)
}

const CatchupAccessLevelEnum = enumType('CatchupAccessLevelEnum', 'owner', 'participant', 'viewer', 'denied')

const User = objectType('User').field('id', 'ID').field('name', 'String')

const Attendee = objectType('Attendee')
  .field('id', 'ID')
  .field('user', User)
  .field('access_level', CatchupAccessLevelEnum)

const Catchup = objectType('Catchup').field('id', 'ID').field('author', User).listField('attendees', [Attendee])

const Query = objectType('Query').listField('recentCatchups', [Catchup])

type AnyType =
  | ObjectType<Record<string, { type: AnyType; optional: boolean }>>
  | EnumType<ReadonlyArray<string>>
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
  : T extends EnumType<infer I>
  ? I[number]
  : T extends EnumValueType<infer I>
  ? I
  : T extends ObjectType<infer I>
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
  : T extends EnumType<infer I>
  ? () => I[number]
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<infer I>
  ? { [key in keyof I]: () => I[key]['optional'] extends true ? Value<I[key]['type']> | null : Value<I[key]['type']> }
  : T extends ScalarType
  ? () => string
  : T

// Testing:
// type URs = Resolver<typeof User>
// type ARs = Resolver<typeof Attendee>
// type CRs = Resolver<typeof Catchup>

type SchemaResolvers<Q extends ObjectType<any>> = { Query: Resolver<Q> }

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
      ? { 'id': authorAttendee['user_id'], 'name': authorAttendee['user_name'] }
      : { 'id': 'author-id', 'name': 'Author' },
    'attendees': attendeeModels.map((attendeeModel) => {
      const { 'user_id': userId, 'user_name': userName, ...attendee } = attendeeModel
      return {
        ...attendee,
        'user': { 'id': userId, 'name': userName },
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

function generateSchemaPart(type: AnyType): { hoisted: Record<string, string>; inline: string } {
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

type AnyObjectType = ObjectType<Record<string, { type: AnyType; optional: boolean }>>
type AnyObjectListType = [AnyObjectType] | [AnyObjectType, null]

type AnyScalarType = Exclude<AnyType, AnyObjectType | [...any]>
type AnyScalarListType = [AnyScalarType] | [AnyScalarType, null]

type AnyObjectQueryType = ObjectQueryType<
  ObjectType<Record<string, { type: AnyType; optional: boolean }>>,
  Record<string, AnyQueryType>,
  Record<string, { key: string; type: AnyScalarType; optional: boolean }>,
  Record<string, { key: string; type: AnyScalarListType; optional: boolean }>,
  Record<string, { key: string; type: AnyObjectType; optional: boolean }>,
  Record<string, { key: string; type: AnyObjectListType; optional: boolean }>
>
type AnyNodeQueryType = AnyObjectQueryType | ScalarQueryType<AnyType>
type AnyQueryType = AnyNodeQueryType | [AnyNodeQueryType] | [AnyNodeQueryType, null]

type FilterScalarResolvers<Schema extends Record<string, { type: AnyType; optional: boolean }>> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
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

type ObjectQueryTypeOf<
  ResolverType extends AnyObjectType,
  QuerySchema extends Record<string, AnyQueryType> = Record<never, AnyQueryType>
> = ObjectQueryType<
  ResolverType,
  QuerySchema,
  ScalarResolvers<ResolverType>,
  ScalarListResolvers<ResolverType>,
  ObjectResolvers<ResolverType>,
  ObjectListResolvers<ResolverType>
>

class ObjectQueryType<
  ResolverType extends AnyObjectType,
  QuerySchema extends Record<string, AnyQueryType>,
  Fields extends ScalarResolvers<ResolverType>,
  ListFields extends ScalarListResolvers<ResolverType>,
  ObjectFields extends ObjectResolvers<ResolverType>,
  ObjectListFields extends ObjectListResolvers<ResolverType>
> {
  resolverType: ResolverType
  schema: QuerySchema

  constructor(resolverType: ResolverType, schema: QuerySchema) {
    this.resolverType = resolverType
    this.schema = schema
  }

  field<K extends Extract<keyof Fields, string>>(key: K) {
    const schema = this.resolverType.schema as Fields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      QuerySchema & {
        [key in K]: ScalarQueryType<Fields[K]['type']>
      }
    > = new ObjectQueryType(this.resolverType, {
      ...this.schema,
      [key]: new ScalarQueryType(fieldDesc.type),
    })

    return nextQueryType
  }

  listField<K extends Extract<keyof ListFields, string>>(key: K) {
    const schema = this.resolverType.schema as ListFields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      QuerySchema & {
        [key in K]: [ScalarQueryType<ListFields[K]['type']>]
      }
    > = new ObjectQueryType(this.resolverType, {
      ...this.schema,
      [key]: [new ScalarQueryType(fieldDesc.type)],
    })

    return nextQueryType
  }

  objectField<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, AnyQueryType>,
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type']>) => Subquery) {
    const schema = this.resolverType.schema as ObjectFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type, {})
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      QuerySchema & {
        [key in K]: Subquery
      }
    > = new ObjectQueryType(this.resolverType, {
      ...this.schema,
      [key]: subquery,
    })

    return nextQueryType
  }

  objectListField<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, AnyQueryType>,
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Record<never, AnyQueryType>>) => Subquery
  ) {
    const schema = this.resolverType.schema as ObjectListFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type[0], {})
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      QuerySchema & {
        [key in K]: [Subquery]
      }
    > = new ObjectQueryType(this.resolverType, {
      ...this.schema,
      [key]: [subquery],
    })

    return nextQueryType
  }
}

function queryType() {
  return new ObjectQueryType(Query, {})
}

type QueryResult<Q extends AnyQueryType> = Q extends [infer T extends AnyObjectQueryType]
  ? Array<QueryResult<T>>
  : Q extends ObjectQueryType<infer _r, infer QuerySchema, infer _f, infer _lf, infer _of, infer _olf>
  ? {
      [K in keyof QuerySchema]: QueryResult<QuerySchema[K]>
    }
  : Q extends [infer T extends ScalarQueryType<AnyType>]
  ? Array<QueryResult<T>>
  : Q extends ScalarQueryType<infer T>
  ? Value<T>
  : never

function useQuery<Q extends AnyNodeQueryType>(queryType: Q): { data: QueryResult<Q> } {
  const gql = generateQueryString(queryType)
  console.log(gql)
  return { data: {} } as any
}

function generateQueryString<Q extends AnyQueryType>(queryType: Q): string {
  return ['query', generateQueryStringPart(queryType)].join(' ')
}

function generateQueryStringPart<Q extends AnyQueryType>(queryType: Q): string {
  if (Array.isArray(queryType)) {
    return generateQueryStringPart(queryType[0])
  }

  if (queryType instanceof ObjectQueryType) {
    const fields = Object.entries(queryType.schema).map(([key, subqueryType]) => {
      return `${key} ${generateQueryStringPart(subqueryType).replace(/^/gm, '  ').trim()}`.trim()
    })

    return ['{', ...fields.map((key) => `  ${key}`), '}'].join('\n')
  }

  if (queryType instanceof ScalarQueryType) {
    return ''
  }

  throw new Error('Unknown query')
}

// --- DEMO: ---

const q = new ObjectQueryType(Catchup, {})
type QFields = keyof ScalarResolvers<typeof q.resolverType>
type QObjectLists = keyof ObjectListResolvers<typeof q.resolverType>

// new ObjectQueryType(Query, {}).field('x')
// new ObjectQueryType(Query, {}).objectField('recentCatchups', (catchup) => catchup.field('id'))
// new ObjectQueryType(Query, {}).listField('recentCatchups')
new ObjectQueryType(Query, {}).objectListField('recentCatchups', (catchup) => catchup.field('id'))

const ListCatchups = queryType().objectListField('recentCatchups', (catchup) =>
  catchup
    .field('id')
    // .field('name')
    .objectListField('attendees', (attendee) =>
      attendee.field('access_level').objectField('user', (user) => user.field('id').field('name'))
    )
)

const queryData = useQuery(ListCatchups).data
// queryData.recentCatchups[0]?.attendees[0]?.user.name
// queryData.recentCatchups[0]?.name
// queryData.recentCatchups[0]?.attendees[0]?.access_level
