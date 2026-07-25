// social-fi-webhook.ts — Phase 4, Agent-8: a REAL CrawlerDataSource to
// replace crawler-bridge.ts's mock data source — an HTTP server that
// handles X (Twitter) and Telegram webhook traffic.
//
// HONESTY NOTE: this environment has no real X Developer account /
// Telegram Bot token / publicly reachable webhook URL — so this was NOT
// tested against real live X/Telegram traffic. Instead, it was verified
// end-to-end with synthetic payloads against both platforms' OFFICIAL,
// documented payload shapes (the Telegram Bot API `Update` object, the
// X API v2 tweet object + the X Account Activity API CRC handshake).
// What real integration would additionally require: (1) on the Telegram
// side, `setWebhook(url, secret_token)`, (2) on the X side, an Account
// Activity API subscription + CRC verification (this file correctly
// implements the CRC handshake). Uses node:http — a single file, no new
// dependency added.

import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { EventEmitter } from 'node:events'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { CrawlerDataSource, CrawlerEvent } from './crawler-bridge'

// ============ Telegram Bot API — official Update shape ============
// https://core.telegram.org/bots/api#update

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number; is_bot: boolean; first_name: string; username?: string }
    chat: { id: number; type: string; title?: string }
    date: number
    text?: string
  }
}

function telegramUpdateToCrawlerEvent(update: TelegramUpdate): CrawlerEvent | null {
  const msg = update.message
  if (!msg?.text) return null
  const actor = msg.from?.username ?? `tg-user-${msg.from?.id ?? 'unknown'}`
  return {
    source: 'telegram',
    id: `tg-${update.update_id}`,
    actor,
    summary: msg.text,
  }
}

// ============ X (Twitter) — API v2 tweet object ============
// https://developer.x.com/en/docs/x-api/data-dictionary/object-model/tweet

interface XWebhookPayload {
  data?: {
    id: string
    text: string
    author_id: string
    created_at?: string
  }
  includes?: {
    users?: { id: string; username: string; name?: string }[]
  }
}

function xWebhookToCrawlerEvent(payload: XWebhookPayload): CrawlerEvent | null {
  const tweet = payload.data
  if (!tweet) return null
  const user = payload.includes?.users?.find((u) => u.id === tweet.author_id)
  const actor = user?.username ?? `x-user-${tweet.author_id}`
  return {
    source: 'x',
    id: `x-${tweet.id}`,
    actor,
    summary: tweet.text,
  }
}

// ============ HTTP helpers ============

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf-8')
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

// ============ Source ============

export interface SocialFiWebhookOptions {
  port?: number
  /**
   * X Account Activity API consumer secret — required to answer the CRC
   * (Challenge-Response Check) handshake X sends via GET before it will
   * deliver webhook events. Never logged, never written to a file by
   * this module — pass via an env var at the call site.
   */
  xConsumerSecret?: string
  /**
   * Telegram's optional shared-secret header
   * (X-Telegram-Bot-Api-Secret-Token, set via setWebhook's
   * secret_token param). If provided, requests missing/mismatching it
   * are rejected. Strongly recommended for any public-facing deploy.
   */
  telegramSecretToken?: string
}

/**
 * Implements CrawlerDataSource by running an HTTP server with two
 * webhook endpoints (POST /webhook/telegram, POST /webhook/x) plus the
 * GET /webhook/x CRC handshake X's Account Activity API requires before
 * subscribing. subscribe() receives events from BOTH platforms — check
 * `event.source` to distinguish them.
 */
export class SocialFiWebhookSource extends EventEmitter implements CrawlerDataSource {
  private server: Server

  constructor(private options: SocialFiWebhookOptions = {}) {
    super()
    this.server = createServer((req, res) => {
      this.handleRequest(req, res).catch((err) => {
        sendJson(res, 500, { error: String(err?.message ?? err) })
      })
    })
  }

  listen(port?: number): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port ?? this.options.port ?? 8788, () => resolve())
    })
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()))
    })
  }

  subscribe(onEvent: (event: CrawlerEvent) => void): () => void {
    this.on('event', onEvent)
    return () => this.off('event', onEvent)
  }

  private emitEvent(event: CrawlerEvent): void {
    this.emit('event', event)
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (req.method === 'GET' && url.pathname === '/webhook/x') {
      return this.handleXCrc(url, res)
    }
    if (req.method === 'POST' && url.pathname === '/webhook/x') {
      return this.handleXEvent(req, res)
    }
    if (req.method === 'POST' && url.pathname === '/webhook/telegram') {
      return this.handleTelegramEvent(req, res)
    }

    sendJson(res, 404, { error: 'not found' })
  }

  // X Account Activity API CRC handshake: X sends
  // GET /webhook/x?crc_token=XXXX and expects
  // { response_token: "sha256=" + base64(HMAC-SHA256(consumer_secret, crc_token)) }.
  // Without answering this correctly, X never activates the webhook.
  private handleXCrc(url: URL, res: ServerResponse): void {
    const crcToken = url.searchParams.get('crc_token')
    if (!crcToken) {
      sendJson(res, 400, { error: 'missing crc_token' })
      return
    }
    if (!this.options.xConsumerSecret) {
      sendJson(res, 500, { error: 'xConsumerSecret not configured' })
      return
    }
    const hmac = createHmac('sha256', this.options.xConsumerSecret).update(crcToken).digest('base64')
    sendJson(res, 200, { response_token: `sha256=${hmac}` })
  }

  private async handleXEvent(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await readBody(req)
    let payload: XWebhookPayload
    try {
      payload = JSON.parse(body)
    } catch {
      sendJson(res, 400, { error: 'invalid JSON' })
      return
    }

    const event = xWebhookToCrawlerEvent(payload)
    if (event) this.emitEvent(event)
    sendJson(res, 200, { ok: true })
  }

  private async handleTelegramEvent(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (this.options.telegramSecretToken) {
      const provided = req.headers['x-telegram-bot-api-secret-token']
      if (!isValidSecret(provided, this.options.telegramSecretToken)) {
        sendJson(res, 401, { error: 'invalid secret token' })
        return
      }
    }

    const body = await readBody(req)
    let update: TelegramUpdate
    try {
      update = JSON.parse(body)
    } catch {
      sendJson(res, 400, { error: 'invalid JSON' })
      return
    }

    const event = telegramUpdateToCrawlerEvent(update)
    if (event) this.emitEvent(event)
    sendJson(res, 200, { ok: true })
  }
}

function isValidSecret(provided: string | string[] | undefined, expected: string): boolean {
  if (typeof provided !== 'string') return false
  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(providedBuf, expectedBuf)
}
