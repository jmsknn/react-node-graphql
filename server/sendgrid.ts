
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOrgMemberInvite = async (
  inviterName: string,
  userEmail: string,
  orgName: string,
  invitedId: string) => {
  if (process.env.IS_TEST) {
    return;
  }

  const inviteUrl = process.env.GCP_PROJECT === "bavard-prod" ? (
    `https://bavard-prod.web.app.com/invites/${invitedId}`
  ) : (
    `https://bavard-ai-dev.web.app/invites/${invitedId}`
  );
  const msg = {
    to: userEmail,
    from: {
      name: "bavard",
      email: "invites@bavard.ai",
    },
    subject: `${inviterName} has invited you to join their organization.`,
    html: `
      <p>${inviterName} has invited you to join the organization <strong>${orgName}</strong>.
       Please click the link to join .</p>
      ${inviteUrl}
    `,
  };
  await sgMail.send(msg);
};

export default {
  sendOrgMemberInvite,
};
