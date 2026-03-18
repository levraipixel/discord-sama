import { Reminder } from '../models/Reminder.mjs';
import { SavedMessage } from '../models/SavedMessage.mjs';
import { dateTag } from '../helpers/discord.mjs';
import { respondEphemeral } from '../helpers/response.mjs';
import { messageLink } from '../helpers/discord.mjs';

export const handleSlashCommand = async (interaction) => {
  const { name, options } = interaction.data;
  const args = options?.map((o) => `${o.name}=${o.value}`).join(', ') ?? '';
  console.log(`Command: /${name}${args ? ` (${args})` : ''}`);

  if (name === 'saved') {
    const action = options?.find((o) => o.name === 'action')?.value;
    const userId = interaction.member?.user?.id ?? interaction.user?.id;
    const mine = await SavedMessage.getAllForUser(userId);

    if (action === 'list') {
      if (mine.length === 0) return respondEphemeral('You have no saved messages.');
      const lines = mine.map((r) => {
        return `- ${messageLink(r)}`;
      });
      return respondEphemeral(`Your saved messages:\n${lines.join('\n')}`);
    }

    if (action === 'clear') {
      if (mine.length === 0) return respondEphemeral('You have no saved messages to clear.');
      await Promise.all(mine.map((r) => SavedMessage.delete(r.id)));
      return respondEphemeral(`Cleared ${mine.length} saved message(s).`);
    }
  }

  if (name === 'remind') {
    const action = options?.find((o) => o.name === 'action')?.value;
    const userId = interaction.member?.user?.id ?? interaction.user?.id;
    const mine = await Reminder.getAllForUser(userId);

    if (action === 'list') {
      if (mine.length === 0) return respondEphemeral('You have no scheduled reminders.');
      const lines = mine.map((r) => {
        return `- ${messageLink(r)} — ${dateTag(r.remindAt)}`;
      });
      return respondEphemeral(`Your reminders:\n${lines.join('\n')}`);
    }

    if (action === 'clear') {
      if (mine.length === 0) return respondEphemeral('You have no reminders to clear.');
      await Promise.all(mine.map((r) => Reminder.delete(r.id)));
      return respondEphemeral(`Cleared ${mine.length} reminder(s).`);
    }
  }

  if (name === 'hello') {
    return respondEphemeral('Hello! I am Discord Sama, your serverless Discord bot powered by AWS Lambda! 🚀');
  }
};
