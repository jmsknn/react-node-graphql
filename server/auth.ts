'use strict';
import { AuthenticationError } from 'apollo-server-express';
import * as admin from 'firebase-admin';

export const decodeFirebaseToken = async (firebaseToken: string): Promise<admin.auth.DecodedIdToken> => {
  if (!firebaseToken || !firebaseToken.startsWith('Bearer ')) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a \'__session\' cookie.');
    throw new AuthenticationError('Unauthorized');
  }

  const idToken = firebaseToken.split('Bearer ')[1];
  return await admin.auth().verifyIdToken(idToken);
};
