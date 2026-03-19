import { Reminders } from '../models/Reminder';
import { SavedMessages } from '../models/SavedMessage';
import { Users } from '../models/User';
import { dateTag } from '../helpers/discord';
import { respondEphemeral } from '../helpers/response';
import { messageLink } from '../helpers/discord';

export const handleSlashCommand = async (interaction: any) => {
  const { name, options } = interaction.data;
  const args = options?.map((o: any) => `${o.name}=${o.value}`).join(', ') ?? '';
  console.log(`Command: /${name}${args ? ` (${args})` : ''}`);

  if (name === 'saved') {
    const action = options?.find((o: any) => o.name === 'action')?.value;
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
    const user = await Users.findOrCreateByDiscordUserId(discordUserId);
    const mine = await SavedMessages.getAllForUser(user.id);

    if (action === 'list') {
      if (mine.length === 0) return respondEphemeral('You have no saved messages.');
      const lines = mine.map((r) => {
        return `- ${messageLink(r)}`;
      });
      return respondEphemeral(`Your saved messages:\n${lines.join('\n')}`);
    }

    if (action === 'clear') {
      if (mine.length === 0) return respondEphemeral('You have no saved messages to clear.');
      await Promise.all(mine.map((r) => SavedMessages.delete(r.id)));
      return respondEphemeral(`Cleared ${mine.length} saved message(s).`);
    }
  }

  if (name === 'remind') {
    const action = options?.find((o: any) => o.name === 'action')?.value;
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
    const user = await Users.findOrCreateByDiscordUserId(discordUserId);
    const mine = await Reminders.getAllForUser(user.id);

    if (action === 'list') {
      if (mine.length === 0) return respondEphemeral('You have no scheduled reminders.');
      const lines = mine.map((r) => {
        return `- ${messageLink(r)} — ${dateTag(r.remindAt)}`;
      });
      return respondEphemeral(`Your reminders:\n${lines.join('\n')}`);
    }

    if (action === 'clear') {
      if (mine.length === 0) return respondEphemeral('You have no reminders to clear.');
      await Promise.all(mine.map((r) => Reminders.delete(r.id)));
      return respondEphemeral(`Cleared ${mine.length} reminder(s).`);
    }
  }

  if (name === 'hello') {
    return respondEphemeral('Hello! I am Discord Sama, your serverless Discord bot powered by AWS Lambda! 🚀');
  }
};
