import { useState, useRef, useEffect } from "react";
import { Headphones, X, Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: number | string;
  message: string;
  sender: string;
  session_id?: string;
  created_at?: string;
}

const PHONE = "237671461340";

// Initialisation de l'IA Gemini avec ta clé sécurisée du fichier .env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Fonction intelligente qui appelle l'IA en se faisant passer pour le support de VERHOJUST
const getGeminiResponse = async (userMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: "Tu es l'assistant du service client officiel de VERHOJUST, une entreprise spécialisée dans la vente d'épices et de piments à Yaoundé et Douala au Cameroun. Tu réponds de manière polie, chaleureuse, naturelle et professionnelle en français. Ne dis JAMAIS que tu es une intelligence artificielle ou un robot. Si on te demande des prix ou des commandes complexes, invite poliment le client à nous contacter sur WhatsApp au 237671461340. Tes réponses doivent être courtes et directes, comme un vrai conseiller sur un site web."
      }
    });
    
    return response.text || "Merci pour votre message ! Pour une réponse immédiate, n'hésitez pas à nous contacter sur WhatsApp.";
  } catch (error) {
    console.error("Erreur Gemini :", error);
    return "Bonjour ! Pour une assistance rapide, vous pouvez nous écrire directement sur WhatsApp au " + PHONE + ".";
  }
};

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Récupérer ou créer un identifiant de session unique pour ce client dans le navigateur
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

    // Écouter les nouveaux messages en temps réel pour cette session spécifique
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const textToSend = input;
    setInput("");

    // 1. Enregistrer le message de l'utilisateur dans Supabase
    const { data, error } = await supabase
      .from("messages")
      .insert([{ sender: "user", message: textToSend, session_id: sessionId }])
      .select();

    if (error) {
      console.error("Erreur lors de l'envoi du message :", error.message);
      return;
    } 
    
    if (data && data[0]) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data[0].id);
        if (exists) return prev;
        return [...prev, data[0] as Message];
      });
    }

    // 2. Interroger Gemini pour obtenir la réponse intelligente
    const botReplyText = await getGeminiResponse(textToSend);

    // 3. Enregistrer la réponse de l'assistant dans Supabase
    const { data: botData, error: botError } = await supabase
      .from("messages")
      .insert([{ sender: "assistant", message: botReplyText, session_id: sessionId }])
      .select();

    if (!botError && botData && botData[0]) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === botData[0].id);
        if (exists) return prev;
        return [...prev, botData[0] as Message];
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