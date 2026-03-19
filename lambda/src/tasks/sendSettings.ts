import { Users } from '../models/User';
import { buildSettingsMessage } from '../helpers/settings';
import { editOriginalResponse } from '../helpers/discord';

export const sendSettings = async ({ interactionToken, discordUserId }: { interactionToken: string; discordUserId: string }) => {
  console.log(`sendSettings: fetching settings for discord user ${discordUserId}`);
  const user = await Users.findOrCreateByDiscordUserId(discordUserId);
  const { content, components } = buildSettingsMessage(user);
  await editOriginalResponse(interactionToken, { content, components });
  console.log(`sendSettings: delivered settings to discord user ${discordUserId}`);
};
