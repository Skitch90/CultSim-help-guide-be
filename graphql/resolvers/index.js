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
            const query = "MATCH (n) where LOWER(n.name) CONTAINS LOWER($name) return n { .name, label: head(labels(n)), aspects: [(n)-[r:HAS_ASPECT]->(a:Aspect) | r { aspect: a.name , .quantity}]} AS item";
            const queryResult = await session.run(query, args)
            return  queryResult.records.map(record => {
                return record.get("item");
            });
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
    }
}

module.exports = resolvers;