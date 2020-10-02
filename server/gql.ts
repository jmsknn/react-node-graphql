import { buildFederatedSchema } from "@apollo/federation";
import { ApolloServer } from "apollo-server-express";
import { Request } from "express";
import typeDefs from "./gql-schema";
import resolvers from "./resolvers";
export interface IExtendedRequest extends Request {
  knex: any;
}
import dbQueries from "./database/queries";
import { AccessControl, AuthData, decodeBavardToken, IUserData, ReportError } from "@bavard/common-server";

const server = new ApolloServer({
  schema: buildFederatedSchema({ typeDefs, resolvers }),
  context: async ({ req }: { req: IExtendedRequest }) => {
    const authHeader: any = req.headers.authorization;

    let user: IUserData | null = null;
    let authData: AuthData | null = null;
    if (authHeader) {
      authData = await decodeBavardToken(authHeader, process.env.JWT_SECRET_KEY);
      if (authData?.authType === 'user') {
        user = authData;
        await dbQueries.createUserIfNotExists(user, req.knex);
      }
    }

    return {
      user,
      knex: req.knex,
      accessControl: new AccessControl(user),
    };
  },
  formatError: (error) => {
    console.error(JSON.stringify(error, null, 2));

    if (error.extensions.code === "INTERNAL_SERVER_ERROR") {
      const webErrorMsg: string = `${error.extensions.code} - USER-SERVICE: ${error.message}`;
      if (!process.env.IS_TEST) {
        ReportError(webErrorMsg, 'ERROR', process.env.SLACK_WEBHOOK_URL, process.env.GOOGLE_CLOUD_PROJECT);
      }
    }
    return error;
  },
  formatResponse: (response) => {
    return response;
  },
  introspection: true,
  playground: true,
});

export default (app) => {
  server.applyMiddleware({ app });
};
