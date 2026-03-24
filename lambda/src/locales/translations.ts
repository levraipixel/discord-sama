const translations = {
  en: {
    remindDateModal: {
      title: 'Schedule a reminder',
      label: 'When?',
      placeholder: 'e.g. "in 2 weeks", "June 6 at 10pm", "2026-04-15"',
    },
    reminder: {
      dm: '⏰ {link}',
    },
    remind1h: {
      success: "Got it! I'll remind you about this message {date}. ⏰",
    },
    remindTomorrow: {
      success: "Got it! I'll remind you about this message {date}. ⏰",
    },
    remindDateSubmit: {
      parseError: 'I couldn\'t understand "{input}". Try something like "in 2 weeks", "June 6 at 10pm", or "2026-04-15".',
      pastDateError: 'Please provide a future date.',
      success: "Got it! I'll remind you about this message {date}. ⏰",
    },
    saveLater: {
      success: 'Saved! Use `/saved list` to see your saved messages.',
    },
    saved: {
      list: {
        empty: 'You have no saved messages.',
        result: 'Your saved messages:\n{list}',
      },
      clear: {
        empty: 'You have no saved messages to clear.',
        success: 'Cleared {count} saved message(s).',
      }
    },
    remind: {
      list: {
        empty: 'You have no scheduled reminders.',
        result: 'Your reminders:\n{list}',
      },
      clear: {
        empty: 'You have no reminders to clear.',
        success: 'Cleared {count} reminder(s).',
      }
    },
    hello: {
      message: 'Hello! I am Discord Sama, your serverless Discord bot powered by AWS Lambda! 🚀',
    },
    settings: {
      content: '**Settings**\nTimezone: **{timezone}** · Daily reminder: **{time}**',
      timezone: 'Timezone',
      reminderHour: 'Reminder hour',
      reminderMinutes: 'Reminder minutes',
    },
  },
  fr: {
    remindDateModal: {
      title: 'Planifier un rappel',
      label: 'Quand ?',
      placeholder: 'ex. "dans 2 semaines", "6 juin à 22h", "2026-04-15"',
    },
    reminder: {
      dm: '⏰ {link}',
    },
    remind1h: {
      success: 'Reçu ! Je te rappellerai ce message {date}. ⏰',
    },
    remindTomorrow: {
      success: 'Reçu ! Je te rappellerai ce message {date}. ⏰',
    },
    remindDateSubmit: {
      parseError: 'Je n\'ai pas compris "{input}". Essaie quelque chose comme "dans 2 semaines", "le 6 juin à 22h", ou "le 15/04/2026".',
      pastDateError: 'Merci de fournir une date dans le futur.',
      success: 'Reçu ! Je te rappellerai ce message {date}. ⏰',
    },
    saveLater: {
      success: 'Sauvegardé ! Utilise `/saved list` pour voir tes messages sauvegardés.',
    },
    saved: {
      list: {
        empty: 'Tu n\'as aucun message sauvegardé.',
        result: 'Tes messages sauvegardés :\n{list}',
      },
      clear: {
        empty: 'Tu n\'as aucun message sauvegardé à supprimer.',
        success: '{count} message(s) sauvegardé(s) supprimé(s).',
      }
    },
    remind: {
      list: {
        empty: 'Tu n\'as aucun rappel planifié.',
        result: 'Tes rappels :\n{list}',
      },
      clear: {
        empty: 'Tu n\'as aucun rappel à supprimer.',
        success: '{count} rappel(s) supprimé(s).',
      }
    },
    hello: {
      message: 'Bonjour ! Je suis Discord Sama, ton bot Discord serverless propulsé par AWS Lambda ! 🚀',
    },
    settings: {
      content: '**Paramètres**\nFuseau horaire : **{timezone}** · Rappel quotidien : **{time}**',
      timezone: 'Fuseau horaire',
      reminderHour: 'Heure du rappel',
      reminderMinutes: 'Minutes du rappel',
    },
  },
} as const;

export default translations;
