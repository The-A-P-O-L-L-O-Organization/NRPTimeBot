import { randomBytes } from "node:crypto";
import { createClient, type CallOptions, type Client } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { createPromiseClient } from "@connectrpc/connect";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { clone, create, isMessage, toJson, type DescMessage, type MessageShape } from "@bufbuild/protobuf";
import { InterlinkService } from "../generated/interlink/v1/interlink_connect.js";
import {
  EnvelopeSchema,
  GetBotInfoRequestSchema,
  HeartbeatRequestSchema,
  ListBotsRequestSchema,
  RegisterBotRequestSchema,
  SubscribeRequestSchema,
  UnregisterBotRequestSchema,
  type BotInfo,
  type Envelope,
  type HeartbeatResponse,
  type ListBotsResponse,
  type RegisterBotResponse,
  type SendResponse,
  type UnregisterBotResponse,
} from "../generated/interlink/v1/interlink_pb.js";

const INTERLINK_AUTH_SCHEME = "HMAC-SHA256";
const INTERLINK_TIMESTAMP_HEADER = "X-Interlink-Timestamp";
const INTERLINK_NONCE_HEADER = "X-Interlink-Nonce";
const INTERLINK_BOT_HEADER = "X-Interlink-Bot";

export type InterlinkServiceClient = Client<typeof InterlinkService>;

export interface InterlinkClientOptions {
  baseUrl: string;
  botId: string;
  authKey: string;
  capabilities?: Record<string, string>;
  client?: InterlinkServiceClient;
}

interface HashedBody<Desc extends DescMessage> {
  schema: Desc;
  message: MessageShape<Desc>;
}

export function emptyBodyHash(): string {
  return bytesToHex(sha256(new Uint8Array(0)));
}

export function bodyHashOf<Desc extends DescMessage>(schema: Desc, message: MessageShape<Desc>): string {
  const normalized = clone(schema, message);
  sortMapFields(schema, normalized);
  return bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(toJson(schema, normalized)))));
}

function canonicalString(procedure: string, timestamp: string, nonce: string, bodyHash: string): string {
  return [procedure, timestamp, nonce, bodyHash].join("\n");
}

export function signRequest(
  authKey: string,
  procedure: string,
  timestamp: string,
  nonce: string,
  bodyHash: string
): string {
  const signature = hmac(sha256, new TextEncoder().encode(authKey), new TextEncoder().encode(canonicalString(procedure, timestamp, nonce, bodyHash)));
  return Buffer.from(signature).toString("base64");
}

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

function procedureFor(methodName: string): string {
  return `/${InterlinkService.typeName}/${methodName}`;
}

function isMapRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Uint8Array);
}

function sortMapFields<Desc extends DescMessage>(schema: Desc, message: MessageShape<Desc>): void {
  const record = message as unknown as Record<string, unknown>;
  for (const field of schema.fields) {
    const value = record[field.localName];
    if (field.fieldKind === "map" && isMapRecord(value)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(value).sort()) {
        const entry = value[key];
        sorted[key] = entry;
        if (field.mapKind === "message" && isMessage(entry, field.message)) {
          sortMapFields(field.message, entry);
        }
      }
      record[field.localName] = sorted;
    } else if (field.fieldKind === "message" && isMessage(value, field.message)) {
      sortMapFields(field.message, value);
    } else if (field.fieldKind === "list" && field.listKind === "message" && Array.isArray(value)) {
      for (const item of value) {
        if (isMessage(item, field.message)) {
          sortMapFields(field.message, item);
        }
      }
    }
  }
}

export class InterlinkClient {
  private readonly client: InterlinkServiceClient;
  private readonly botId: string;
  private readonly authKey: string;
  private readonly capabilities: Record<string, string>;

  constructor(options: InterlinkClientOptions) {
    this.botId = options.botId;
    this.authKey = options.authKey;
    this.capabilities = options.capabilities ?? { commands: "true", events: "true" };

    if (options.client) {
      this.client = options.client;
      return;
    }

    const transport = createConnectTransport({
      baseUrl: options.baseUrl,
      httpVersion: "2",
    });
    this.client = createPromiseClient(InterlinkService, transport);
  }

  private async headersFor<Desc extends DescMessage>(
    procedure: string,
    body: HashedBody<Desc> | null
  ): Promise<Record<string, string>> {
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const bodyHash = body === null ? emptyBodyHash() : bodyHashOf(body.schema, body.message);

    const headers: Record<string, string> = {
      [INTERLINK_TIMESTAMP_HEADER]: timestamp,
      [INTERLINK_NONCE_HEADER]: nonce,
      [INTERLINK_BOT_HEADER]: this.botId,
      Authorization: `${INTERLINK_AUTH_SCHEME} ${signRequest(this.authKey, procedure, timestamp, nonce, bodyHash)}`,
    };

    return headers;
  }

  private async callOptions<Desc extends DescMessage>(
    procedure: string,
    body: HashedBody<Desc> | null,
    options?: CallOptions
  ): Promise<CallOptions> {
    const headers = await this.headersFor(procedure, body);
    return { ...options, headers };
  }

  async send(envelope: Envelope, options?: CallOptions): Promise<SendResponse> {
    const message = create(EnvelopeSchema, envelope);
    const callOpts = await this.callOptions(procedureFor(InterlinkService.methods.send.name), { schema: EnvelopeSchema, message }, options);
    return this.client.send(message, callOpts) as Promise<SendResponse>;
  }

  async *subscribe(botId: string, messageTypes: string[] = [], options?: CallOptions): AsyncIterable<Envelope> {
    const message = create(SubscribeRequestSchema, { botId, messageTypes });
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const bodyHash = bodyHashOf(SubscribeRequestSchema, message);
    const headers = {
      Authorization: `${INTERLINK_AUTH_SCHEME} ${signRequest(this.authKey, procedureFor(InterlinkService.methods.subscribe.name), timestamp, nonce, bodyHash)}`,
      [INTERLINK_TIMESTAMP_HEADER]: timestamp,
      [INTERLINK_NONCE_HEADER]: nonce,
      [INTERLINK_BOT_HEADER]: botId,
    };
    const stream = this.client.subscribe(message, { ...options, headers }) as unknown as AsyncIterable<Envelope>;
    for await (const envelope of stream) {
      yield envelope;
    }
  }

  async registerBot(
    request: { botId: string; publicKey: string; endpoint: string; capabilities: Record<string, string>; maxConcurrentStreams: number },
    options?: CallOptions
  ): Promise<RegisterBotResponse> {
    const message = create(RegisterBotRequestSchema, request);
    const callOpts = await this.callOptions(procedureFor(InterlinkService.methods.registerBot.name), { schema: RegisterBotRequestSchema, message }, options);
    return this.client.registerBot(message, callOpts) as Promise<RegisterBotResponse>;
  }

  async heartbeat(request: { botId: string; timestamp: bigint }, options?: CallOptions): Promise<HeartbeatResponse> {
    const message = create(HeartbeatRequestSchema, request);
    const callOpts = await this.callOptions(procedureFor(InterlinkService.methods.heartbeat.name), { schema: HeartbeatRequestSchema, message }, options);
    return this.client.heartbeat(message, callOpts) as Promise<HeartbeatResponse>;
  }

  async unregisterBot(botId: string, options?: CallOptions): Promise<UnregisterBotResponse> {
    const message = create(UnregisterBotRequestSchema, { botId });
    const callOpts = await this.callOptions(procedureFor(InterlinkService.methods.unregisterBot.name), { schema: UnregisterBotRequestSchema, message }, options);
    return this.client.unregisterBot(message, callOpts) as Promise<UnregisterBotResponse>;
  }

  async listBots(options?: CallOptions): Promise<ListBotsResponse> {
    const message = create(ListBotsRequestSchema, {});
    const callOpts = await this.callOptions(procedureFor(InterlinkService.methods.listBots.name), { schema: ListBotsRequestSchema, message }, options);
    return this.client.listBots(message, callOpts) as Promise<ListBotsResponse>;
  }

  async getBotInfo(botId: string, options?: CallOptions): Promise<BotInfo> {
    const message = create(GetBotInfoRequestSchema, { botId });
    const callOpts = await this.callOptions(procedureFor(InterlinkService.methods.getBotInfo.name), { schema: GetBotInfoRequestSchema, message }, options);
    return this.client.getBotInfo(message, callOpts) as Promise<BotInfo>;
  }
}

let singletonClient: InterlinkClient | null = null;

export function getInterlinkClient(options: InterlinkClientOptions): InterlinkClient {
  if (!singletonClient) {
    singletonClient = new InterlinkClient(options);
  }
  return singletonClient;
}

export function resetInterlinkClient(): void {
  singletonClient = null;
}