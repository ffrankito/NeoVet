import { ChatWidget } from "@/components/chat-widget";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
       <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
        <img src="/neovet-logo-transparent.png" alt="NeoVet" className="w-8 h-8 object-contain" />
        </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">NeoVet</p>
            <p className="text-xs text-zinc-400">Asistente virtual</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatWidget />
        </div>
      </div>
    </main>
  );
}