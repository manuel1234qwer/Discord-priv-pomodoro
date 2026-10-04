const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser, nextId, save } = require('../utils/storage');
const { cut } = require('../utils/format');

const linea = t =>
  `${t.hecha ? '✅' : '⬜'} **#${t.id}** ${t.descripcion}${t.entrega ? ` (entrega: ${t.entrega})` : ''}`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tareas')
    .setDescription('Organiza tus tareas y fechas de entrega')
    .addSubcommand(s =>
      s
        .setName('agregar')
        .setDescription('Agrega una tarea')
        .addStringOption(o =>
          o.setName('descripcion').setDescription('Qué tienes que hacer').setRequired(true).setMaxLength(200)
        )
        .addStringOption(o =>
          o.setName('entrega').setDescription('Fecha de entrega (texto libre)').setMaxLength(50)
        )
    )
    .addSubcommand(s => s.setName('listar').setDescription('Muestra tus tareas'))
    .addSubcommand(s =>
      s
        .setName('completar')
        .setDescription('Marca una tarea como hecha')
        .addIntegerOption(o =>
          o.setName('id').setDescription('ID de la tarea').setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand(s =>
      s
        .setName('eliminar')
        .setDescription('Elimina una tarea')
        .addIntegerOption(o =>
          o.setName('id').setDescription('ID de la tarea').setRequired(true).setMinValue(1)
        )
    ),
  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const sub = interaction.options.getSubcommand();
    const responder = contenido =>
      interaction.reply({ content: cut(contenido), flags: MessageFlags.Ephemeral });

    if (sub === 'agregar') {
      const tarea = {
        id: nextId(user, 'tareas'),
        descripcion: interaction.options.getString('descripcion'),
        entrega: interaction.options.getString('entrega'),
        hecha: false
      };
      user.tareas.push(tarea);
      save();
      return responder(`Tarea agregada con ID **${tarea.id}**.`);
    }

    if (sub === 'listar') {
      if (!user.tareas.length) return responder('No tienes tareas registradas.');
      const ordenadas = [...user.tareas].sort((a, b) => Number(a.hecha) - Number(b.hecha) || a.id - b.id);
      return responder(ordenadas.map(linea).join('\n'));
    }

    const id = interaction.options.getInteger('id');
    const indice = user.tareas.findIndex(t => t.id === id);
    if (indice === -1) return responder('No existe una tarea con ese ID.');

    if (sub === 'completar') {
      user.tareas[indice].hecha = true;
      save();
      return responder(`Tarea **${id}** completada.`);
    }

    user.tareas.splice(indice, 1);
    save();
    return responder(`Tarea **${id}** eliminada.`);
  }
};
