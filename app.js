const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { v1 } = require('neo4j-driver');

const schema = require('./graphql/schema');

const app = express();

const driver = v1.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    v1.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'neo4jTest'
    )
);

const server = new ApolloServer({
    schema,
    context: ({ req }) => {
        return {
            driver,
            req
        };
    }
});

server.applyMiddleware({ app, path: '/api' });

app.listen({ port: 4000 }, () => {
    console.log('Apollo Server started');
    console.log('QraphQL API on http://localhost:4000/api');
});