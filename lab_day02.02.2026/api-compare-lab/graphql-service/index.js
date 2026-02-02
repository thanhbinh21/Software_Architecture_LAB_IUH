const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const typeDefs = `
  type User {
    id: ID
    name: String
    email: String
  }

  type Query {
    user(id: ID!): User
  }
`;

const resolvers = {
  Query: {
    user: () => ({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com'
    })
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, { listen: { port: 4000 } })
  .then(() => console.log('GraphQL running on 4000'));
