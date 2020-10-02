import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
  IResolvers,
  UserInputError,
} from "apollo-server";
import { merge } from "lodash";
import dbQueries from "../database/queries";
import invites from "../invites";
import sendgrid from "../sendgrid";

import updateUserActiveOrg from "./update-user-active-org";

// orgs
import Org from "./orgs/Org";
import changeOrgMemberRole from "./orgs/change-org-member-role";

// Invites
import orgMemberInvites from "./invites/get-invites";

// projects
import getProject from "./projects/get-project";
import Knex from "knex";

// api keys
import generateApiKey from "./api-keys/generate-key";
import deleteApiKey from "./api-keys/delete-key";
import apiKey from "./api-keys/get-key";
import apiKeys from "./api-keys/get-keys";
import updateAllowedDomains from "./api-keys/update-allowed-domains";
import exchangeFirebaseToken from "./tokens/exchange-firebase-token";
import exchangeApiKey from "./tokens/exchange-api-key";
import ApiKey from "./api-keys/field-resolvers";
import { IOrgMemberInvite } from "../gql-schema/models";

// billing
import enableBilling from "./billing/enable-billing";
import disableBilling from "./billing/disable-billing";
import { AccessControl, IUserData } from "@bavard/common-server";

const resolvers: IResolvers = {
  Query: {
    currentUser: async (_, args, context) => {
      const user: IUserData = context.user;
      const knex: Knex = context.knex;
      if (!user) {
        throw new AuthenticationError("unauthenticated");
      }

      const userResult = await knex("users")
        .select("*")
        .where({ uid: user.uid })
        .first();
      return userResult;
    },
    orgs: async (parent, args, context) => {
      const user: IUserData = context.user;
      const knex: Knex = context.knex;
      const orgId = args.id;
      if (!user) {
        throw new AuthenticationError("unauthenticated");
      }

      return dbQueries.getOrgs(user, orgId, knex);
    },

    orgMember: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError("unauthenticated");
      }
      const user: IUserData = context.user;
      const knex: Knex = context.knex;
      const { orgId, userId } = args;
      return dbQueries.orgMemberGet(user, orgId, null, userId, context);
    },
    orgMemberByProjectId: async (parent, args, context) => {
      const user: IUserData = context.user;
      const { projectId, userId } = args;
      return dbQueries.orgMemberGet(user, null, projectId, userId, context);
    },
    projects: async (parent, args, context) => {
      const knex: Knex = context.knex;
      const { orgId } = args;
      await context.accessControl.isOrgOwner(orgId);

      const projects = await knex("projects").select("*").where({
        org_id: orgId,
      });
      return projects;
    },
    project: getProject,
    // api keys
    apiKey,
    apiKeys,
    exchangeFirebaseToken,
    exchangeApiKey,
    orgMemberInvites,
  },
  Org,
  OrgMember: {
    user: async (orgMember, args, context) => {
      const user = await context
        .knex("users")
        .select("*")
        .where({
          uid: orgMember.uid,
        })
        .first();
      return user;
    },
  },
  Project: {
    org: async (project, args, context) => {
      const org = await context
        .knex("orgs")
        .select("*")
        .where({
          id: project.orgId,
        })
        .first();
      return org;
    },
  },
  User: {
    orgs: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError("unauthenticated");
      }
      const user: IUserData = context.user;
      const knex: Knex = context.knex;
      return dbQueries.getOrgs(user, null, knex);
    },
    activeOrg: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError("unauthenticated");
      }
      const user: IUserData = context.user;
      const knex: Knex = context.knex;
      if (!parent.activeOrgId) {
        return null;
      }
      const org = await dbQueries.getOrg(user, parent.activeOrgId, knex);
      return org;
    },
    activeProject: async (parent, args, context) => {
      const knex: Knex = context.knex;
      if (!parent.activeProjectId) {
        return null;
      }
      const project = await knex("projects")
        .select("*")
        .where({ id: parent.activeProjectId })
        .first();
      return project;
    },
  },
  ApiKey,
  Mutation: {
    updateAllowedDomains,
    createOrg: async (_, args, context) => {
      const user: IUserData = context.user;
      const orgName = args.name;
      const orgsCount = await context
        .knex("org_members")
        .where({ uid: user.uid })
        .countDistinct("org_id")
        .first();
      if (orgsCount.count >= 3) {
        throw new ApolloError("Org limit reached.", "ORG_LIMIT_REACHED");
      }
      const org = await dbQueries.createOrg(user, orgName, context.knex);
      return org;
    },
    deleteOrg: async (_, args, context) => {
      const user: IUserData = context.user;
      const orgId = args.orgId;
      const org = await dbQueries.deleteOrg(user, orgId, context);
      return org;
    },
    createProject: async (_, args, context) => {
      const user: IUserData = context.user;
      const name = args.name;
      const orgId = args.orgId;
      const numProjects = (
        await context
          .knex("projects")
          .where({ org_id: orgId })
          .countDistinct("id")
          .first()
      ).count;
      if (numProjects >= 5) {
        throw new ApolloError(
          "Project limit reached.",
          "PROJECT_LIMIT_REACHED"
        );
      }
      const project = await dbQueries.createProject(user, orgId, name, context);
      return project;
    },
    deleteProject: async (_, args, context) => {
      const user: IUserData = context.user;
      const projectId = args.projectId;
      const project = await dbQueries.deleteProject(user, projectId, context);
      return project;
    },
    inviteOrgMember: async (_, args, context): Promise<IOrgMemberInvite> => {
      const user: IUserData = context.user;
      const { knex } = context;
      const { orgId, recipientEmail, role } = args;
      await context.accessControl.isOrgOwner(orgId);

      const org = await dbQueries.getOrg(user, orgId, knex);
      const invite = await invites.createOrgMemberInvite(
        user.name,
        user.email,
        recipientEmail,
        orgId,
        org.name,
        role
      );
      await sendgrid.sendOrgMemberInvite(
        user.name,
        recipientEmail,
        org.name,
        invite.id
      );

      return invite;
    },
    acceptOrgMemberInvite: async (_, args, context) => {
      const user: IUserData = context.user;
      const invite = await invites.getOrgMemberInvite(args.inviteId);

      if (!invite) {
        throw new UserInputError(`Invite ${args.inviteId} does not exist.`);
      }
      if (user.email !== invite.email) {
        throw new ForbiddenError(
          `User ${user.email} is not authorized for this invite. Should be ${invite.email}.`
        );
      }

      await invites.deleteOrgMemberInvite(invite.id);

      const orgsNumber = (
        await context
          .knex("org_members")
          .where({ uid: user.uid })
          .countDistinct("org_id")
          .first()
      ).count;
      if (orgsNumber >= 3) {
        throw new ApolloError("Org limit reached.", "ORG_LIMIT_REACHED");
      }

      const member = await context
        .knex("org_members")
        .select("*")
        .where({
          uid: user.uid,
          org_id: invite.orgId,
        })
        .first();

      if (member) {
        throw new ApolloError(
          `You are already a member of organization ${invite.orgId}.`
        );
      }

      await context.knex("org_members").insert({
        org_id: invite.orgId,
        uid: user.uid,
        role: invite.role,
      });
      return invite;
    },
    deleteOrgMemberInvite: async (_, args, context) => {
      const user: IUserData = context.user;
      const { orgId, inviteId } = args;

      // check user authorization
      await context.accessControl.isOrgOwner(orgId);

      // fetch the invitation record
      const invite = await invites.getOrgMemberInvite(inviteId);
      if (!invite) {
        throw new UserInputError(`Invite ${inviteId} does not exist.`);
      }

      // call the delete op of invite model
      await invites.deleteOrgMemberInvite(invite.id);

      // all done, return true
      return true;
    },
    removeOrgMember: async (_, args, context) => {
      const { orgId, userId } = args;
      const user: IUserData = context.user;
      const removedMember = await dbQueries.deleteOrgMember(
        user,
        orgId,
        userId,
        context
      );
      return removedMember;
    },
    changeOrgMemberRole,
    updateUserActiveOrg,
    // api keys
    generateApiKey,
    deleteApiKey,
    // billing
    enableBilling,
    disableBilling,
  },
};

export default merge(resolvers);
