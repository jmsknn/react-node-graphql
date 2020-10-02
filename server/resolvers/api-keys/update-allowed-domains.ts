import utils from "../../utils";
import { IUserData } from '@bavard/common-server';
import Knex from "knex";

export default async (_, args, context) => {
  const { projectId, domains } = args;
  const user: IUserData = context.user;
  const knex: Knex = context.knex;
  const orgId = await utils.projectIdToOrgId(projectId);
  context.accessControl.isOrgEditor(orgId);

  const apiKey = await knex("api_keys")
    .select("*")
    .where({ project_id: projectId })
    .first()
    .returning("*")
    .update({
      domains: JSON.stringify(domains)
    });

  return { ...apiKey[0], domains: JSON.parse(apiKey[0].domains) };
};
