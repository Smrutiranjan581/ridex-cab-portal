import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Mail,
  Send,
  ShieldAlert,
  UserX,
  CheckCircle2,
  Car,
  FileText,
  Clock,
  Sparkles,
  Info
} from "lucide-react";

export default function DeactivateCaptainModal({ captain, onClose, onConfirm }) {
  const [selectedReason, setSelectedReason] = useState("Reckless Driving & Safety Violations Reported");
  const [customReason, setCustomReason] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [successDispatched, setSuccessDispatched] = useState(false);

  if (!captain) return null;

  const capUser = captain.user || captain;
  const capEmail = capUser.email || (capUser.phone ? `captain_${capUser.phone.slice(-4)}@ridex.com` : "captain@cab.com");

  const defaultReasons = [
    {
      id: "c1",
      title: "Reckless Driving & Safety Violations Reported",
      desc: "Multiple passenger complaints regarding speeding, traffic violations, or unsafe driving behavior."
    },
    {
      id: "c2",
      title: "Document Verification Failure (Expired DL / Invalid Vehicle RC)",
      desc: "Driving license, vehicle insurance, or commercial permit failed periodic regulatory audit."
    },
    {
      id: "c3",
      title: "Excessive Ride Rejections or Demanding Cash Off-App",
      desc: "Repeated cancellations after acceptance or soliciting unmetered cash payment from riders."
    },
    {
      id: "c4",
      title: "Customer Harassment or Unprofessional Conduct",
      desc: "Zero-tolerance breach regarding verbal misconduct, rudeness, or inappropriate passenger contact."
    },
    {
      id: "c5",
      title: "Custom Compliance Reason",
      desc: "Specify a custom administrative reason to be delivered directly to the driver."
    }
  ];

  const finalReason = selectedReason === "Custom Compliance Reason"
    ? (customReason.trim() || "Fleet safety standard audit and compliance enforcement")
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
        onConfirm(captain, finalReason);
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
                  Deactivate Captain / Driver Account
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                  Fleet Enforcement
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Revoke online dispatch access and dispatch official suspension notice via Email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Target Captain Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={capUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                alt={capUser.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-500/30 shrink-0"
              />
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  {capUser.name}
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    ({captain.vehicle?.numberPlate || "OD-33-AB-2005"})
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-amber-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{capEmail}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">License No</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block font-mono">{captain.licenseNumber || "OD02200702112007"}</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                Earnings: ₹{(captain.totalEarnings || 286).toLocaleString()} ({captain.totalTrips || 1} Trips)
              </span>
            </div>
          </div>

          {/* Reason Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              1. Select Driver Deactivation / Suspension Reason
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
                    name="deactivate_cap_reason"
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

            {selectedReason === "Custom Compliance Reason" && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                <textarea
                  rows={3}
                  placeholder="Explain the specific safety or compliance violation details..."
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
                2. Live Automated Captain Suspension Email Notice
              </label>
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {showEmailPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {showEmailPreview && (
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 font-sans text-xs space-y-3 shadow-inner">
                {/* Email Header */}
                <div className="pb-2 border-b border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span><strong>From:</strong> RideX Fleet Operations &lt;fleet-compliance@ridex.com&gt;</span>
                    <span className="text-[10px] text-slate-500 font-mono">{todayStr}</span>
                  </div>
                  <div className="text-slate-300">
                    <span><strong>To:</strong> {capEmail}</span>
                  </div>
                  <div className="text-rose-400 font-bold">
                    <span><strong>Subject:</strong> ⚠️ Urgent Notice: RideX Captain Driver Access Suspended</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-2.5 text-slate-300 leading-relaxed text-[11px]">
                  <p>Dear Captain <strong>{capUser.name}</strong>,</p>
                  <p>
                    This is an official notice from the <strong>RideX Fleet Operations Division</strong> that your driver partner privileges for vehicle <span className="font-mono text-amber-400 font-bold">{captain.vehicle?.numberPlate || "OD-33-AB-2005"}</span> have been <span className="text-rose-400 font-bold">DEACTIVATED & SUSPENDED</span> effective immediately ({todayStr}).
                  </p>

                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                      Grounds for Fleet Action:
                    </span>
                    <span className="font-bold text-xs mt-0.5 block text-white">
                      "{finalReason}"
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    <strong>Operational Restrictions:</strong> Your Captain Cockpit access is disabled, and you will not receive passenger ride requests. Outstanding trip payouts (₹{(captain.totalEarnings || 286).toLocaleString()}) remain safely logged and subject to standard administrative clearance.
                  </p>

                  <p className="text-[10px] text-slate-400">
                    To dispute this decision or submit updated documentation for reinstatement, please contact our driver helpdesk at <strong>captain-support@ridex.com</strong> with your registered mobile (<strong>{capUser.phone || "7205519224"}</strong>).
                  </p>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                    <span>RideX Driver Operations & Safety Command</span>
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
              Clicking <strong>Confirm & Deactivate</strong> will immediately revoke this driver's online duty status and dispatch the above suspension notice to <strong>{capEmail}</strong>.
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={isSending || successDispatched}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                <span>Sending Notice to {capEmail}...</span>
              </>
            ) : successDispatched ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Notice Sent & Driver Deactivated!</span>
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
