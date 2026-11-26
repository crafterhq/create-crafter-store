import 'server-only';

import { CrafterPayments } from '@crafterpayments/node';
import { crafterEnvironment, requireEnv } from './env';

let instance: CrafterPayments | null = null;

/** Server-side CrafterPayments client. The secret key never leaves the server. */
export function payments(): CrafterPayments {
  instance ??= new CrafterPayments(requireEnv('CRAFTER_SECRET_KEY'), {
    environment: crafterEnvironment(),
    appInfo: 'create-crafter-store/0.1.0',
  });
  return instance;
}
