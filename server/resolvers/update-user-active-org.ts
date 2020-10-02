import { ApolloError } from "apollo-server";
import utils from "../utils";
import Knex from "knex";
import {IUserData} from "@bavard/common-server";

export default async (_, args, context) => {
  const { orgId, projectId } = args;
  const user: IUserData = context.user;
  const knex: Knex = context.knex;
  await context.accessControl.isOrgViewer(orgId);

  if (projectId) {
    const projOrg = await utils.projectIdToOrgId(projectId);
    if (orgId !== projOrg) {
      throw new ApolloError("Active project must belong to the active org.");
    }
  }

  const values = {
    active_org_id: orgId,
    active_project_id: projectId ? projectId : null,
  };

  const updatedUser = (await knex("users")
    .where({ uid: user.uid })
    .returning("*")
    .update(values))[0];

  return updatedUser;
};
