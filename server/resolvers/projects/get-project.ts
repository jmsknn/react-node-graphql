import utils from "../../utils";
import Knex from "knex";

export default async (_, args, context) => {
  const { projectId } = args;
  const knex: Knex = context.knex;
  const orgId = await utils.projectIdToOrgId(projectId);
  context.accessControl.isOrgViewer(orgId);

  const project = await knex("projects")
    .select("*")
    .where({ id: projectId })
    .first();

  return project;
};
