import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Mail,
  Send,
  ShieldAlert,
  UserX,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Info
} from "lucide-react";

export default function DeactivateRiderModal({ rider, onClose, onConfirm }) {
  const [selectedReason, setSelectedReason] = useState("Safety & Code of Conduct Policy Violation");
  const [customReason, setCustomReason] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [successDispatched, setSuccessDispatched] = useState(false);

  if (!rider) return null;

  const defaultReasons = [
    {
      id: "r1",
      title: "Safety & Code of Conduct Policy Violation",
      desc: "Inappropriate or abusive behavior reported during rides with partner captains."
    },
    {
      id: "r2",
      title: "Payment & Fraudulent Activity",
      desc: "Multiple chargeback disputes, unpaid fare arrears, or unauthorized payment method."
    },
    {
      id: "r3",
      title: "Corporate Access Revocation by Employer",
      desc: "Corporate partner HR notified account termination or offboarding."
    },
    {
      id: "r4",
      title: "Suspicious / Fake Identity Activity",
      desc: "Failure to verify employee phone/email identity or duplicate account abuse."
    },
    {
      id: "r5",
      title: "Custom Administrative Reason",
      desc: "Specify a customized reason to be directly communicated to the user."
    }
  ];

  const finalReason = selectedReason === "Custom Administrative Reason"
    ? (customReason.trim() || "Administrative review and policy compliance action")
    : selectedReason;

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const handleDeactivate = () => {
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      setSuccessDispatched(true);

      setTimeout(() => {
        onConfirm(rider, finalReason);
      }, 1200);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Deactivate Rider Account
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                  Admin Action
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Restrict access and automatically dispatch formal deactivation notice via Email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Target User Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 font-extrabold flex items-center justify-center text-base shrink-0">
                {rider.name ? rider.name.charAt(0).toUpperCase() : "R"}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {rider.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-amber-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{rider.email}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Organization</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{rider.company || "Corporate Partner"}</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                Wallet: ₹{rider.walletBalance || 1500}
              </span>
            </div>
          </div>

          {/* Reason Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              1. Select Deactivation / Ban Reason (Will be sent in Email)
            </label>

            <div className="grid grid-cols-1 gap-2">
              {defaultReasons.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.title)}
                  className={"p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 " + (
                    selectedReason === r.title
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-500/50 shadow-sm"
                      : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <input
                    type="radio"
                    name="deactivate_reason"
                    checked={selectedReason === r.title}
                    onChange={() => setSelectedReason(r.title)}
                    className="mt-1 accent-rose-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {r.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {r.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {selectedReason === "Custom Administrative Reason" && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                <textarea
                  rows={3}
                  placeholder="Explain the specific reason for deactivating this account..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-rose-500/40 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Email Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-500" />
                2. Live Automated Notice Email Preview
              </label>
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {showEmailPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {showEmailPreview && (
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 font-sans text-xs space-y-3 shadow-inner">
                {/* Email Header */}
                <div className="pb-2 border-b border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span><strong>From:</strong> RideX Trust & Safety Team &lt;compliance@ridex.com&gt;</span>
                    <span className="text-[10px] text-slate-500 font-mono">{todayStr}</span>
                  </div>
                  <div className="text-slate-300">
                    <span><strong>To:</strong> {rider.email}</span>
                  </div>
                  <div className="text-amber-400 font-bold">
                    <span><strong>Subject:</strong> ⚠️ Important Notice: RideX Account Deactivation Notification</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-2.5 text-slate-300 leading-relaxed text-[11px]">
                  <p>Dear <strong>{rider.name}</strong>,</p>
                  <p>
                    This is an official communication from the <strong>RideX Platform Administration</strong> to notify you that your RideX corporate passenger account has been <span className="text-rose-400 font-bold">DEACTIVATED & SUSPENDED</span> effective immediately ({todayStr}).
                  </p>

                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                      Official Reason for Action:
                    </span>
                    <span className="font-bold text-xs mt-0.5 block text-white">
                      "{finalReason}"
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    <strong>Impact of this action:</strong> You will no longer be able to log in, hail rides, or utilize corporate mobility credits. Any unutilized wallet balance (₹{rider.walletBalance || 1500}) will be audited according to corporate terms.
                  </p>

                  <p className="text-[10px] text-slate-400">
                    If you believe this deactivation was performed in error or would like to submit an appeal, please reach out to our dedicated compliance desk at <strong>appeals@ridex.com</strong> quoting your registered mobile number (<strong>{rider.phone || "+91 9876543210"}</strong>).
                  </p>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                    <span>RideX Enterprise Trust & Safety Division</span>
                    <span>Automated Security Notification</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-normal">
              Clicking <strong>Confirm & Deactivate</strong> will immediately lock this rider's login session and send the above official deactivation notification to <strong>{rider.email}</strong>.
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={isSending || successDispatched}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSending || successDispatched}
            onClick={handleDeactivate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Notice to {rider.email}...</span>
              </>
            ) : successDispatched ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Notice Sent & Deactivated!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>🚫 Confirm & Send Deactivation Email</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
