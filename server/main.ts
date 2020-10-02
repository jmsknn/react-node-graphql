"use strict";

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const loadSecrets = async () => {
  if (process.env.IS_TEST) {
    return;
  }
  const client = new SecretManagerServiceClient();

  let [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/user-service-db-password/versions/latest`,
  });
  const password = accessResponse.payload.data.toString();

  [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/user-service-db-user/versions/latest`,
  });
  const userName = accessResponse.payload.data.toString();

  [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/user-service-db-name/versions/latest`,
  });
  const dbName = accessResponse.payload.data.toString();

  [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/user-service-db-connection-name/versions/latest`,
  });
  const connectionName = accessResponse.payload.data.toString();

  [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/sendgrid-api-key/versions/latest`,
  });
  const sendgridApiKey = accessResponse.payload.data.toString();

  // stripe
  [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/stripe-sk/versions/latest`,
  });
  const stripeSK = accessResponse.payload.data.toString();
  [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/jwt-secret-key/versions/latest`,
  });
  const jwtSecretKey = accessResponse.payload.data.toString();

  console.log('DB_SOCKET_PATH: ', process.env.DB_SOCKET_PATH)
  process.env.SQL_PASSWORD = password;
  process.env.SQL_USER = userName;
  process.env.SQL_CONNECTION_NAME = connectionName;
  process.env.SQL_DATABASE = dbName;
  process.env.SENDGRID_API_KEY = sendgridApiKey;
  process.env.STRIPE_SK = stripeSK;
  process.env.JWT_SECRET_KEY = jwtSecretKey;

  console.log('SENDGRID_API_KEY', process.env.SENDGRID_API_KEY);
};

const main = async () => {
  await loadSecrets();
  require("./app");
};

(async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
