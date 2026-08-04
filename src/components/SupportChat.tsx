import { useState, useRef, useEffect } from "react";
import { Headphones, X, Send } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Message {
  id: number | string;
  message: string;
  sender: string;
  created_at?: string;
}

const PHONE = "237671461340";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textToSend = input;
    setInput("");

    const { data, error } = await supabase
      .from("messages")
      .insert([{ sender: "user", message: textToSend }])
      .select();

    if (error) {
      console.error("Erreur lors de l'envoi du message :", error.message);
    } else if (data && data[0]) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data[0].id);
        if (exists) return prev;
        return [...prev, data[0] as Message];
      });
    }
  };

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[91] flex items-center gap-2 rounded-full bg-primary-700 text-white pl-4 pr-5 py-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-sm font-semibold">Support</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 left-6 z-[92] w-[calc(100vw-3rem)] max-w-sm animate-scale-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col" style={{ height: "28rem" }}>
            {/* Header */}
            <div className="bg-primary-700 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Support client</p>
                  <p className="text-xs text-primary-200">En ligne • Yaoundé & Douala</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.sender === "user"
                      ? "bg-primary-600 text-white rounded-br-sm"
                      : "bg-white border border-neutral-200 text-neutral-700 rounded-bl-sm"
                  }`}>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick contact WhatsApp */}
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100">
              <a
                href={`https://wa.me/${PHONE}?text=Bonjour,%20je%20souhaite%20commander%20des%20épices`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 font-semibold hover:underline"
              >
                Contacter directement sur WhatsApp →
              </a>
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-neutral-200 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Votre message..."
                className="flex-1 text-sm rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 focus:outline-none focus:border-primary-400"
              />
              <button type="submit" className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}