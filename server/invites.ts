import firestore from './firestore';
import { v4 as uuid } from "uuid";
import { IOrgMemberInvite } from "./gql-schema/models";

const requires = (field: any, fieldName: string): void => {
  if (!field) {
    throw new Error(`${fieldName} is required`);
  }
};

const getOrgMemberInvite = async (inviteId: string): Promise<IOrgMemberInvite> => {
  const snapshot = await firestore.collection("org_member_invites")
    .doc(inviteId).get();
  const invite = await snapshot.data();
  return invite as IOrgMemberInvite;
};

const getOrgMemberInvites = async (orgId: string): Promise<IOrgMemberInvite[]> => {
  const snapshot = await firestore
    .collection("org_member_invites")
    .where('orgId', '==', orgId)
    .get();
  const invites = await snapshot.docs.map(x => x.data());
  return invites as IOrgMemberInvite[];
};

const deleteOrgMemberInvite = async (inviteId: string) => {
  return firestore.collection("org_member_invites").doc(inviteId).delete();
};

const createOrgMemberInvite = async (
  senderName: string,
  senderEmail: string,
  email: string,
  orgId: string,
  orgName: string,
  role: string): Promise<IOrgMemberInvite> => {
  requires(senderName, "senderName");
  requires(senderEmail, "senderEmail");
  requires(email, "email");
  requires(orgId, "orgId");
  requires(orgName, "orgName");
  requires(role, "role");

  const inviteId = uuid();
  const invite: IOrgMemberInvite = {
    id: inviteId,
    orgId,
    role,
    orgName,
    senderName,
    senderEmail,
    email,
    timestamp: Date.now().toString(),
  };

  if (process.env.IS_TEST) {
    return invite;
  }

  await firestore.collection("org_member_invites")
    .doc(inviteId)
    .set(invite);

  return invite;
};

export default {
  createOrgMemberInvite,
  deleteOrgMemberInvite,
  getOrgMemberInvite,
  getOrgMemberInvites
};
