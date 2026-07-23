"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../hooks/useUser";
import Link from "next/link";
import { Send, MessageCircle, Flag } from "lucide-react";
import { Glass } from "../../components/ui";
import { useToast } from "../../components/Toast";

function ChatInner() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get("c") || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/chat").then((r) => r.json()).then((d) => {
      setConversations(d.conversations || []);
      if (!activeId && d.conversations?.[0]) setActiveId(d.conversations[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    let active = true;
    async function poll() {
      const res = await fetch(`/api/chat/${activeId}`);
      if (res.ok) {
        const data = await res.json();
        if (active) setMessages(data.messages || []);
      }
    }
    poll();
    const id = setInterval(poll, 4000);
    return () => { active = false; clearInterval(id); };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch(`/api/chat/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setText("");
    }
  }

  async function reportConversation() {
    if (!activeId) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "message", targetId: activeId, reason: "Denúncia enviada pelo chat" }),
    });
    toast("Denúncia enviada à moderação.", "success");
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <MessageCircle className="w-10 h-10 text-cyan-300 mx-auto mb-4" />
        <p className="text-white/50 mb-4">Entre na sua conta para acessar o chat.</p>
        <Link href="/login" className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Entrar</Link>
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-xl mb-6 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-cyan-300" /> Mensagens</h1>
      <div className="grid md:grid-cols-3 gap-4 h-[65vh]">
        <Glass className="rounded-2xl overflow-y-auto md:col-span-1">
          {conversations.length === 0 && <p className="p-5 text-white/40 text-sm">Nenhuma conversa ainda. Inicie uma pela página de um produto.</p>}
          {conversations.map((c) => {
            const other = c.buyerId === user.id ? c.seller : c.buyer;
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition ${activeId === c.id ? "bg-white/10" : ""}`}>
                <p className="text-sm font-semibold">{other.name}</p>
                {c.product && <p className="text-xs text-cyan-300/70">{c.product.title}</p>}
                <p className="text-xs text-white/40 line-clamp-1 mt-1">{c.messages[0]?.content || "Nenhuma mensagem ainda"}</p>
              </button>
            );
          })}
        </Glass>

        <Glass className="rounded-2xl flex flex-col md:col-span-2">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">Selecione uma conversa</div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm font-semibold">{active.buyerId === user.id ? active.seller.name : active.buyer.name}</p>
                <button onClick={reportConversation} className="text-white/30 hover:text-red-400"><Flag className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.senderId === user.id ? "bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]" : "bg-white/10"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
                <button type="submit" className="p-2.5 rounded-full bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]"><Send className="w-4 h-4" /></button>
              </form>
            </>
          )}
        </Glass>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-20 text-white/40">Carregando...</div>}>
      <ChatInner />
    </Suspense>
  );
}
