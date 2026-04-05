"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export function ChatWidget() {
  const [error, setError] = useState<string | null>(null);

  const { messages, input, setInput, append, status } = useChat({
    api: "/api/chat",
    onError: (err) => {
      if (err.message?.includes("429")) {
        setError("Demasiadas consultas. Esperá un momento antes de escribir de nuevo.");
      } else {
        setError("No pudimos conectar con el asistente. Intentá de nuevo en unos segundos.");
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleQuickReply(text: string) {
    append({ role: "user", content: text });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setError(null);
    const text = input;
    setInput("");
    await append({ role: "user", content: text });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-400 text-sm mt-8">
            <p className="text-2xl mb-3">🐾</p>
            <p className="font-medium text-zinc-600">¡Hola! Soy el asistente de NeoVet.</p>
            <p className="mt-1">¿En qué te puedo ayudar?</p>
            <div className="mt-6 flex flex-col gap-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="text-left text-sm px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-zinc-900 text-white rounded-br-sm"
                  : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
              }`}
            >
              {message.role === "user" ? (
                message.content
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5">{children}</ul>,
                    li: ({ children }) => <li>{children}</li>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="border-t border-zinc-100 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu consulta..."
            disabled={isLoading}
            className="flex-1 text-sm rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400 disabled:opacity-50 placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}

const QUICK_REPLIES = [
  "¿Cuáles son los horarios?",
  "¿Cómo saco un turno?",
  "¿Qué servicios ofrecen?",
  "¿Dónde están ubicados?",
];

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M14 8L2 2l2.5 6L2 14l12-6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}