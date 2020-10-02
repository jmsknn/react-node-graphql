import {
  ApolloError,
  ForbiddenError,
} from "apollo-server";
import Knex, { Config } from "knex";
import { camelCase, isEmpty, mapKeys } from "lodash";
import knexconfig from "./database/knexfile";

const knex = Knex(knexconfig as Config);

const projectIdToOrgId = async (projectId: string): Promise<string> => {
  const orgId = (await knex("projects").select("org_id").where({ id: projectId }).first()).orgId;
  return orgId;
};

const itemIdToProjectId = async (itemId: number): Promise<string> => {
  const projectId = (await knex
    .select("collections.project_id")
    .from("collections")
    .join("collection_items", "collection_items.collection_id", "=", "collections.id")
    .where({
      "collection_items.id": itemId,
    })
    .first()).projectId;
  return projectId;
};

const itemIdToCollectionId = async (itemId: number): Promise<string> => {
  const collectionId = (await knex
    .select("collection_items.collection_id")
    .from("collection_items")
    .where({
      "collection_items.id": itemId,
    })
    .first()).collectionId;
  return collectionId;
};

const imageLabelIdToProjectId = async (labelId: number): Promise<string> => {
  const projectId = (await knex
    .select("collections.project_id")
    .from("collections")
    .join("collection_items", "collection_items.collection_id", "=", "collections.id")
    .join("image_categorical_labels", "image_categorical_labels.item_id", "=", "collection_items.id")
    .where({
      "image_categorical_labels.id": labelId,
    })
    .first()).projectId;
  return projectId;
};

const queueIdToProjectId = async (queueId: number): Promise<string> => {
  const projectId = (await knex
    .select("collections.project_id")
    .from("collections")
    .join("review_queues", "review_queues.collection_id", "=", "collections.id")
    .where({
      "review_queues.id": queueId,
    })
    .first()).projectId;
  return projectId;
};

const categorySetIdToProjectId = async (categorySetId: string): Promise<string> => {
  const projectId = (await knex
    .select("collections.project_id")
    .from("collections")
    .join("category_sets", "category_sets.collection_id", "=", "collections.id")
    .where({
      "category_sets.id": categorySetId,
    })
    .first()).projectId;
  return projectId;
};

const getCollectionItemCount = async (collectionId: string): Promise<number> => {
  const count = await knex("collection_items")
    .count("id")
    .where({
      collection_id: collectionId,
    })
    .first();
  return parseInt(count.count as string, 10);
};

const handleModifiedItem = async (itemId: number, email: string): Promise<void> => {
  // Delete queue item if it is complete
  await knex("label_queue")
  .where({
    item_id: itemId,
    status: "complete",
  }).del();
  // Delete queue item if it is in progress by another user
  await knex("label_queue")
    .select("email")
    .where({
      item_id: itemId,
      status: "in_progress",
    })
    .whereNot({
      labeler: email,
    })
    .del();

  // Delete queue item if it is approved
  await knex("review_queue_items")
    .where({
      item_id: itemId,
      status: "approved",
    }).del();
  // Delete queue item if it is in progress by another user
  await knex("review_queue_items")
    .select("email")
    .where({
      item_id: itemId,
      status: "under_review",
    })
    .whereNot({
      email,
    })
    .del();
};

const toJson = (str) => {
  return JSON.stringify(str, null, 2);
};

export default {
  toJson,
  projectIdToOrgId,
  itemIdToProjectId,
  itemIdToCollectionId,
  imageLabelIdToProjectId,
  categorySetIdToProjectId,
  queueIdToProjectId,
  getCollectionItemCount,
  handleModifiedItem,
  camelizeKeys: (obj) => {
    if (isEmpty(obj)) {
      return obj;
    }
    return mapKeys(obj, (v, k) => camelCase(k));
  },
};
