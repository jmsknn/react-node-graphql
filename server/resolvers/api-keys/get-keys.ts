import { IUserData } from '@bavard/common-server';
import Knex from "knex";

export default async (_, args, context) => {
  const { orgId } = args;
  const user: IUserData = context.user;
  const knex: Knex = context.knex;
  context.accessControl.isOrgEditor(orgId);

  const apiKeys = await knex("api_keys")
    .select("*")
    .where({ org_id: orgId });

  return apiKeys.map(apiKey => ({ ...apiKey, domains: JSON.parse(apiKey.domains) }));
};
