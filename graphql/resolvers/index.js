const _ = require('lodash');

const howToObtainLoreCypherMap = new Map([
    ["Lore", "MATCH p= (:Lore)-[:UPGRADES_TO*1..]->(:Lore{name: $loreName}) RETURN 'Lore' AS fromType, nodes(p) AS path, length(p) AS pathLength"],
    ["Book", "MATCH p= (:Book)-[:STUDY_RESULTS_IN]->(:Lore)-[:UPGRADES_TO*0..]->(:Lore{name: $loreName}) RETURN 'Book' AS fromType, nodes(p) AS path, length(p) AS pathLength"]
]);

const resolvers = {
    Query: {
        entityWithName: async (root, args, context) => {
            const { name } = args;
            if (name.length < 3) {
                return [];
            }

            const session = context.driver.session();
            const query = "MATCH (n) where LOWER(n.name) CONTAINS LOWER($name) return n { _id: ID(n), .name, label: head(labels(n)), aspects: [(n)-[r:HAS_ASPECT]->(a:Aspect) | r { aspect: a.name , .quantity}]} AS item";
            const queryResult = await session.run(query, args);
            return  queryResult.records.map(record => {
                return record.get("item");
            });
        },
        entityWithAspect: async (root, args, context) => {
            const session = context.driver.session();
            const query = "MATCH (n)-[r:HAS_ASPECT]->(:Aspect {name: $aspect}) RETURN ID(n) AS id, HEAD(labels(n)) AS label, n.name AS name, r.quantity AS quantity ORDER BY label, quantity, name";
            const queryResult = await session.run(query, args);
            const resultEntities = queryResult.records.map(record => {
                return {
                    id: record.get("id"),
                    label: record.get("label"),
                    name: record.get("name"),
                    quantity: record.get("quantity")
                }
            });
            const groupedResults = _.groupBy(resultEntities, 'label');
            const finalResult = _.map(groupedResults, function(value, key) {
                return {
                    label: key,
                    entities: value.map(item => {
                        return {
                            _id: item.id,
                            name: item.name,
                            type: key,
                            aspectQuantity: item.quantity
                        }
                    })
                }
            });
            return finalResult;
        },
        howToObtainLore: (root, args, context) => {
            const { fromType } = args;
            const session = context.driver.session();
            const query = fromType ? howToObtainLoreCypherMap.get(fromType) : [...howToObtainLoreCypherMap.values()].join(" UNION ");
            console.log(query);
            session.run(query, args)
                .then(result => result.records.forEach(record => console.log(record.get("fromType"), record.get("path"), record.get("pathLength"))));
            return {
                fromType: "String!",
                path: [],
                pathLength: 1
            };
        }
    },
    Mutation: {
        setLanguageRequires: async (root, args, context) => {
            const session = context.driver.session();
            const query = `
                MATCH (lang:Language {name: $language})
                MATCH (reqLang:Language {name: $requiredLanguage})
                CREATE (lang)-[requires:REQUIRES]->(reqLang)
                RETURN lang.name AS language, reqLang.name AS requiredLanguage
            `;
            const queryResult = await session.run(query, args);
            const record = queryResult.records[0];
            const resultLanguage = {
                language: record.get("language"),
                requiredLanguage: record.get("requiredLanguage")
            }
            return resultLanguage;
        }
    }
}

module.exports = resolvers;