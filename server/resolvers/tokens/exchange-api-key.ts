import * as jwt from 'jsonwebtoken';
import { ForbiddenError, UserInputError } from 'apollo-server';
import _ from 'lodash';

export default async (parent, args, context) => {
  const {knex} = context;
  const apiKey = args.apiKey;

  if (_.isEmpty(apiKey)) {
    throw new UserInputError("API Key is required");
  }

  const project = await knex("api_keys")
    .select("project_id", "domains")
    .where({
      key: apiKey,
    }).first();

  if (_.isEmpty(project)) {
    throw new ForbiddenError("Invalid API Key");
  }

  const userData = {
    authType: 'apiKey',
    apiKeyProject: project.projectId,
    // @TODO: This iss should ideally be replaced with this service's url
    iss: `https://securetoken.google.com/${process.env.GOOGLE_CLOUD_PROJECT}`,
    aud: process.env.GOOGLE_CLOUD_PROJECT,
    sub: project.projectId,
    allowedDomains: JSON.parse(project.domains)
  }

  const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

  return {
    token
  }
};