import { verifyKey, InteractionType } from 'discord-interactions';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { checkReminders } from './tasks/checkReminders';
import { sendSettings } from './tasks/sendSettings';
import { deferEphemeral, respondPong } from './helpers/response';
import { handleComponentInteraction } from './handlers/componentInteractions';
import { handleContextMenuCommand } from './handlers/contextMenuCommands';
import { handleModalSubmission } from './handlers/modalSubmissions';
import { handleSlashCommand } from './handlers/slashCommands';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
// Eagerly resolve IAM credentials during cold start so the first handler
// invocation doesn't pay the IMDS latency cost inside the 3s Discord window.
lambdaClient.config.credentials().catch(() => {});

export const handler = async (event: any) => {
  console.log('Received event:', JSON.stringify(event));

  if (event.asyncTask === 'checkReminders') {
    await checkReminders();
    return { statusCode: 200 };
  }

  if (event.asyncTask === 'sendSettings') {
    await sendSettings({ interactionToken: event.interactionToken, discordUserId: event.discordUserId });
    return { statusCode: 200 };
  }

  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const rawBody = event.body ?? '';

  if (process.env.LOCAL_MODE !== 'true') {
    const isValid = verifyKey(rawBody, signature ?? '', timestamp ?? '', process.env.DISCORD_PUBLIC_KEY ?? '');
    if (!isValid) {
      return { statusCode: 401, body: 'Invalid request signature' };
    }
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return respondPong();
  }

  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    return handleComponentInteraction(interaction);
  }

  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    return handleModalSubmission(interaction);
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data.type === 3) {
    return handleContextMenuCommand(interaction);
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === 'settings') {
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
    await lambdaClient.send(new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify({ asyncTask: 'sendSettings', interactionToken: interaction.token, discordUserId })),
    }));
    return deferEphemeral();
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    return handleSlashCommand(interaction);
  }

  return { statusCode: 400, body: 'Unknown interaction type' };
};
