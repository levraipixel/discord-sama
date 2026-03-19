import { Users } from '../models/User';
import { buildSettingsMessage } from '../helpers/settings';
import { respondUpdateMessage } from '../helpers/response';

export const handleComponentInteraction = async (interaction: any) => {
  const { custom_id, values } = interaction.data;
  const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
  const user = await Users.findOrCreateByDiscordUserId(discordUserId);

  if (custom_id === 'settings:language') {
    const language = values[0] as 'en' | 'fr';
    await Users.update(user.id, { language });
    const { content, components } = buildSettingsMessage({ ...user, language });
    return respondUpdateMessage(content, components);
  }

  if (custom_id === 'settings:timezone') {
    const timezone = values[0] as string;
    await Users.update(user.id, { timezone });
    const { content, components } = buildSettingsMessage({ ...user, timezone });
    return respondUpdateMessage(content, components);
  }

  if (custom_id === 'settings:reminderHour') {
    const dailyReminderHour = parseInt(values[0], 10);
    await Users.update(user.id, { dailyReminderHour });
    const { content, components } = buildSettingsMessage({ ...user, dailyReminderHour });
    return respondUpdateMessage(content, components);
  }

  if (custom_id === 'settings:reminderMinutes') {
    const dailyReminderMinutes = parseInt(values[0], 10);
    await Users.update(user.id, { dailyReminderMinutes });
    const { content, components } = buildSettingsMessage({ ...user, dailyReminderMinutes });
    return respondUpdateMessage(content, components);
  }
};
