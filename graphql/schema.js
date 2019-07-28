const { makeExecutableSchema } = require('apollo-server');
const { augmentTypeDefs, augmentSchema } = require('neo4j-graphql-js');
const fs = require('fs');

var path = require('path');

const resolvers = require('./resolvers/index');

const schemPath = path.join(__dirname, './schema/schema.graphql');
const schemaContent = fs.readFileSync(schemPath);
const typeDefs = schemaContent.toString();

const schema = makeExecutableSchema({
    typeDefs: augmentTypeDefs(typeDefs),
    resolverValidationOptions: {
        requireResolversForResolveType: false
    },
    resolvers
});

const augmentedSchema = augmentSchema(schema);

module.exports = augmentedSchema