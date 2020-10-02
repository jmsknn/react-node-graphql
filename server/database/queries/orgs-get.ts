import Knex from "knex";
import { IUserData } from '@bavard/common-server';

export default async (user: IUserData, orgId: string | null, knex: Knex): Promise<any> => {
  const orgs = await knex("orgs")
    .select("*")
    .join("org_members", "org_members.org_id", "=", "orgs.id")
    .where({
      ...orgId && {"orgs.id": orgId},
      "org_members.uid": user.uid,
    });
  return orgs;
};
