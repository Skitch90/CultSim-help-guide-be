const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { v1 } = require('neo4j-driver');

const schema = require('./graphql/schema');

const app = express();

const neo4jUrl = process.env.NEO4J_URI || 'bolt://localhost:7687';
console.log('Creating neo4j driver to url',  neo4jUrl)
const driver = v1.driver(
    neo4jUrl,
    v1.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'neo4jTest'
    ),
    { disableLosslessIntegers: true }
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