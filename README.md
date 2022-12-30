# t-GraphQL

(typed GraphQL)

End-to-end type-safe GraphQL for TypeScript. Think tRPC, but GraphQL.

```bash
npm i --save t-graphql
```

## Movitation

The GraphQL code generator should not exist as a required step during development of a universal TypeScript app where both the server and the client are written in TypeScript. Code (GQL schemas) should only be generated as a build artifact or in the runtime.

The workflow of writing a query GQL, running a codegen, importing the generated types for use with useQuery and only then being somewhat sure the implementation is type-safe is just terrible. You should be able to write the query definition, use it and have everything type-safe out-of-the-box, always.

To have complete control over the typing, we need to take the code-first approach and instead of writing raw GQL schemas, we need to define the schema using a DSL within TypeScript code itself.

## Example

```typescript
const Profile = objectType('Profile').field('id', 'ID').field('name', 'String')
const Query = objectType('Query').field('me', Profile)

const GetProfile = queryType(Query).field('me', (me) => me.field('id').field('name'))
const { data } = useQuery(GetProfile)
// `data` is typed as `{ me: { id: string, name: string }}` without any build steps
```

## Quick start

### Import the server utils

### Define query schema

```typescript
// server
import { objectType } from 't-graphql'

const Tag = objectType('Tag').field('label', 'String')
const Task = objectType('Task').field('id', 'ID').field('title', 'String').optionalListField('tags', Tag)

export const Query = objectType('Query')
  .listField('tasks', [Task])
  .listParamField('tasksWithTag', (p) => p.field('tag', 'String'), [Task])
```

### Define mutation schema

```typescript
import { inputType, objectType, queryType } from 't-graphql'

export const TaskConfigInput = inputType('TaskConfigInput').listField('tags', ['String'])

export const Mutation = objectType('Mutation')
  .paramField('addTask', (p) => p.field('title', 'String').optionalField('config', TaskConfigInput), 'ID')
  .paramField('deleteTask', (p) => p.field('taskId', 'ID'), 'Bool')
```

### Write type-safe resolvers

```typescript
import { SchemaResovlers } from 't-graphql'

const resolvers: SchemaResolvers<typeof Query, typeof Mutations> = {
  'Query': {
    'tasks': () => [{ 'id': 'a', 'title': 'Some task', 'tags': [{ 'label': 'random' }] }],
    'tasksWithTag': (params: { 'tag': string }) => [{ 'id': 'a', 'title': 'Some task', 'tags': [{ 'label': tag }] }],
  },
  'Mutation': {
    'addTask': (params: { 'title': string; 'config': { 'tags': Array<string> } }) => 'c',
    'deleteTask': (params: { 'taskId': string }) => true,
  },
}
```

### Query the data

```typescript
// client
import { queryType, useQuery } from 't-graphql'
import { Query } from './server'

const ListTasks = queryType(Query).field('tasks', (task) =>
  task
    .field('id')
    .field('title')
    .field('tags', (tag) => tag.field('label'))
)

const { data } = useQuery(ListTasks)
// `data` is typed as `{ tasks: [{ id: string, title: string, tags: [ { label: string } ] | null }] }`
```

### Mutate the data

```typescript
// client
import { mutationType, useMutation, variable } from 't-graphql'
import { Mutation, TaskConfigInput } from './server'

const AddTask = mutationType(Mutation)
  .variable('title', 'String')
  .variable('tagConfig', TaskConfigInput)
  .paramField(
    'addTask',
    {
      'title': variable('title'),
      'config': variable('tagConfig'),
    },
    (task) =>
      task
        .field('id')
        .field('title')
        .field('tags', (tag) => tag.field('label'))
  )

const { data } = useMutation(AddTask, {
  variables: {
    'title': 'Let the dogs out',
    'tagConfig': { 'tags': ['dogs', 'chore'] },
  },
})
// `data` is typed as `{ addTask: string }`
```

## License

MIT
