import { Reminders } from '../models/Reminder';
import { Users } from '../models/User';
import { messageLink, sendMessage } from '../helpers/discord';

export const checkReminders = async () => {
  console.log('Running async task: checkReminders');
  const now = new Date();
  const due = await Reminders.getDue(now);
  console.log(`checkReminders: ${due.length} due reminder(s)`);
  await Promise.all(due.map(async (reminder) => {
    try {
      const user = await Users.findById(reminder.userId);
      if (!user) throw new Error(`User not found: ${reminder.userId}`);
      
      const link = messageLink(reminder);
      await sendMessage(user.dmChannelId, `You asked me to remind you of ${link}`);
      await Reminders.delete(reminder.id);
      console.log(`checkReminders: sent reminder ${reminder.id} to user ${reminder.userId}`);
    } catch (err) {
      console.error(`checkReminders: failed for reminder ${reminder.id}:`, err);
    }
  }));
};
