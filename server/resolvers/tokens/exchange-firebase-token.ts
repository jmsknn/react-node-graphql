import * as jwt from 'jsonwebtoken';
import { decodeFirebaseToken } from '../../auth';
import dbQueries from "../../database/queries";
import { ForbiddenError } from 'apollo-server';
import * as admin from 'firebase-admin';

export default async (_, args, context) => {
  const { knex } = context;
  const firebaseToken = args.firebaseToken;

  let firebaseUser: admin.auth.DecodedIdToken;
  try {
    firebaseUser = await decodeFirebaseToken(firebaseToken);
  } catch (e) {
    console.error(e);
    throw new ForbiddenError('Invalid firebase token');
  }

  await dbQueries.createUserIfNotExists(firebaseUser, knex);

  const userOrgs = await knex("org_members")
    .select("*")
    .join("orgs", "orgs.id", "=", "org_members.org_id")
    .where({
      uid: firebaseUser.uid,
    });

  const userOrgRoles = await knex("org_members")
    .select("role", "org_id")
    .where({
      uid: firebaseUser.uid,
    });

  const userProjectRoles = await knex("org_members")
    .join('projects', 'projects.org_id', '=', 'org_members.org_id')
    .distinct("org_members.role", "projects.id as project_id")
    .where({
      uid: firebaseUser.uid,
    });

  const billingData: {
    orgId: string,
    billingEnabled: boolean,
    stripeCustomerId: string | null,
  }[] = await Promise.all(userOrgs.map(async org => {
    console.log(org.orgId);

    return {
      orgId: org.orgId,
      billingEnabled: org.billingInfo.billingEnabled || false,
      stripeCustomerId: org.billingInfo.stripeCustomerId || null,
    };
  }));

  const userData = {
    ...firebaseUser,
    authType: 'user',
    userOrgRoles: userOrgRoles.reduce((p, c) => ({ ...p, [c.orgId]: c.role }), {}),
    userProjectRoles: userProjectRoles.reduce((p, c) => ({ ...p, [c.projectId]: c.role }), {}),
    billingOrgs: billingData.reduce((p, c) => ({ ...p, [c.orgId]: { ...c } }), {}),
    apiKeyProject: ""
  }

  const token = jwt.sign(userData, process.env.JWT_SECRET_KEY);

  return {
    token
  }
};
