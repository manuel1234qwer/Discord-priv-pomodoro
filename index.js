require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const token = process.env.DISCORD_TOKEN;

if (!token || token === 'tu_token_del_bot') {
  console.error('Falta DISCORD_TOKEN en el archivo .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsDir, file));
  client.commands.set(command.data.name, command);
}

const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsDir, file));
  const register = event.once ? 'once' : 'on';
  client[register](event.name, (...args) => event.execute(...args));
}

process.on('unhandledRejection', error => console.error('Promesa rechazada:', error));

client.login(token);
