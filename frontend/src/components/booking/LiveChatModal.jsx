import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, User, CheckCheck, Sparkles } from 'lucide-react';

export default function LiveChatModal({ captainName, captainPhone, vehicleNo, onClose, onCallClick }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: "captain", text: `Hi Rahul! I have accepted your ride and I am arriving at your pickup location shortly.`, time: "Just now" }
  ]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);

  const quickReplies = [
    "I am waiting near the main gate.",
    "Which color car / bike?",
    "Please turn on AC.",
    "Call me when you arrive."
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "rider",
      text: text.trim(),
      time: "Just now"
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulated Captain Reply
    setTimeout(() => {
      const captainReplies = [
        "Got it! Reaching your pickup spot in 2 minutes.",
        "Sure, I am wearing a yellow helmet / uniform.",
        "Okay, AC is already running.",
        "Yes, will ring your phone once I reach."
      ];
      const reply = captainReplies[Math.floor(Math.random() * captainReplies.length)];
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "captain", text: reply, time: "Just now" }
      ]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md h-[550px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-lg">
              👨‍✈️
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                {captainName || "Captain Rajesh Mohapatra"}
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{vehicleNo || "OD-02-BA-9876"} • Online</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCallClick}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
              title="Call Captain"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
              title="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((msg) => {
            const isRider = msg.sender === "rider";
            return (
              <div key={msg.id} className={`flex ${isRider ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium space-y-1 shadow-sm ${
                    isRider
                      ? "bg-amber-500 text-slate-950 rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] ${isRider ? "text-slate-800" : "text-slate-400"}`}>
                    <span>{msg.time}</span>
                    {isRider && <CheckCheck className="w-3 h-3 text-slate-900" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Replies Chips */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
          {quickReplies.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 whitespace-nowrap transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Type a message to captain..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
