const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { cut } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Muestra los comandos disponibles'),
  async execute(interaction) {
    const lineas = [];
    for (const comando of interaction.client.commands.values()) {
      const json = comando.data.toJSON();
      const subcomandos = (json.options || []).filter(o => o.type === 1);
      if (!subcomandos.length) {
        lineas.push(`\`/${json.name}\` — ${json.description}`);
      } else {
        for (const sub of subcomandos) {
          lineas.push(`\`/${json.name} ${sub.name}\` — ${sub.description}`);
        }
      }
    }
    await interaction.reply({
      content: cut(`**Comandos disponibles**\n${lineas.join('\n')}`),
      flags: MessageFlags.Ephemeral
    });
  }
};
