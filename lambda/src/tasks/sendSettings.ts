import { Users } from '../models/User';
import { buildSettingsMessage } from '../helpers/settings';
import { editOriginalResponse } from '../helpers/discord';

export const sendSettings = async ({ interactionToken, discordUserId, locale }: { interactionToken: string; discordUserId: string; locale: string }) => {
  console.log(`sendSettings: fetching settings for discord user ${discordUserId}`);
  const user = await Users.findOrCreateByDiscordUserId(discordUserId);
  const { content, components } = buildSettingsMessage(user, locale);
  await editOriginalResponse(interactionToken, { content, components });
  console.log(`sendSettings: delivered settings to discord user ${discordUserId}`);
};
