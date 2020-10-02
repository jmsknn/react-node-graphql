import Knex from "knex";
import logger from "../../logger";
import utils from "../../utils";
import { IUserData } from '@bavard/common-server';

export default async (user: IUserData, projectId: string, context: any): Promise<any> => {
  const knex: Knex = context.knex;
  const orgId = await utils.projectIdToOrgId(projectId);
  await context.accessControl.isOrgEditor(orgId);

  const deletedProj = (await knex("projects")
  .returning("*")
  .where({
    id: projectId,
  })
  .del())[0];

  logger.info(`User ${user.uid} deleted project ${deletedProj.name}:${deletedProj.id}.`);

  return deletedProj;
};
