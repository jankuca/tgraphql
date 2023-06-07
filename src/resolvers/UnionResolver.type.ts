export type UnionResolver<Data extends object, Typename extends string, Context> = {
  __resolveType: (data: Data, context: Context) => Typename
}
