import { useState, useRef, useEffect } from "react";
import { Headphones, X, Send } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Message {
  id: number | string;
  message: string;
  sender: string;
  session_id?: string;
  created_at?: string;
}

const PHONE = "237671461340";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let storedSessionId = localStorage.getItem("verhojust_chat_session");
    if (!storedSessionId) {
      storedSessionId = "session_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("verhojust_chat_session", storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    if (!open || !sessionId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`public:messages:session_id=eq.${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
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
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userText = input;
    setInput("");

    // 1. On envoie le message de l'utilisateur dans Supabase
    const { data: userMsgData, error: userError } = await supabase
      .from("messages")
      .insert([{ sender: "user", message: userText, session_id: sessionId }])
      .select();

    if (userError || !userMsgData || !userMsgData[0]) return;

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === userMsgData[0].id);
      if (exists) return prev;
      return [...prev, userMsgData[0] as Message];
    });

    // 2. Vérification s'il s'agit du tout premier message de CETTE session (aucun message d'assistant n'existe encore dans l'historique chargé)
    const hasAssistantRepliedBefore = messages.some((m) => m.sender === "assistant");

    if (!hasAssistantRepliedBefore) {
      setTimeout(async () => {
        const welcomeText = "Bonjour ! Merci d'avoir contacté Verhojust. Un conseiller prend le relais pour vous répondre dans un instant.";
        
        const { data: botData, error: botError } = await supabase
          .from("messages")
          .insert([{ sender: "assistant", message: welcomeText, session_id: sessionId }])
          .select();

        if (!botError && botData && botData[0]) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === botData[0].id);
            if (exists) return prev;
            return [...prev, botData[0] as Message];
          });
        }
      }, 500);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[91] flex items-center gap-2 rounded-full bg-primary-700 text-white pl-4 pr-5 py-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Headphones className="w-5 h-5" />
          <span className="text-sm font-semibold">Support</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 left-6 z-[92] w-[calc(100vw-3rem)] max-w-sm animate-scale-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col" style={{ height: "35rem" }}>
            <div className="bg-primary-700 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Support Verhojust</p>
                  <p className="text-xs text-primary-200">En ligne</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
                      m.sender === "user"
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "bg-white border border-neutral-200 text-neutral-700 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
              <a
                href={`https://wa.me/${PHONE}?text=Bonjour,%20je%20souhaite%20joindre%20Vérhojust`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>💬 Contacter Vérhojust sur WhatsApp</span>
              </a>
            </div>

            <form onSubmit={sendMessage} className="p-2.5 border-t border-neutral-200 flex items-end gap-2 bg-white">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Posez votre question..."
                rows={1}
                className="flex-1 text-sm rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 focus:outline-none focus:border-primary-400 resize-none max-h-20 overflow-y-auto"
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