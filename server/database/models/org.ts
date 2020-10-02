import BaseModel from './_base';

export interface IBillingInfo {
  billingEnabled?: boolean;
  stripeCustomerId?: string;
  stripeSource?: any;
  stripeSubscriptionId?: string;
  stripeToken?: string;
}

export default class Org extends BaseModel {
  id: string;
  projectId: string;
  name: string;
  billingInfo: IBillingInfo;
  billingEnabled: boolean;
  freeTier: boolean;

  static get tableName() {
    return 'orgs';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['projectId', 'name', 'billingInfo', 'billingEnabled', 'freeTier'],

      properties: {
        id: { type: 'string' },
        projectId: { type: 'string' },
        name: { type: 'string' },
        billingInfo: { type: 'json' },
        billingEnabled: { type: 'boolean' },
        freeTier: { type: 'boolean' },
      },
    };
  }
}
