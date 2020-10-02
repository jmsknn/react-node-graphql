import Knex from "knex";
import logger from "../../logger";
import { IUserData } from '@bavard/common-server';

export default async (
  user: IUserData,
  orgId: string,
  name: string,
  context: any): Promise<any> => {
    const knex: Knex = context.knex;
    await context.accessControl.isOrgEditor(orgId);

    const newProject = (await knex("projects")
    .insert({
      org_id: orgId,
      name,
    })
    .returning("*"))[0];

    logger.info(`User ${user.email} created project ${name}:${newProject.id}.`);
    return newProject;
};
