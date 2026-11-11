import 'dotenv/config';
import { create } from '@bufbuild/protobuf';
import {
  type ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { type Envelope, EnvelopeSchema } from './generated/interlink/v1/interlink_pb.js';
import {
  generateNonce,
  getInterlinkClient,
  type InterlinkClient,
  resetInterlinkClient,
} from './interlink/client.js';
import {
  deactivate,
  forceOverride,
  generateCode,
  hasOverride,
  isAuthorizedUser,
  validateCode,
} from './override.js';
import { type BotState, loadState, saveState } from './storage.js';
import { calculateTime, formatTime } from './timekeeper.js';

const TOKEN = process.env['DISCORD_TOKEN'];
if (!TOKEN) {
  process.exit(1);
}

const ANNOUNCEMENT_CHANNEL_ID = '1520917412046700606';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const MS_PER_DAY = 86400000;

let state: BotState;

function getState(): BotState {
  if (state.baseRealTimestamp === 0) {
    state.baseRealTimestamp = Date.now();
    saveState(state);
  }
  return state;
}

function catchUpMissedMidnights(): void {
  if (state.paused) {
    return;
  }

  const now = Date.now();
  const baseDay = Date.UTC(
    new Date(state.baseRealTimestamp).getUTCFullYear(),
    new Date(state.baseRealTimestamp).getUTCMonth(),
    new Date(state.baseRealTimestamp).getUTCDate()
  );
  const today = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate()
  );

  if (today > baseDay) {
    const daysMissed = Math.floor((today - baseDay) / MS_PER_DAY);
    if (daysMissed > 0) {
      state.baseInGameYears += daysMissed * state.rateYears;
      state.baseRealTimestamp = today;
      saveState(state);
    }
  }
}

function isAdmin(interaction: ChatInputCommandInteraction): boolean {
  if (hasOverride(interaction.user.id)) {
    return true;
  }
  return interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator) ?? false;
}

async function announceYear(year: number): Promise<void> {
  try {
    const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
    if (channel && 'send' in channel) {
      const embed = new EmbedBuilder()
        .setTitle('New Year Begins')
        .setDescription(`The new year has begun! It is now **Year ${year}**.`)
        .setColor(0x5865f2);
      await (channel as { send: (msg: unknown) => unknown }).send({
        embeds: [embed],
      });
    }
  } catch {
    // Ignore errors sending announcement - non-critical
  }
}

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return midnight.getTime() - now.getTime();
}

function scheduleNextMidnight(): void {
  const delay = getMsUntilMidnight();
  setTimeout(midnightTick, delay);
}

async function midnightTick(): Promise<void> {
  if (state.paused) {
    scheduleNextMidnight();
    return;
  }

  const now = Date.now();
  const current = calculateTime(state, now);
  const year = Math.floor(current.totalYears);

  const todayMidnight = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate()
  );

  state.baseInGameYears = current.totalYears;
  state.baseRealTimestamp = todayMidnight;

  if (year > state.lastAnnouncedYear) {
    state.lastAnnouncedYear = year;
    saveState(state);
    await announceYear(year);
  } else {
    saveState(state);
  }

  scheduleNextMidnight();
}

async function handleTime(interaction: ChatInputCommandInteraction): Promise<void> {
  const s = getState();
  const result = calculateTime(s, Date.now());
  const embed = new EmbedBuilder()
    .setTitle('Current In-Game Time')
    .setDescription(formatTime(result))
    .setColor(0x5865f2);
  await interaction.reply({ embeds: [embed] });
}

async function handleSetRate(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAdmin(interaction)) {
    await interaction.reply({
      content: 'You need Administrator permission.',
      ephemeral: true,
    });
    return;
  }
  const years = interaction.options.getNumber('years', true);

  const s = getState();
  const now = Date.now();
  const current = calculateTime(s, now);

  s.baseInGameYears = current.totalYears;
  s.baseRealTimestamp = now;
  s.rateYears = years;
  s.totalPausedMs = 0;
  s.pausedAtMs = 0;
  s.paused = false;
  s.lastAnnouncedYear = Math.floor(current.totalYears);
  saveState(s);

  await interaction.reply(`Rate set to ${years} years per day.`);
}

async function handleSetTime(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAdmin(interaction)) {
    await interaction.reply({
      content: 'You need Administrator permission.',
      ephemeral: true,
    });
    return;
  }
  const years = interaction.options.getNumber('years', true);
  const s = getState();

  s.baseInGameYears = years;
  s.baseRealTimestamp = Date.now();
  s.totalPausedMs = 0;
  s.pausedAtMs = 0;
  s.paused = false;
  s.lastAnnouncedYear = Math.floor(years);
  saveState(s);

  await interaction.reply(`Time set to year ${Math.floor(years)}.`);
}

async function handlePause(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAdmin(interaction)) {
    await interaction.reply({
      content: 'You need Administrator permission.',
      ephemeral: true,
    });
    return;
  }
  const s = getState();
  if (s.paused) {
    await interaction.reply('Time is already paused.');
    return;
  }
  s.paused = true;
  s.pausedAtMs = Date.now();
  saveState(s);
  await interaction.reply('Time progression paused.');
}

async function handleResume(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAdmin(interaction)) {
    await interaction.reply({
      content: 'You need Administrator permission.',
      ephemeral: true,
    });
    return;
  }
  const s = getState();
  if (!s.paused) {
    await interaction.reply('Time is already running.');
    return;
  }
  s.totalPausedMs += Date.now() - s.pausedAtMs;
  s.pausedAtMs = 0;
  s.paused = false;
  saveState(s);
  await interaction.reply('Time progression resumed.');
}

async function handleReset(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAdmin(interaction)) {
    await interaction.reply({
      content: 'You need Administrator permission.',
      ephemeral: true,
    });
    return;
  }
  const s = getState();
  s.baseInGameYears = 0;
  s.baseRealTimestamp = Date.now();
  s.totalPausedMs = 0;
  s.pausedAtMs = Date.now();
  s.paused = true;
  s.lastAnnouncedYear = 0;
  saveState(s);
  await interaction.reply('Time has been reset to year 0 and paused.');
}

async function handleAnnounce(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isAdmin(interaction)) {
    await interaction.reply({
      content: 'You need Administrator permission.',
      ephemeral: true,
    });
    return;
  }
  try {
    const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
    if (!channel || !('send' in channel)) {
      await interaction.reply({
        content: 'Could not find the announcement channel.',
        ephemeral: true,
      });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('Taisca Time Bot')
      .setDescription(
        "Hey! Nice to meet you! I'll help you know what time it is in Taisca!\n\n" +
          "I'm programmed by <@1068324046422413373>!\n\n" +
          'Use `/time` to check the current in-game date and time. ' +
          'The world progresses in real-time, with years passing at a set rate each day. ' +
          'Keep an eye on <#1520917412046700606> for year milestones!'
      )
      .setColor(0x5865f2)
      .setTimestamp();
    await (channel as { send: (msg: unknown) => unknown }).send({
      embeds: [embed],
    });
    await interaction.reply({ content: 'Announcement sent!', ephemeral: true });
  } catch (_err) {
    await interaction.reply({
      content: 'Failed to send announcement.',
      ephemeral: true,
    });
  }
}

async function handleMaintenance(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  if (!isAuthorizedUser(userId)) {
    await interaction.reply({
      content: 'You are not authorized to use this command.',
      ephemeral: true,
    });
    return;
  }

  const mode = interaction.options.getString('mode', true);
  const code = interaction.options.getString('code');

  if (mode === 'off') {
    if (hasOverride(userId)) {
      deactivate(userId);
      await interaction.reply({
        content: 'Override mode deactivated.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'Override mode is not currently active.',
        ephemeral: true,
      });
    }
    return;
  }

  if (code) {
    const result = validateCode(userId, code);
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  generateCode(userId);
  await interaction.reply({
    content:
      'Override code generated and logged to console.\n\n' +
      'Check the Docker logs for the code, then run:\n' +
      '`/maintenance code:<your-code>`\n\n' +
      'The code expires in 5 minutes.',
    ephemeral: true,
  });
}

const commands = [
  new SlashCommandBuilder().setName('time').setDescription('Show current in-game time'),

  new SlashCommandBuilder()
    .setName('setrate')
    .setDescription('Set in-game years per day')
    .addNumberOption((opt) =>
      opt.setName('years').setDescription('In-game years per day').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('settime')
    .setDescription('Manually set the in-game year')
    .addNumberOption((opt) => opt.setName('years').setDescription('Year number').setRequired(true)),

  new SlashCommandBuilder().setName('pause').setDescription('Pause time progression'),

  new SlashCommandBuilder().setName('resume').setDescription('Resume time progression'),

  new SlashCommandBuilder().setName('reset').setDescription('Reset time to year 0 and pause'),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a greeting announcement to the announcement channel'),

  new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Override system for authorized user')
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Turn override on or off')
        .setRequired(true)
        .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })
    )
    .addStringOption((opt) =>
      opt.setName('code').setDescription('The override code from the logs').setRequired(false)
    ),
].map((c) => c.toJSON());

let interlinkClient: InterlinkClient | null = null;
let interlinkAbortController: AbortController | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let heartbeatFailures = 0;

const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_FAILURES_BEFORE_REREGISTER = 3;
const INTERLINK_PROTOCOL = 'apollo.interlink.v1';
const INTERLINK_VERSION = '1.0';

function createEnvelope(
  type: string,
  source: string,
  target: string,
  payload: Record<string, unknown>
): Envelope {
  return create(EnvelopeSchema, {
    protocol: INTERLINK_PROTOCOL,
    version: INTERLINK_VERSION,
    type,
    source,
    target,
    id: generateNonce(),
    timestamp: BigInt(Date.now()),
    nonce: generateNonce(),
    payload: new TextEncoder().encode(JSON.stringify(payload)),
    metadata: {},
  });
}

async function sendPong(
  interlinkClient: InterlinkClient,
  source: string,
  target: string
): Promise<void> {
  const envelope = createEnvelope('pong', source, target, {
    status: 'ok',
    uptime: process.uptime(),
  });
  try {
    await interlinkClient.send(envelope);
  } catch {
    // Ignore errors sending pong - non-critical
  }
}

async function handleIncomingEnvelope(
  envelope: Envelope,
  interlinkClient: InterlinkClient
): Promise<void> {
  try {
    const payload = JSON.parse(new TextDecoder().decode(envelope.payload));

    if (envelope.type === 'ping') {
      await sendPong(interlinkClient, envelope.target, envelope.source);
      return;
    }

    if (envelope.type === 'command') {
      const cmd = payload?.command as string | undefined;
      if (cmd === 'override') {
        const action = payload?.action as string | undefined;
        const userId = payload?.userId as string | undefined;

        let result: { success: boolean; message: string };

        if (action === 'activate' && userId) {
          const ok = forceOverride(userId);
          result = {
            success: ok,
            message: ok ? 'Override activated' : 'Failed to activate override',
          };
        } else if (action === 'deactivate' && userId) {
          const ok = deactivate(userId);
          result = {
            success: ok,
            message: ok ? 'Override deactivated' : 'Override was not active',
          };
        } else {
          result = {
            success: false,
            message: 'Invalid override command. Requires action and userId.',
          };
        }

        const responseEnvelope = createEnvelope(
          'command_response',
          envelope.target,
          envelope.source,
          {
            status: result.success ? 'ok' : 'error',
            message: result.message,
            originalId: envelope.id,
          }
        );

        try {
          await interlinkClient.send(responseEnvelope);
        } catch {
          // Ignore errors sending response - non-critical
        }
      }
    }
  } catch {
    // Ignore errors handling incoming envelope - non-critical
  }
}

async function startInterlinkClient(): Promise<void> {
  const interlinkAddress = process.env['INTERLINK_ADDRESS'];
  const interlinkAuthKey = process.env['INTERLINK_AUTH_KEY'];
  const botId = process.env['INTERLINK_BOT_ID'] || 'nrp-time-bot';

  if (!interlinkAddress || !interlinkAuthKey) {
    return;
  }

  if (interlinkAuthKey.length < 32) {
    console.warn('[Interlink] INTERLINK_AUTH_KEY is shorter than recommended minimum (32 chars)');
  }

  interlinkClient = getInterlinkClient({
    baseUrl: interlinkAddress,
    botId,
    authKey: interlinkAuthKey,
    capabilities: { commands: 'true', events: 'true' },
  });

  interlinkAbortController = new AbortController();
  const { signal } = interlinkAbortController;

  try {
    const registerResult = await interlinkClient.registerBot({
      botId,
      publicKey: '',
      endpoint: interlinkAddress,
      capabilities: { commands: 'true', events: 'true' },
      maxConcurrentStreams: 100,
    });

    if (!registerResult.success) {
      return;
    }

    heartbeatFailures = 0;
    heartbeatInterval = setInterval(async () => {
      if (!interlinkClient || signal.aborted) {
        return;
      }

      try {
        await interlinkClient.heartbeat({ botId, timestamp: BigInt(Date.now()) });
        heartbeatFailures = 0;
      } catch (_err) {
        heartbeatFailures += 1;

        if (heartbeatFailures >= HEARTBEAT_FAILURES_BEFORE_REREGISTER) {
          heartbeatFailures = 0;
          try {
            await interlinkClient?.registerBot({
              botId,
              publicKey: '',
              endpoint: interlinkAddress,
              capabilities: { commands: 'true', events: 'true' },
              maxConcurrentStreams: 100,
            });
          } catch {
            // Ignore re-registration errors - will retry on next heartbeat
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    if (typeof heartbeatInterval.unref === 'function') {
      heartbeatInterval.unref();
    }

    for await (const envelope of interlinkClient.subscribe(botId, [], { signal })) {
      if (signal.aborted) {
        break;
      }
      await handleIncomingEnvelope(envelope, interlinkClient);
    }

    if (signal.aborted) {
      return;
    }
  } catch {
    if (signal.aborted) {
      return;
    }
    // Ignore subscription errors - will attempt reconnect
  }
}

async function stopInterlinkClient(): Promise<void> {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (interlinkAbortController) {
    interlinkAbortController.abort();
    interlinkAbortController = null;
  }

  if (interlinkClient) {
    const botId = process.env['INTERLINK_BOT_ID'] || 'nrp-time-bot';
    try {
      await interlinkClient.unregisterBot(botId);
    } catch {
      // Ignore unregister errors during shutdown
    }
    interlinkClient = null;
  }

  resetInterlinkClient();
}

client.once('ready', async () => {
  state = loadState();

  if (state.baseRealTimestamp === 0) {
    state.baseRealTimestamp = Date.now();
    saveState(state);
  }

  catchUpMissedMidnights();
  scheduleNextMidnight();

  await startInterlinkClient();

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    const clientId = client.user?.id;
    if (clientId) {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
    }
  } catch {
    // Ignore command registration errors - non-critical
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    switch (interaction.commandName) {
      case 'time':
        await handleTime(interaction);
        break;
      case 'setrate':
        await handleSetRate(interaction);
        break;
      case 'settime':
        await handleSetTime(interaction);
        break;
      case 'pause':
        await handlePause(interaction);
        break;
      case 'resume':
        await handleResume(interaction);
        break;
      case 'reset':
        await handleReset(interaction);
        break;
      case 'announce':
        await handleAnnounce(interaction);
        break;
      case 'maintenance':
        await handleMaintenance(interaction);
        break;
      default:
        // Unknown command - should not happen with proper registration
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (!interaction.replied) {
      await interaction.reply({ content: `Error: ${msg}`, ephemeral: true });
    }
  }
});

process.on('SIGINT', async () => {
  await stopInterlinkClient();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopInterlinkClient();
  client.destroy();
  process.exit(0);
});

client.on('error', (err) => {
  console.error('[Discord] Client error:', err instanceof Error ? err.message : err);
});

client.on('shardError', (err) => {
  console.error('[Discord] Shard error:', err instanceof Error ? err.message : err);
});

client.on('rateLimit', (data) => {
  console.warn('[Discord] Rate limited:', JSON.stringify(data));
});

client.on('invalidSession', () => {
  console.warn('[Discord] Invalid session received; discord.js will re-identify.');
});

const LOGIN_BASE_DELAY_MS = 2000;
const LOGIN_MAX_DELAY_MS = 60000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginWithRetry(): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      await client.login(TOKEN);
      return;
    } catch (err) {
      attempt += 1;
      const delay = Math.min(LOGIN_BASE_DELAY_MS * 2 ** (attempt - 1), LOGIN_MAX_DELAY_MS);
      console.error(
        `[Discord] Login failed (attempt ${attempt}); retrying in ${delay / 1000}s:`,
        err instanceof Error ? err.message : err
      );
      await sleep(delay);
    }
  }
}

loginWithRetry();
