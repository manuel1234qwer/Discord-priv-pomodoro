const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const comandos = [...client.commands.values()].map(c => c.data.toJSON());
    try {
      if (process.env.GUILD_ID) {
        await client.application.commands.set(comandos, process.env.GUILD_ID);
      } else {
        await client.application.commands.set(comandos);
      }
      console.log(`Comandos registrados: ${comandos.length}`);
    } catch (error) {
      console.error('No se pudieron registrar los comandos:', error);
    }
    client.user.setActivity('Ayudando a estudiar | /ayuda');
    console.log(`Conectado como ${client.user.tag}`);
  }
};
