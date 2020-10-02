// tslint:disable-next-line: no-var-requires
require("ts-node/register");
import * as knex from "knex";
import {camelCase, isEmpty, mapKeys} from "lodash";
import { knexSnakeCaseMappers } from "objection";

const camelizeKeys = (obj) => {
  if (isEmpty(obj)) {
    return obj;
  }
  return mapKeys(obj, (v, k) => camelCase(k));
};

const config: knex.Config = {
  client: "pg",
  connection: {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    host: process.env.SQL_CONNECTION_NAME,
  },
  pool: {
    min: 0,
    max: 50,
  },
  migrations: {
    loadExtensions: [".js"],
    directory: `${__dirname}/migrations`,
    tableName: "knex_migrations",
  },
  ...knexSnakeCaseMappers(),
};

export = config;
