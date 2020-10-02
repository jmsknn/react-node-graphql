import utils from "../../utils";
import { IUserData } from '@bavard/common-server';
import Knex from "knex";

export default async (_, args, context) => {
  const { projectId } = args;
  const user: IUserData = context.user;
  const knex: Knex = context.knex;
  const orgId = await utils.projectIdToOrgId(projectId);
  context.accessControl.isOrgEditor(orgId);

  const apiKey = await knex("api_keys")
    .select("*")
    .where({ project_id: projectId })
    .first();

  return !!apiKey ? { ...apiKey, domains: JSON.parse(apiKey?.domains) } : null;
};
