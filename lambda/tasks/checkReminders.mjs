import { Reminder } from '../models/Reminder.mjs';
import { messageLink, sendDirectMessage } from '../helpers/discord.mjs';

export const checkReminders = async () => {
  console.log('Running async task: checkReminders');
  const now = new Date();
  const due = await Reminder.getDue(now);
  console.log(`checkReminders: ${due.length} due reminder(s)`);
  await Promise.all(due.map(async (reminder) => {
    try {
      const link = messageLink(reminder);
      await sendDirectMessage(reminder.userId, `You asked me to remind you of ${link}`);
      await Reminder.delete(reminder.id);
      console.log(`checkReminders: sent reminder ${reminder.id} to user ${reminder.userId}`);
    } catch (err) {
      console.error(`checkReminders: failed for reminder ${reminder.id}:`, err);
    }
  }));
};
