const {
  SlashCommandBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const { getUser, nextId, save } = require('../utils/storage');
const { cut } = require('../utils/format');

const boton = (id, etiqueta, estilo) =>
  new ButtonBuilder().setCustomId(id).setLabel(etiqueta).setStyle(estilo);

const fila = (...botones) => new ActionRowBuilder().addComponents(...botones);

const mezclar = lista => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

const repasar = async (interaction, tarjetas) => {
  const mazo = mezclar(tarjetas);
  let indice = 0;
  let aciertos = 0;

  const encabezado = () =>
    `**Tarjeta ${indice + 1} de ${mazo.length}**\n${cut(mazo[indice].pregunta, 900)}`;
  const resumen = () => `**Repaso terminado**\nAcertaste ${aciertos} de ${indice} tarjetas repasadas.`;
  const botonesPregunta = () => [
    fila(
      boton('mostrar', 'Mostrar respuesta', ButtonStyle.Primary),
      boton('salir', 'Terminar', ButtonStyle.Secondary)
    )
  ];
  const botonesRespuesta = () => [
    fila(
      boton('acerte', 'La sabía', ButtonStyle.Success),
      boton('falle', 'No la sabía', ButtonStyle.Danger),
      boton('salir', 'Terminar', ButtonStyle.Secondary)
    )
  ];

  await interaction.reply({
    content: encabezado(),
    components: botonesPregunta(),
    flags: MessageFlags.Ephemeral
  });
  const mensaje = await interaction.fetchReply();
  const colector = mensaje.createMessageComponentCollector({
    componentType: ComponentType.Button,
    idle: 180000,
    time: 1800000
  });

  colector.on('collect', async b => {
    if (b.customId === 'mostrar') {
      await b.update({
        content: `${encabezado()}\n\n**Respuesta:** ${cut(mazo[indice].respuesta, 900)}`,
        components: botonesRespuesta()
      });
      return;
    }
    if (b.customId === 'acerte' || b.customId === 'falle') {
      if (b.customId === 'acerte') aciertos++;
      indice++;
      if (indice < mazo.length) {
        await b.update({ content: encabezado(), components: botonesPregunta() });
        return;
      }
    }
    colector.stop('terminado');
    await b.update({ content: resumen(), components: [] });
  });

  colector.on('end', (_, razon) => {
    if (razon !== 'terminado') {
      interaction.editReply({ content: resumen(), components: [] }).catch(() => {});
    }
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flashcards')
    .setDescription('Crea tarjetas de estudio y repásalas')
    .addSubcommand(s =>
      s
        .setName('agregar')
        .setDescription('Crea una tarjeta nueva')
        .addStringOption(o =>
          o.setName('pregunta').setDescription('Pregunta o concepto').setRequired(true).setMaxLength(500)
        )
        .addStringOption(o =>
          o.setName('respuesta').setDescription('Respuesta').setRequired(true).setMaxLength(500)
        )
    )
    .addSubcommand(s => s.setName('listar').setDescription('Muestra tus tarjetas'))
    .addSubcommand(s =>
      s
        .setName('eliminar')
        .setDescription('Elimina una tarjeta')
        .addIntegerOption(o =>
          o.setName('id').setDescription('ID de la tarjeta').setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand(s => s.setName('repasar').setDescription('Repasa tus tarjetas en orden aleatorio')),
  async execute(interaction) {
    const user = getUser(interaction.user.id);
    const sub = interaction.options.getSubcommand();
    const responder = contenido =>
      interaction.reply({ content: cut(contenido), flags: MessageFlags.Ephemeral });

    if (sub === 'agregar') {
      const tarjeta = {
        id: nextId(user, 'tarjetas'),
        pregunta: interaction.options.getString('pregunta'),
        respuesta: interaction.options.getString('respuesta')
      };
      user.tarjetas.push(tarjeta);
      save();
      return responder(`Tarjeta creada con ID **${tarjeta.id}**.`);
    }

    if (sub === 'listar') {
      if (!user.tarjetas.length) return responder('Todavía no tienes tarjetas.');
      return responder(user.tarjetas.map(t => `**#${t.id}** ${t.pregunta}`).join('\n'));
    }

    if (sub === 'eliminar') {
      const id = interaction.options.getInteger('id');
      const indice = user.tarjetas.findIndex(t => t.id === id);
      if (indice === -1) return responder('No existe una tarjeta con ese ID.');
      user.tarjetas.splice(indice, 1);
      save();
      return responder(`Tarjeta **${id}** eliminada.`);
    }

    if (!user.tarjetas.length) return responder('Crea tarjetas con `/flashcards agregar` para poder repasar.');
    return repasar(interaction, user.tarjetas);
  }
};
