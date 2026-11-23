// ============================================================================
// SUPPORT SUB-PAGES — Live Chat
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend AI Agent Module (/ai/chat)
// ============================================================================

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send, Headphones, Bot,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useAiChat } from "@nordi/shared/hooks/api-queries/useAi";

interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
  time?: string;
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

const LiveChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial_bot_1",
      from: "bot",
      text: "Hello! 👋 I'm your Nordi AI Banking Concierge. I can help you with transfers, exchange rates, card limits, and security settings. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiChatMutation = useAiChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiChatMutation.isPending]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || aiChatMutation.isPending) return;

    const userMsgId = `msg_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      from: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res: any = await aiChatMutation.mutateAsync({
        message: trimmed,
        sessionId,
      });

      const replyText =
        res?.response ||
        res?.data?.response ||
        "I've received your inquiry and processed your banking context. Is there anything else you'd like to check?";
      const nextSessionId = res?.sessionId || res?.data?.sessionId || sessionId;

      if (nextSessionId) setSessionId(nextSessionId);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          from: "bot",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          from: "bot",
          text: "I am having trouble connecting to the live banking agent right now, but a support ticket has been queued. You can also reach our 24/7 emergency line from the Contact page.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Live Chat"
          subtitle="Chat in real-time with our intelligent banking concierge and support specialists"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Support", href: "/customer/support" },
            { label: "Live Chat" },
          ]}
        />
      </motion.div>

      <div className="max-w-2xl">
        <DashCard padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <Bot size={16} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Nordi AI Banking Concierge</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified Live Agent
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
              <Headphones size={14} /> 24/7 Monitored
            </div>
          </div>

          <div className="h-80 sm:h-96 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm ${m.from === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                    }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.time && (
                    <span className={`block text-[9px] mt-1 text-right ${m.from === "user" ? "text-blue-200" : "text-gray-400"}`}>
                      {m.time}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {aiChatMutation.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-bl-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask anything about your account, transfers, or rates…"
              className={`${inputCls} flex-1`}
              disabled={aiChatMutation.isPending}
            />
            <motion.button
              onClick={send}
              disabled={aiChatMutation.isPending || !input.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={16} />
            </motion.button>
          </div>
        </DashCard>
      </div>
    </PageContainer>
  );
};

export default LiveChat;
