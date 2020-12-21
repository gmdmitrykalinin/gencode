import SchemaLoader from '../../mixins/schema-loader.mixin';
import dbService from '../../mixins/db.mixin';
import * as handlers from './handlers';

export default {
  name: '$[ServiceName]',
  mixins: [
    SchemaLoader(__dirname),
    dbService('$[ServiceName]'),
  ],
  settings: {
    timestamps: $[TimeStamp],
    idField: 'id',
    graphql: {
      resolvers: {
        Mutation: {
          $[Mutations]
        },
        Query: {
          $[Query]
        },
      },
    },
  },
  actions: {
    $[Actions]
  },
};
