import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, X } from 'lucide-react';

export default function CallCaptainModal({ captainName, captainPhone, vehicleNo, onClose }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callStatus, setCallStatus] = useState("Connecting...");

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus("Call Connected");
    }, 2000);

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl shadow-2xl border border-slate-800 p-8 text-center space-y-6 animate-in zoom-in-95">
        
        {/* Header Shield */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Encrypted Safety Call</span>
        </div>

        {/* Captain Avatar */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-amber-500 flex items-center justify-center text-4xl shadow-xl animate-pulse">
            👨‍✈️
          </div>
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
            <Phone className="w-3 h-3 text-white" />
          </span>
        </div>

        {/* Details */}
        <div>
          <h3 className="text-xl font-extrabold text-white">
            {captainName || "Captain Rajesh Mohapatra"}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {captainPhone || "+91 9437088776"} • {vehicleNo || "OD-02-BA-9876"}
          </p>
          <p className="text-xs font-bold text-amber-400 mt-2 font-mono">
            {callStatus} ({formatTime(callDuration)})
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-colors ${
              isMuted ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
            title="Mute"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-transform hover:scale-105"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-3.5 rounded-full transition-colors ${
              isSpeaker ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
            title="Speaker"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
