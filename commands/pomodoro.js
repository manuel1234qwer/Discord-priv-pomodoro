const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const sesiones = new Map();

const avisar = async (sesion, texto) => {
  try {
    await sesion.canal.send(`<@${sesion.usuario.id}> ${texto}`);
  } catch {
    await sesion.usuario.send(texto).catch(() => {});
  }
};

const iniciarFase = sesion => {
  const minutos = sesion.fase === 'estudio' ? sesion.estudio : sesion.descanso;
  sesion.fin = Date.now() + minutos * 60000;
  sesion.timeout = setTimeout(async () => {
    if (sesion.fase === 'estudio') {
      if (sesion.ciclo >= sesion.ciclos) {
        sesiones.delete(sesion.usuario.id);
        await avisar(sesion, `Terminaste los ${sesion.ciclos} bloques. ¡Buen trabajo!`);
        return;
      }
      sesion.fase = 'descanso';
      await avisar(sesion, `Fin del bloque ${sesion.ciclo}. Descansa ${sesion.descanso} minutos.`);
    } else {
      sesion.ciclo++;
      sesion.fase = 'estudio';
      await avisar(
        sesion,
        `Descanso terminado. Empieza el bloque ${sesion.ciclo} de ${sesion.ciclos}: ${sesion.estudio} minutos de estudio.`
      );
    }
    if (sesiones.get(sesion.usuario.id) !== sesion) return;
    iniciarFase(sesion);
  }, minutos * 60000);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pomodoro')
    .setDescription('Temporizador de estudio con descansos')
    .addSubcommand(s =>
      s
        .setName('iniciar')
        .setDescription('Inicia una sesión pomodoro')
        .addIntegerOption(o =>
          o.setName('estudio').setDescription('Minutos de estudio (por defecto 25)').setMinValue(1).setMaxValue(120)
        )
        .addIntegerOption(o =>
          o.setName('descanso').setDescription('Minutos de descanso (por defecto 5)').setMinValue(1).setMaxValue(60)
        )
        .addIntegerOption(o =>
          o.setName('ciclos').setDescription('Número de bloques (por defecto 4)').setMinValue(1).setMaxValue(8)
        )
    )
    .addSubcommand(s => s.setName('estado').setDescription('Muestra el estado de tu sesión'))
    .addSubcommand(s => s.setName('detener').setDescription('Detiene tu sesión actual')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.user.id;
    const privado = contenido => interaction.reply({ content: contenido, flags: MessageFlags.Ephemeral });

    if (sub === 'iniciar') {
      if (sesiones.has(id)) return privado('Ya tienes una sesión activa. Usa `/pomodoro detener` primero.');
      const sesion = {
        usuario: interaction.user,
        canal: interaction.channel,
        estudio: interaction.options.getInteger('estudio') ?? 25,
        descanso: interaction.options.getInteger('descanso') ?? 5,
        ciclos: interaction.options.getInteger('ciclos') ?? 4,
        ciclo: 1,
        fase: 'estudio',
        fin: 0,
        timeout: null
      };
      sesiones.set(id, sesion);
      iniciarFase(sesion);
      return interaction.reply(
        `Sesión iniciada: ${sesion.ciclos} bloques de ${sesion.estudio} min con descansos de ${sesion.descanso} min. ¡A estudiar, <@${id}>!`
      );
    }

    const sesion = sesiones.get(id);
    if (!sesion) return privado('No tienes ninguna sesión activa.');

    if (sub === 'estado') {
      const fin = Math.floor(sesion.fin / 1000);
      return privado(
        `Bloque ${sesion.ciclo} de ${sesion.ciclos}, fase de ${sesion.fase}. Termina <t:${fin}:R>.`
      );
    }

    clearTimeout(sesion.timeout);
    sesiones.delete(id);
    return privado('Sesión detenida.');
  }
};
