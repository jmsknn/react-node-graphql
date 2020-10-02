export default {
  orgName: async (apiKey, args, context) => {
    const { name } = await context.knex("orgs")
      .select("name")
      .where({ id: apiKey.orgId })
      .first();
    return name;
  },
  projectName: async (apiKey, args, context) => {
    const { name } = await context.knex("projects")
      .select("name")
      .where({ id: apiKey.projectId })
      .first();
    return name;
  },
};
