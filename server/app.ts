"use strict";

import * as admin from 'firebase-admin';
admin.initializeApp({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

import bodyParser from "body-parser";
import CookieParser from "cookie-parser";
import cors from "cors";
import express, { Request } from "express";
import Knex, { Config } from "knex";
import knexconfig from "./database/knexfile";
import gql from "./gql";
import { Model } from "objection";

const knex = Knex(knexconfig as Config);
Model.knex(knex);

export interface IExtendedRequest extends Request {
  user: any;
  knex: any;
}

const app = express();
app.use(cors());
app.options("*", cors());
app.use(bodyParser());
app.use(CookieParser());

app.use((req: IExtendedRequest, res, next) => {
  req.knex = knex;
  return next();
});

app.get("/", (req, res) => {
  res
    .status(200)
    .send("Hello, from user-service!")
    .end();
});

gql(app);

(async () => {
  try {
    await knex.migrate.latest();
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Listening on port ${PORT}.`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
