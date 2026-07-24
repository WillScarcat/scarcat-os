'use client'

// Scarcat OS Komuta Merkezi — 3 panel: A2A Intent Mempool, ClawScore
// canlı, sistem logları. swarm-boot.ts + openclaw-node.ts'ten bir
// WebSocket sunucusu (bkz. swarm-boot.ts#startMonitorServer) üzerinden
// beslenir.
//
// Bu dosya sadece CLIENT — WS sunucusu ayrı bir process
// (swarm-boot.ts#startMonitorServer) olarak çalışır ve MonitorMessage
// tipini (bkz. swarm-boot.ts) JSON olarak yayınlar. Görsel stil
// will-dapp'in mevcut konvansiyonlarını (glass-card, wc-mono, dark
// tema) izliyor — sıfırdan bir tasarım dili icat edilmedi.
//
// Bu ortamda çalışan bir dev server olmadığı için görsel olarak
// render edilip test edilmedi — sadece gerçek React/viem tiplerine
// karşı tsc --strict ile doğrulandı.

import { useEffect, useMemo, useRef, useState } from 'react'

// ---- Ortak protokol tipi — swarm-boot.ts#startMonitorServer ile aynı ----

export type MonitorMessage =
  | { type: 'intent'; from: string; to: string; amount: string; taskId: string; timestamp: number }
  | { type: 'agent-registry'; agent: string; label: string; registered: boolean; timestamp: number }
  | { type: 'claw-score'; agentId: string; label: string; address: string; cs100: number; tier: string; timestamp: number }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string; timestamp: number }

const MAX_ROWS = 50

function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatAmount(raw: string): string {
  try {
    const wei = BigInt(raw)
    const whole = wei / 10n ** 18n
    return whole.toLocaleString()
  } catch {
    return raw
  }
}

// ============ Connection hook ============

function useMonitorSocket(wsUrl: string) {
  const [connected, setConnected] = useState(false)
  const [intents, setIntents] = useState<Extract<MonitorMessage, { type: 'intent' }>[]>([])
  const [registryEvents, setRegistryEvents] = useState<Extract<MonitorMessage, { type: 'agent-registry' }>[]>([])
  const [scores, setScores] = useState<Map<string, Extract<MonitorMessage, { type: 'claw-score' }>>>(new Map())
  const [logs, setLogs] = useState<Extract<MonitorMessage, { type: 'log' }>[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    let socket: WebSocket

    function connect() {
      if (cancelled) return
      socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => setConnected(true)
      socket.onclose = () => {
        setConnected(false)
        if (!cancelled) setTimeout(connect, 2000)
      }
      socket.onerror = () => socket.close()

      socket.onmessage = (event) => {
        let msg: MonitorMessage
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        if (msg.type === 'intent') {
          setIntents((prev) => [msg, ...prev].slice(0, MAX_ROWS))
        } else if (msg.type === 'agent-registry') {
          setRegistryEvents((prev) => [msg, ...prev].slice(0, MAX_ROWS))
        } else if (msg.type === 'claw-score') {
          setScores((prev) => new Map(prev).set(msg.agentId, msg))
        } else if (msg.type === 'log') {
          setLogs((prev) => [msg, ...prev].slice(0, MAX_ROWS))
        }
      }
    }

    connect()
    return () => {
      cancelled = true
      socketRef.current?.close()
    }
  }, [wsUrl])

  return { connected, intents, registryEvents, scores, logs }
}

// ============ Panels ============

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className="wc-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        color: connected ? '#4ade80' : '#ff5c5c',
        background: connected ? 'rgba(74,222,128,0.1)' : 'rgba(255,92,92,0.1)',
        border: `1px solid ${connected ? 'rgba(74,222,128,0.3)' : 'rgba(255,92,92,0.3)'}`,
      }}
    >
      {connected ? '● LIVE' : '○ RECONNECTING'}
    </span>
  )
}

function MempoolPanel({ intents }: { intents: Extract<MonitorMessage, { type: 'intent' }>[] }) {
  return (
    <div className="glass-card p-4">
      <h2 className="wc-mono text-xs font-bold uppercase tracking-wider text-white mb-3">
        A2A Intent Mempool
      </h2>
      {intents.length === 0 ? (
        <p className="text-xs text-gray-500">Henüz intent yok.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
          {intents.map((intent, i) => (
            <li
              key={`${intent.taskId}-${i}`}
              className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="wc-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {formatTime(intent.timestamp)}
              </span>
              <span className="wc-mono text-[10px] text-white truncate">
                {shortAddr(intent.from)} → {shortAddr(intent.to)}
              </span>
              <span className="wc-mono text-[10px] font-bold" style={{ color: '#CCFF00' }}>
                {formatAmount(intent.amount)} WILL
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ClawScorePanel({ scores }: { scores: Map<string, Extract<MonitorMessage, { type: 'claw-score' }>> }) {
  const sorted = useMemo(() => Array.from(scores.values()).sort((a, b) => b.cs100 - a.cs100), [scores])

  const tierColor = (tier: string) => {
    if (tier === 'Scarcat') return '#CCFF00'
    if (tier === 'Fang') return '#38bdf8'
    if (tier === 'Claw') return '#a855f7'
    return 'rgba(255,255,255,0.4)'
  }

  return (
    <div className="glass-card p-4">
      <h2 className="wc-mono text-xs font-bold uppercase tracking-wider text-white mb-3">
        Claw Score — Canlı
      </h2>
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-500">Henüz skor yok.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
          {sorted.map((s) => (
            <li
              key={s.agentId}
              className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-white font-semibold">{s.label}</span>
              <span className="wc-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {shortAddr(s.address)}
              </span>
              <span className="wc-mono text-[10px] font-bold" style={{ color: tierColor(s.tier) }}>
                {s.cs100.toFixed(1)} · {s.tier}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LogPanel({ logs }: { logs: Extract<MonitorMessage, { type: 'log' }>[] }) {
  const levelColor = (level: string) => {
    if (level === 'error') return '#ff5c5c'
    if (level === 'warn') return '#ffb84d'
    return 'rgba(255,255,255,0.6)'
  }

  return (
    <div className="glass-card p-4">
      <h2 className="wc-mono text-xs font-bold uppercase tracking-wider text-white mb-3">
        Sistem Logları
      </h2>
      {logs.length === 0 ? (
        <p className="text-xs text-gray-500">Henüz log yok.</p>
      ) : (
        <ul className="flex flex-col gap-1 max-h-80 overflow-y-auto wc-mono text-[10px]">
          {logs.map((log, i) => (
            <li key={i} style={{ color: levelColor(log.level) }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>[{formatTime(log.timestamp)}]</span>{' '}
              {log.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ============ Main export ============

export interface ScarcatMonitorProps {
  /** e.g. ws://localhost:8787 — see swarm-boot.ts#startMonitorServer */
  wsUrl: string
}

export default function ScarcatMonitor({ wsUrl }: ScarcatMonitorProps) {
  const { connected, intents, scores, logs } = useMonitorSocket(wsUrl)

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-white">Scarcat OS — Komuta Merkezi</h1>
          <ConnectionBadge connected={connected} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MempoolPanel intents={intents} />
          <ClawScorePanel scores={scores} />
          <LogPanel logs={logs} />
        </div>
      </div>
    </div>
  )
}
