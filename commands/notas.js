const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser, nextId, save } = require('../utils/storage');
const { cut } = require('../utils/format');

const linea = n => `**#${n.id}** ${n.titulo}: ${n.contenido}`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notas')
    .setDescription('Guarda y consulta tus apuntes de estudio')
    .addSubcommand(s =>
      s
        .setName('agregar')
        .setDescription('Guarda una nota nueva')
        .addStringOption(o =>
          o.setName('titulo').setDescription('Título de la nota').setRequired(true).setMaxLength(100)
        )
        .addStringOption(o =>
          o.setName('contenido').setDescription('Contenido de la nota').setRequired(true).setMaxLength(1000)
        )
    )
    .addSubcommand(s => s.setName('listar').setDescription('Muestra todas tus notas'))
    .addSubcommand(s =>
      s
        .setName('buscar')
        .setDescription('Busca texto en tus notas')
        .addStringOption(o => o.setName('texto').setDescription('Texto a buscar').setRequired(true))
    )
    .addSubcommand(s =>
      s
        .setName('eliminar')
        .setDescription('Elimina una nota')
        .addIntegerOption(o =>
          o.setName('id').setDescription('ID de la nota').setRequired(true).setMinValue(1)
        )
    ),
  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const sub = interaction.options.getSubcommand();
    const responder = contenido =>
      interaction.reply({ content: cut(contenido), flags: MessageFlags.Ephemeral });

    if (sub === 'agregar') {
      const nota = {
        id: nextId(user, 'notas'),
        titulo: interaction.options.getString('titulo'),
        contenido: interaction.options.getString('contenido'),
        creada: Date.now()
      };
      user.notas.push(nota);
      save();
      return responder(`Nota guardada con ID **${nota.id}**.`);
    }

    if (sub === 'listar') {
      if (!user.notas.length) return responder('Todavía no tienes notas.');
      return responder(user.notas.map(linea).join('\n'));
    }

    if (sub === 'buscar') {
      const texto = interaction.options.getString('texto').toLowerCase();
      const resultados = user.notas.filter(
        n => n.titulo.toLowerCase().includes(texto) || n.contenido.toLowerCase().includes(texto)
      );
      if (!resultados.length) return responder('No encontré notas con ese texto.');
      return responder(resultados.map(linea).join('\n'));
    }

    const id = interaction.options.getInteger('id');
    const indice = user.notas.findIndex(n => n.id === id);
    if (indice === -1) return responder('No existe una nota con ese ID.');
    user.notas.splice(indice, 1);
    save();
    return responder(`Nota **${id}** eliminada.`);
  }
};
