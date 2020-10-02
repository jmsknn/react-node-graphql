import { Model, snakeCaseMappers } from 'objection';
import _ from 'lodash';
import utils from '../../utils';

export default class BaseModel extends Model {
  static uniqueFields = [];

  static async findManyWithPagination(filter: any = {}, page: number = 0, pageSize: number = 100) {
    return await this.query()
      .where(filter)
      .limit(pageSize)
      .offset(page * pageSize);
  }

  static async upsertMany(docs: any[]) {
    if (_.isEmpty(docs)) {
      return [];
    }
    const knex = this.knex();
    const mapper = snakeCaseMappers();

    let conflictSet = '';
    const tableName = this.tableName;

    const docShape = {};

    // Make sure all the keys are available on the doc
    _.each(docs, (d) => {
      _.extend(docShape, d);
    });

    if (_.isEmpty(docShape)) {
      return [];
    }

    const formattedDocShape = mapper.format(docShape);

    for (const key of Object.keys(formattedDocShape)) {
      conflictSet += `${key}=EXCLUDED.${key}, `;
    }

    // Remove the trailing comma on the raw query
    conflictSet = conflictSet.substring(0, conflictSet.length - 2);

    // Create the raw query.
    // eg: "? ON CONFLICT (uniqueField) DO UPDATE SET value=EXCLUDED.value RETURNING *; "
    const rawQuery = `? ON CONFLICT (${this.uniqueFields.join(',')}) DO UPDATE SET ${conflictSet} RETURNING *;`;

    const result = await knex.raw(rawQuery, [knex(tableName).insert(docs)]);

    // Return an array of upserted items, with camelized keys
    return result?.rows?.map(utils.camelizeKeys) || [];
  }

  static async upsertOne(doc: any) {
    const upsertedDoc = await this.upsertMany([doc]);
    return upsertedDoc?.[0];
  }
}
