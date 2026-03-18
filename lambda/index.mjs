import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { checkReminders } from './tasks/checkReminders.mjs';
import { handleContextMenuCommand } from './handlers/contextMenuCommands.mjs';
import { handleModalSubmission } from './handlers/modalSubmissions.mjs';
import { handleSlashCommand } from './handlers/slashCommands.mjs';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
// Eagerly resolve IAM credentials during cold start so the first handler
// invocation doesn't pay the IMDS latency cost inside the 3s Discord window.
lambdaClient.config.credentials().catch(() => {});

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  if (event.asyncTask === 'checkReminders') {
    await checkReminders();
    return { statusCode: 200 };
  }

  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const rawBody = event.body ?? '';

  if (process.env.LOCAL_MODE !== 'true') {
    const isValid = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return { statusCode: 401, body: 'Invalid request signature' };
    }
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: InteractionResponseType.PONG }),
    };
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data.type === 3) {
    return handleContextMenuCommand(interaction);
  }

  if (interaction.type === 5) { // MODAL_SUBMIT
    return handleModalSubmission(interaction);
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    return handleSlashCommand(interaction);
  }

  return { statusCode: 400, body: 'Unknown interaction type' };
};
