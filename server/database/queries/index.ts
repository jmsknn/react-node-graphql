import createOrg from "./org-create";
import deleteOrg from "./org-delete";
import getOrg from "./org-get";
import createOrgMember from "./org-member-create";
import deleteOrgMember from "./org-member-delete";
import orgMemberGet from "./org-member-get";
import getOrgs from "./orgs-get";
import createUserIfNotExists from "./user-create-if-not-exists";

// projects
import createProject from "./project-create";
import deleteProject from "./project-delete";
import getProjects from "./projects-get";

export default {
    createOrg,
    deleteOrg,
    getOrgs,
    getOrg,
    createProject,
    deleteProject,
    getProjects,
    createOrgMember,
    deleteOrgMember,
    orgMemberGet,
    createUserIfNotExists,

};
