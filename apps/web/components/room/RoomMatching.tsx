"use client"

import { MessageCircle, Send, Wifi, WifiOff } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ChatMessage = {
  senderId?: string
  message: string
  timestamp?: string
}

export default function RoomMatching({ roomId }: { roomId: string }) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [selfId, setSelfId] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const newSocket = io("http://localhost:3001")

    newSocket.on("connect", () => {
      setConnected(true)
      setSelfId(newSocket.id)
      setNotice(null)
      newSocket.emit("join-room", roomId)
    })
    newSocket.on("disconnect", () => {
      setConnected(false)
      setSelfId(undefined)
    })
    newSocket.on("connect_error", () => {
      setConnected(false)
      setNotice("Arena chat is offline. You can still solve problems and submit your project.")
    })
    newSocket.on("receive-message", (data: ChatMessage) => {
      setMessages((current) => [...current, data])
    })

    socketRef.current = newSocket
    return () => {
      socketRef.current = null
      newSocket.disconnect()
    }
  }, [roomId])

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const socket = socketRef.current
    if (!socket || !message.trim()) return

    const text = message.trim()
    setMessages((current) => [
      ...current,
      {
        senderId: socket.id,
        message: text,
        timestamp: new Date().toISOString(),
      },
    ])
    socket.emit("send-message", { roomId, message: text })
    setMessage("")
  }

  return (
    <section className="mt-4 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hg-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-3.5 text-[var(--hg-cyan)]" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hg-text)]">
            Arena chat
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide ${
            connected ? "text-emerald-400" : "text-[var(--hg-dim)]"
          }`}
        >
          {connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          {connected ? "Connected" : "Offline"}
        </span>
      </div>

      {notice ? (
        <p className="border-b border-[var(--hg-border)] px-4 py-2 text-[11px] text-amber-300">{notice}</p>
      ) : null}

      <div className="max-h-52 min-h-24 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-[11px] text-[var(--hg-dim)]">
            No messages yet. Say hello when the arena chat is online.
          </p>
        ) : (
          messages.map((item, index) => {
            const own = item.senderId === selfId
            return (
              <div
                key={`${item.timestamp ?? index}-${index}`}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                  own
                    ? "ml-auto bg-[var(--hg-cyan)]/12 text-[var(--hg-text)]"
                    : "bg-white/5 text-[var(--hg-muted)]"
                }`}
              >
                <span className="mr-2 font-mono text-[9px] uppercase tracking-wide text-[var(--hg-dim)]">
                  {own ? "You" : "Peer"}
                </span>
                {item.message}
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-[var(--hg-border)] p-3">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={connected ? "Message your peers…" : "Chat unavailable"}
          disabled={!connected}
          aria-label="Chat message"
          className="h-9 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[12px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
        />
        <Button
          type="submit"
          disabled={!connected || !message.trim()}
          className="hg-gradient-bg h-9 rounded-lg! px-3 text-[12px] font-bold text-[#101426]"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </section>
  )
}
