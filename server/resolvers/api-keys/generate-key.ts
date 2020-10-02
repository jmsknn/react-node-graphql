import utils from "../../utils";
import crypto from "crypto";
import { IUserData } from "@bavard/common-server";
import Knex from "knex";
import { UserInputError } from "apollo-server";

export default async (_, args, context) => {
  const { projectId, key } = args;
  const user: IUserData = context.user;
  const knex: Knex = context.knex;
  const orgId = await utils.projectIdToOrgId(projectId);
  context.accessControl.isOrgEditor(orgId);
  const existApiKey = await knex("api_keys")
    .select("*")
    .where({ project_id: projectId })
    .first();

  if (existApiKey) {
    throw new UserInputError("you already have an apiKey in this project");
  }

  const API_KEY_PATTERN = /^[a-zA-Z0-9]*$/g;
  let apiKey = key;
  if (!apiKey || apiKey === "") {
    apiKey = crypto.randomBytes(16).toString("hex");
  } else if (apiKey.length < 8) {
    throw new UserInputError("api key must be at least 8 characters length");
  } else if (apiKey.length > 32) {
    throw new UserInputError("api key must be at max 32 characters length");
  }

  if (!API_KEY_PATTERN.test(apiKey)) {
    throw new UserInputError(
      "invalid api key: a key can only contain alphanumeric characters"
    );
  }

  const insertedKey = (await knex('api_keys').insert({
    orgId,
    projectId,
    key: apiKey,
  })
  .returning('*'))[0];

  return { ...insertedKey, domains: JSON.parse(insertedKey.domains) };
};
