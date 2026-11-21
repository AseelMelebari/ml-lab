import type { Config } from '@netlify/functions';
import { processOutbox } from './_lib/outbox';

/** Scheduled every 5 minutes: retries pending / failed emails with backoff. */
export default async () => {
  const result = await processOutbox({ limit: 40 });
  console.log(JSON.stringify({ event: 'outbox_scheduled_run', ...result }));
  return new Response('ok');
};

export const config: Config = { schedule: '*/5 * * * *' };
