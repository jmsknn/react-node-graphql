import { gql } from "apollo-server-express";
import * as fs from "fs";
import * as path from "path";

const typeDefs = [
  gql(fs.readFileSync(path.join(__dirname, "schema.gql"), "utf8")),
];

export default typeDefs;
