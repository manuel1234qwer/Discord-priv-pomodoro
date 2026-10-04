const { SlashCommandBuilder } = require('discord.js');
const { cut } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('libros')
    .setDescription('Busca libros por título, autor o tema')
    .addStringOption(o =>
      o.setName('consulta').setDescription('Título, autor o tema').setRequired(true).setMaxLength(100)
    ),
  async execute(interaction) {
    const consulta = interaction.options.getString('consulta');
    await interaction.deferReply();

    const params = new URLSearchParams({ q: consulta, maxResults: '5', printType: 'books' });
    if (process.env.GOOGLE_BOOKS_API_KEY) params.set('key', process.env.GOOGLE_BOOKS_API_KEY);

    const respuesta = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
    if (!respuesta.ok) throw new Error(`Google Books respondió ${respuesta.status}`);

    const datos = await respuesta.json();
    const items = datos.items || [];
    if (!items.length) return interaction.editReply('No encontré libros para esa búsqueda.');

    const lineas = items.map(({ volumeInfo: v }) => {
      const autores = v.authors ? ` — ${v.authors.join(', ')}` : '';
      const anio = v.publishedDate ? ` (${v.publishedDate.slice(0, 4)})` : '';
      return `**${v.title}**${autores}${anio}\n<${v.infoLink}>`;
    });
    return interaction.editReply(cut(lineas.join('\n\n')));
  }
};
