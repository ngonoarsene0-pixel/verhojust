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
const FACEBOOK_URL = "https://www.facebook.com/RodeMF";

const QUICK_TIPS = [
  { label: "📦 Comment commander ?", reply: "Pour commander chez Verhojust :\n1. Ajoutez vos épices ou piments au panier.\n2. Allez dans votre panier et validez.\n3. Renseignez vos informations et validez !" },
  { label: "💳 Vérifier mon paiement", reply: "Pour vérifier votre paiement, écrivez : 'Paiement [Votre Nom]' ou 'Paiement [Votre Numéro]'." },
  { label: "🔍 Suivre ma commande", reply: "Pour suivre votre commande, écrivez : 'Suivi [Votre Nom]' ou 'Suivi [Votre Numéro]'." },
  { label: "📞 Contacter Vérhojust", reply: "Besoin d'aide ? Joignez directement Vérhojust sur WhatsApp au " + PHONE + " !" }
];

const getDynamicResponse = async (userMessage: string, sessionId: string, clientName?: string): Promise<string> => {
  const msg = userMessage.toLowerCase().trim();
  const titleName = clientName ? ` ${clientName}` : "";

  // Salutations et message de bienvenue personnalisé avec lien HTML cliquable
  if (msg.includes("bonjour") || msg.includes("salut") || msg.includes("bonsoir") || msg.includes("coucou")) {
    return `Bonjour et bienvenue chez Verhojust${titleName} ! Nous sommes ravis de vous compter parmi nous. N'hésitez pas à découvrir toutes nos nouveautés et nos publications sur notre <a href="${FACEBOOK_URL}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">page Facebook officielle</a>. Comment puis-je vous aider aujourd'hui ?`;
  }

  // Vérification de paiement
  if (msg.includes("paiement") || msg.includes("payer")) {
    try {
      const words = msg.split(" ");
      const queryTerm = words.find(w => w.length > 2 && w !== "paiement" && w !== "de" && w !== "mon");

      if (!queryTerm) {
        return "Veuillez taper par exemple : **'Paiement [Votre Nom]'** pour que je vérifie.";
      }

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .or(`customer_name.ilike.%${queryTerm}%,phone.ilike.%${queryTerm}%`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && orders && orders.length > 0) {
        const order = orders[0];
        const status = (order.payment_status || order.status || "").toLowerCase();
        if (status.includes("paid") || status.includes("succes") || status.includes("validé")) {
          return `✅ Oui, votre paiement a bien abouti ! Montant : ${order.total_amount || 'N/C'} FCFA.`;
        } else if (status.includes("fail") || status.includes("echou")) {
          return `❌ Non, le paiement a échoué. Votre commande n'a pas pu aboutir. Veuillez contacter Vérhojust au ${PHONE}.`;
        }
        return `⏳ Votre paiement est actuellement en attente.`;
      }
      return `❌ Aucune transaction trouvée à ce nom. Veuillez contacter Vérhojust au ${PHONE}.`;
    } catch (err) {
      return "Veuillez contacter Vérhojust au " + PHONE + ".";
    }
  }

  // Suivi de commande
  if (msg.includes("suivi") || msg.includes("suivre") || msg.includes("statut")) {
    try {
      const words = msg.split(" ");
      const queryTerm = words.find(w => w.length > 2 && w !== "suivi" && w !== "commande");

      if (!queryTerm) {
        return "Veuillez taper par exemple : **'Suivi [Votre Nom]'**.";
      }

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .or(`customer_name.ilike.%${queryTerm}%,phone.ilike.%${queryTerm}%`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && orders && orders.length > 0) {
        const order = orders[0];
        return `📋 Commande trouvée pour ${order.customer_name || 'Client'} - Statut : **${order.status || 'En cours'}**.`;
      }
      return `❌ Désolé, aucune commande active n'a été trouvée. Veuillez contacter Vérhojust au ${PHONE}.`;
    } catch (err) {
      return "Aucune commande trouvée. Veuillez contacter Vérhojust au " + PHONE + ".";
    }
  }

  // Recherche de produits dans la base de données
  if (msg.includes("stock") || msg.includes("avez vous") || msg.includes("est ce que") || msg.includes("le ") || msg.includes("la ") || msg.length > 3) {
    try {
      const { data: products, error } = await supabase.from("products").select("*");
      if (!error && products && products.length > 0) {
        const foundProduct = products.find((p: any) => msg.includes(p.name.toLowerCase()));

        if (foundProduct) {
          const inStock = foundProduct.stock > 0 || foundProduct.is_available !== false;
          if (inStock) {
            return `✅ Oui, il y a le ${foundProduct.name} en stock ! Son prix est de ${foundProduct.price} FCFA.`;
          }
        }
      }
    } catch (err) {
      console.error("Erreur produits:", err);
    }

    try {
      await supabase.from("missing_product_requests").insert([{
        product_query: userMessage,
        session_id: sessionId,
        status: "en_attente_admin",
        created_at: new Date().toISOString()
      }]);
    } catch (e) {}

    return "Veuillez patienter quelques minutes le temps pour moi de vérifier.";
  }

  return `Pour cette requête spécifique qui ne figure pas dans nos données habituelles, veuillez contacter Vérhojust au numéro WhatsApp ${PHONE}.`;
};

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  useEffect(() => {
    let storedSessionId = localStorage.getItem("verhojust_chat_session");
    if (!storedSessionId) {
      storedSessionId = "session_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("verhojust_chat_session", storedSessionId);
    }
    setSessionId(storedSessionId);

    // Tente de retrouver le nom du client stocké lors d'une commande précédente ou d'une visite
    const savedName = localStorage.getItem("verhojust_client_name");
    if (savedName) {
      setClientName(savedName);
    } else {
      // Recherche rapide dans la table orders si un numéro ou une session correspond
      supabase
        .from("orders")
        .select("customer_name")
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0 && data[0].customer_name) {
            const name = data[0].customer_name;
            setClientName(name);
            localStorage.setItem("verhojust_client_name", name);
          }
        });
    }
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
        if (data.length === 0) {
          const titleName = clientName ? ` ${clientName}` : "";
          const welcomeText = `Bonjour et bienvenue chez Verhojust${titleName} ! Nous sommes ravis de vous compter parmi nous. N'hésitez pas à découvrir toutes nos nouveautés et nos publications sur notre <a href="${FACEBOOK_URL}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">page Facebook officielle</a>. Comment puis-je vous aider aujourd'hui ?`;
          
          const welcomeMessage = {
            sender: "assistant",
            message: welcomeText,
            session_id: sessionId
          };
          const { data: initData } = await supabase.from("messages").insert([welcomeMessage]).select();
          if (initData && initData[0]) {
            setMessages([initData[0] as Message]);
          }
        } else {
          const updatedMessages = [...data];
          const lastMsg = updatedMessages[updatedMessages.length - 1];
          
          if (lastMsg && lastMsg.sender === "assistant" && lastMsg.message.includes("patienter quelques minutes")) {
            const msgTime = new Date(lastMsg.created_at || Date.now()).getTime();
            const nowTime = new Date().getTime();
            const diffMinutes = (nowTime - msgTime) / (1000 * 60);

            if (diffMinutes >= 30) {
              const followUpText = `Veuillez contacter Vérhojust au numéro WhatsApp ${PHONE}`;
              if (!updatedMessages.some(m => m.message.includes("Veuillez contacter Vérhojust au numéro WhatsApp"))) {
                const { data: followData } = await supabase.from("messages").insert([{
                  sender: "assistant",
                  message: followUpText,
                  session_id: sessionId
                }]).select();
                if (followData && followData[0]) {
                  updatedMessages.push(followData[0] as Message);
                }
              }
            }
          }
          setMessages(updatedMessages);
        }
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
  }, [open, sessionId, clientName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSendText = async (textToSend: string, customReply?: string) => {
    if (!sessionId || !textToSend.trim()) return;

    const { data, error } = await supabase
      .from("messages")
      .insert([{ sender: "user", message: textToSend, session_id: sessionId }])
      .select();

    if (error) return;
    
    if (data && data[0]) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data[0].id);
        if (exists) return prev;
        return [...prev, data[0] as Message];
      });
    }

    setTimeout(async () => {
      const replyText = customReply || await getDynamicResponse(textToSend, sessionId, clientName);

      const { data: botData, error: botError } = await supabase
        .from("messages")
        .insert([{ sender: "assistant", message: replyText, session_id: sessionId }])
        .select();

      if (!botError && botData && botData[0]) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === botData[0].id);
          if (exists) return prev;
          return [...prev, botData[0] as Message];
        });
      }
    }, 600);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await handleSendText(text);
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
                  <p className="text-xs text-primary-200">En ligne • Yaoundé & Douala</p>
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
                    {...(m.sender !== "user" ? { dangerouslySetInnerHTML: { __html: m.message } } : { children: m.message })}
                  />
                </div>
              ))}
            </div>

            <div className="p-2 bg-neutral-100 border-t border-neutral-200 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {QUICK_TIPS.map((tip, index) => (
                <button
                  key={index}
                  onClick={() => handleSendText(tip.label, tip.reply)}
                  className="text-xs bg-white border border-primary-200 text-primary-800 px-2.5 py-1.5 rounded-full hover:bg-primary-50 transition-colors shadow-sm font-medium"
                >
                  {tip.label}
                </button>
              ))}
            </div>

            <div className="px-4 py-1.5 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
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