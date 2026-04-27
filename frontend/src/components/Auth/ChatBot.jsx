// src/components/ChatBot.jsx - FIXED

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatService } from "../../services/chatService";
import { MessageCircle, X, Send } from "lucide-react";

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ✅ FIX 1: ADD MISSING STATE VARIABLE
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef(null);
  const streamFlushTimerRef = useRef(null);

  // ✅ MULTI TRANSACTION PARSER
  const parseMultipleTransactions = (text) => {
    const normalized = text.toLowerCase();

    const pattern =
      /(deposit|add|credit|withdraw|debit|take\s+out)\s*(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d+)?)/g;

    const matches = [...normalized.matchAll(pattern)];
    const actions = [];

    for (const match of matches) {
      let action = match[1];
      const amount = Number(match[2]);

      if (["deposit", "add", "credit"].includes(action)) {
        action = "deposit";
      } else {
        action = "withdraw";
      }

      if (amount > 0) {
        actions.push({ type: action, amount });
      }
    }

    return actions;
  };

  const parseTransactionHistoryRequest = (text) => {
    const normalized = text.toLowerCase();
    if (!/\btransaction(s)?\b/.test(normalized)) return null;

    if (
      normalized.includes("all transaction") ||
      normalized.includes("show all") ||
      normalized.includes("view all")
    ) {
      return { count: "all" };
    }

    if (
      /\b(?:last|recent)\s+transaction\b/.test(normalized) &&
      !/\b(?:last|recent)\s+\d+/.test(normalized)
    ) {
      return { count: 1 };
    }

    const match = normalized.match(
      /\b(?:last|recent|show|view)\s+(\d+)\s+transaction(s)?\b/
    );
    if (!match) return null;

    const count = Number(match[1]);
    if (!Number.isFinite(count) || count <= 0) return null;

    return { count };
  };

  const quickOptions = [
    { label: "Account Types", query: "What account types do you offer?" },
    { label: "Fees", query: "What are the fees?" },
    { label: "Security", query: "How is my data protected?" },
    { label: "Limits", query: "What are transaction limits?" },
    { label: "My Balance", query: "What is my balance?" },
    { label: "Transactions", query: "Show my recent transactions" },
  ];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamFlushTimerRef.current) {
        clearTimeout(streamFlushTimerRef.current);
      }
    };
  }, []);

  // ⚡ STREAMING MESSAGE HANDLER
  const sendChatMessage = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMessage = { role: "user", content: queryText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setIsStreaming(true);

    // Add placeholder for assistant message
    const assistantMessageIndex = updatedMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      let fullResponse = "";
      const flushAssistantMessage = () => {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: "assistant",
            content: fullResponse
          };
          return newMessages;
        });
      };
      
      // ⚡ USE STREAMING METHOD
      await chatService.sendMessageStream(
        queryText,
        updatedMessages,
        
        // 📨 onChunk: Called for each token
        (chunk) => {
          fullResponse += chunk;

          // Batch rapid chunks to reduce visual jitter/re-render storms.
          if (streamFlushTimerRef.current) return;
          streamFlushTimerRef.current = setTimeout(() => {
            streamFlushTimerRef.current = null;
            flushAssistantMessage();
          }, 35);
        },
        
        // ✅ onComplete: Called when streaming finishes
        () => {
          if (streamFlushTimerRef.current) {
            clearTimeout(streamFlushTimerRef.current);
            streamFlushTimerRef.current = null;
          }
          flushAssistantMessage();
          setLoading(false);
          setIsStreaming(false);

          try {
            const q = queryText.toLowerCase();
            const txCommands = parseMultipleTransactions(queryText);
            const hasMoneyAction = txCommands.length > 0;

            // Handle transaction commands
            if (hasMoneyAction) {
              txCommands.forEach((cmd, index) => {
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("bank-chat-transaction", {
                      detail: cmd,
                    })
                  );
                }, index * 900);
              });
            }

            // Handle transaction history
            const historyRequest = parseTransactionHistoryRequest(queryText);
            if (historyRequest) {
              window.dispatchEvent(
                new CustomEvent("bank-chat-show-transactions", {
                  detail: historyRequest,
                })
              );
            }

            // Refresh dashboard only for read-type queries.
            // For deposit/withdraw, Dashboard refresh is already handled by bot action flow.
            if (
              !hasMoneyAction &&
              (q.includes("balance") || q.includes("transaction"))
            ) {
              window.dispatchEvent(new Event("bank-data-updated"));
            }
          } catch (eventError) {
            console.error("Post-chat event dispatch failed:", eventError);
          }
        },
        
        // ❌ onError: Called if streaming fails
        (error) => {
          if (streamFlushTimerRef.current) {
            clearTimeout(streamFlushTimerRef.current);
            streamFlushTimerRef.current = null;
          }
          console.error("Chat error:", error);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex] = {
              role: "assistant",
              content: "❌ Error connecting to server"
            };
            return newMessages;
          });
          setLoading(false);
          setIsStreaming(false);
        }
      );
      
    } catch (error) {
      console.error("Chat error:", error);
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendChatMessage(input);
  };

  return (
    <>
      {/* 🔵 Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors"
      >
        {isOpen ? <X /> : <MessageCircle />}
      </button>

      {/* 💬 Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-24 right-6 z-[9999] w-[350px] h-[500px] bg-white rounded-xl shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-purple-600 text-white p-3 font-semibold flex items-center justify-between">
              <span>ChatBot</span>
              {/* Streaming indicator */}
              {isStreaming && (
                <motion.div
                  className="flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </motion.div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Ask something to start...
                </p>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {msg.content}
                    {/* Typing cursor for streaming message */}
                    {msg.role === "assistant" && 
                     i === messages.length - 1 && 
                     isStreaming && (
                      <motion.span
                        className="inline-block w-[2px] h-[14px] bg-gray-600 ml-1"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {loading && messages.length > 0 && !messages[messages.length - 1]?.content && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg text-sm bg-gray-200 flex gap-1">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    >
                      •
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    >
                      •
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    >
                      •
                    </motion.span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Options */}
            <div className="px-3 pb-2 border-t">
              <div className="grid grid-cols-2 gap-2 pt-2">
                {quickOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    disabled={loading}
                    onClick={() => sendChatMessage(option.query)}
                    className="text-left text-xs border rounded px-2 py-2 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-2 border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 border rounded px-2 py-1 text-sm disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-purple-600 text-white px-3 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};