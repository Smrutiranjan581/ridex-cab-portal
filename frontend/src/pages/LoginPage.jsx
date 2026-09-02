import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, CheckCircle2, X, KeyRound, Phone, ShieldCheck, Check, AlertCircle, MessageSquare, Car, ShieldAlert, Copy, Send, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pro-Level Modals state
  const [deactivatedAccountModal, setDeactivatedAccountModal] = useState(null);
  const [pendingApprovalModal, setPendingApprovalModal] = useState(null);
  const [rejectedAccountModal, setRejectedAccountModal] = useState(null);
  const [copiedAdminEmail, setCopiedAdminEmail] = useState(false);

  // Captain Live Status Tracker state
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');
  const [trackerResult, setTrackerResult] = useState(null);
  const [trackerError, setTrackerError] = useState('');

  // Forgot password interactive state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [activeOtp, setActiveOtp] = useState('');
  const [incomingSms, setIncomingSms] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [otpSending, setOtpSending] = useState(false);

  const { login, sendMobileOtp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [signupSuccessMsg, setSignupSuccessMsg] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.successMessage) {
      setSignupSuccessMsg(location.state.successMessage);
    }
  }, [location.state]);

  // 30-second Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Universal Login Handler: Automatic redirect based on user role
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      const userRole = res.user?.role || 'rider';
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'captain') {
        navigate('/captain');
      } else {
        navigate('/rider/book');
      }
    } else {
      if (res.isDeactivated) {
        setDeactivatedAccountModal(res);
      } else if (res.isPendingApproval) {
        setPendingApprovalModal(res);
      } else if (res.isRejected) {
        setRejectedAccountModal(res);
      } else {
        setError(res.message || 'Invalid email, mobile number, or password');
      }
    }
  };

  const handleSendCode = async () => {
    setResetError('');
    setIncomingSms(null);
    setOtpSending(true);

    const res = await sendMobileOtp(resetPhone);
    setOtpSending(false);

    if (!res.success) {
      setResetError(res.message);
      return;
    }

    // Success - Store dynamic OTP and trigger simulated SMS
    setActiveOtp(res.otp);
    setOtpSent(true);
    setCountdown(30);

    // Realistic Live SMS Notification Popup
    setIncomingSms({
      phone: res.phone,
      otp: res.otp,
      text: `FleetCorp Security: Your password reset verification code is ${res.otp}. Valid for 5 minutes. Do not share it with anyone.`
    });
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!otpSent) {
      setResetError('Please click "Send Code" to verify your mobile number first');
      return;
    }

    if (!otpCode || otpCode.trim() !== activeOtp) {
      setResetError('Invalid OTP! Please enter the exact 4-digit code sent to your mobile number.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters');
      return;
    }

    const res = await resetPassword(resetPhone, newPassword);
    if (res.success) {
      setResetSuccess(true);
      setIncomingSms(null);
    } else {
      setResetError(res.message || 'Could not update password');
    }
  };

  const closeResetModal = () => {
    setShowForgotPassword(false);
    setResetSuccess(false);
    setResetError('');
    setOtpSent(false);
    setActiveOtp('');
    setIncomingSms(null);
    setCountdown(0);
    setOtpCode('');
    setNewPassword('');
    setResetPhone('');
  };

  const handleCheckStatus = (e) => {
    e?.preventDefault();
    setTrackerError('');
    setTrackerResult(null);

    const q = (trackerQuery || '').trim().toLowerCase();
    const digits = q.replace(/[^0-9]/g, '').slice(-10);

    if (!q) {
      setTrackerError('Please enter your registered mobile number, email, or application ID');
      return;
    }

    try {
      const raw = localStorage.getItem('fleetcorp_registered_users');
      const users = raw ? JSON.parse(raw) : [];

      const captain = users.find(u => {
        if (u.role !== 'captain') return false;
        const matchEmail = u.email && u.email.toLowerCase() === q;
        const matchPhone = digits && (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === digits;
        const matchAppId = u.applicationId && u.applicationId.toLowerCase() === q;
        return matchEmail || matchPhone || matchAppId;
      });

      if (!captain) {
        setTrackerError('No Captain application found with this Mobile / Email. Please verify your details or submit a new registration.');
        return;
      }

      setTrackerResult(captain);
    } catch (err) {
      setTrackerError('Unable to check application status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-white transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 font-bold">
              <Car className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In to Fleet<span className="text-amber-500">Corp</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Enter your registered email or mobile number to access your account
            </p>
          </div>

          {/* Clean Universal Login Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl"
          >
            {signupSuccessMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {signupSuccessMsg}
                </span>
                <button onClick={() => setSignupSuccessMsg('')} className="p-1 hover:text-emerald-950 dark:hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-500" /> Email or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="e.g. name@company.com or 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetError('');
                      setResetSuccess(false);
                      setShowForgotPassword(true);
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
                >
                  {loading ? "Signing In..." : "Sign In to Account"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Captain Application Status Tracker Trigger */}
            <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🪪</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Applied as Captain?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTrackerError('');
                  setTrackerResult(null);
                  setTrackerQuery(email || '');
                  setShowStatusTracker(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Check Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center flex justify-between items-center text-xs">
              <span className="text-slate-400">New to FleetCorp?</span>
              <Link to="/register" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Create Account ➔
              </Link>
            </div>
          </motion.div>

        </div>
      </main>

      {/* CAPTAIN APPLICATION LIVE STATUS TRACKER MODAL */}
      {showStatusTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500/30 p-6 sm:p-8 space-y-5 animate-in zoom-in-95 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowStatusTracker(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 shadow-inner ring-4 ring-amber-500/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">Captain Application Tracker</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check whether your Captain account has been approved by the Administrator
              </p>
            </div>

            {/* Tracker Input Search Form */}
            <form onSubmit={handleCheckStatus} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackerQuery}
                  onChange={(e) => setTrackerQuery(e.target.value)}
                  placeholder="Enter Mobile No, Email, or App ID..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Check</span>
                </button>
              </div>
            </form>

            {trackerError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{trackerError}</span>
              </div>
            )}

            {/* Tracker Result Display */}
            {trackerResult && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                
                {/* Applicant Summary Header */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{trackerResult.name}</h4>
                    <p className="text-slate-400 text-[11px]">
                      {trackerResult.city || 'Bhubaneswar'} • {trackerResult.vehicleModel || trackerResult.vehicleDetails?.model || 'Vehicle'} ({trackerResult.numberPlate || trackerResult.vehicleDetails?.numberPlate || 'OD-02'})
                    </p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                    {trackerResult.applicationId || 'RDX-APP'}
                  </span>
                </div>

                {/* Status Stepper */}
                <div className="space-y-3 px-1">
                  
                  {/* Step 1: Application Submitted */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-md">
                      ✓
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">Application & KYC Dossier Submitted</span>
                        <span className="text-[10px] text-emerald-500 font-bold">Done</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Personal credentials and vehicle documents registered successfully.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: KYC & Compliance Verification */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-md">
                      ✓
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">DL, RC & Bank Verification</span>
                        <span className="text-[10px] text-emerald-500 font-bold">Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Driving License ({trackerResult.licenseNumber || 'Verified'}) & RC details validated.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Admin Approval & Activation */}
                  <div className="flex items-start gap-3">
                    {trackerResult.isApproved || trackerResult.status === 'available' ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-md">
                        ✓
                      </div>
                    ) : trackerResult.isRejected ? (
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-md">
                        ✕
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 text-xs font-bold shadow-md animate-pulse">
                        ⏳
                      </div>
                    )}

                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">Administrator Clearance & Cockpit Access</span>
                        {trackerResult.isApproved || trackerResult.status === 'available' ? (
                          <span className="text-[10px] text-emerald-500 font-extrabold uppercase bg-emerald-500/15 px-2 py-0.5 rounded-full">
                            ✅ Approved & Live
                          </span>
                        ) : trackerResult.isRejected ? (
                          <span className="text-[10px] text-rose-500 font-extrabold uppercase bg-rose-500/15 px-2 py-0.5 rounded-full">
                            ❌ Rejected
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-500/15 px-2 py-0.5 rounded-full">
                            ⏳ Under Review
                          </span>
                        )}
                      </div>
                      
                      {trackerResult.isApproved || trackerResult.status === 'available' ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          🎉 Your account has been officially Approved! Activation email sent to <strong>{trackerResult.email}</strong>.
                        </p>
                      ) : trackerResult.isRejected ? (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                          Note: "{trackerResult.rejectionReason || 'Please submit updated documents.'}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-1">
                          Your application is currently at the Administrator Desk. Once approved, you can immediately sign in.
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Action Trigger based on status */}
                <div className="pt-2">
                  {trackerResult.isApproved || trackerResult.status === 'available' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(trackerResult.email || trackerResult.phone);
                        setShowStatusTracker(false);
                      }}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Proceed to Sign In with this Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowStatusTracker(false)}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold"
                    >
                      Close Tracker
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Interactive Mobile OTP + New Password Reset Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95">
            
            <button
              onClick={closeResetModal}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Reset Your Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered mobile number to verify via SMS OTP
              </p>
            </div>

            {/* Simulated Live Incoming SMS Notification Alert */}
            {incomingSms && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-slate-900 dark:text-slate-100 text-xs shadow-lg space-y-1.5 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> 📲 New SMS Received (+91 {incomingSms.phone})
                  </span>
                  <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-mono">NOW</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-950/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  "{incomingSms.text}"
                </p>
              </div>
            )}

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Password Changed Successfully!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your new password is active. You can now sign in immediately.
                </p>
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="mt-2 w-full py-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all hover:scale-[1.01]"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                
                {/* Mobile Number with Side "Send Code" Button */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-500" /> Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={resetPhone}
                      onChange={(e) => setResetPhone(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                    <button
                      type="button"
                      disabled={countdown > 0 || otpSending}
                      onClick={handleSendCode}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                        countdown > 0 || otpSending
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      }`}
                    >
                      {otpSending ? "Verifying..." : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? "Resend Code" : "Send Code"}
                    </button>
                  </div>
                </div>

                {/* OTP Validation Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Enter 4-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="Enter 4-digit code from SMS"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-widest text-center outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Enter New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Enter New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01]"
                >
                  Verify OTP & Update Password
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* PRO-LEVEL DEACTIVATION POPUP MODAL */}
      {deactivatedAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/40 shadow-2xl shadow-rose-500/10 overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Modal Header Bar */}
            <div className="p-6 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border-b border-rose-500/20 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                    🔒 Access Restricted
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    Account Deactivated by Administrator
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeactivatedAccountModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Your driver partner privileges and cockpit login have been deactivated by the RideX Central Fleet Administration. You are currently restricted from signing in or taking passenger bookings.
              </p>

              {/* Deactivation Reason Details Box */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Official Suspension Reason
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(deactivatedAccountModal.deactivatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="font-extrabold text-rose-900 dark:text-rose-200 text-sm">
                  "{deactivatedAccountModal.deactivationReason}"
                </p>

                <div className="border-t border-rose-200 dark:border-rose-900/40 pt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Account: <strong>{deactivatedAccountModal.user?.name || email}</strong></span>
                  <span>Phone: <strong>{deactivatedAccountModal.user?.phone || 'N/A'}</strong></span>
                </div>
              </div>

              {/* Administrator Contact Details Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  🏛️ Please Contact Administrator for Reactivation:
                </h4>
                
                <div className="space-y-1.5 font-medium text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Primary Administrator:</span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{deactivatedAccountModal.adminEmail || 'admin@ridex.com'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Compliance Bureau:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{deactivatedAccountModal.adminSupportEmail || 'fleet-compliance@ridex.com'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Central Helpline:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{deactivatedAccountModal.adminPhone || '+91 674 291 0088'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <a
                  href={`mailto:${deactivatedAccountModal.adminEmail || 'admin@ridex.com'}?cc=${deactivatedAccountModal.adminSupportEmail || 'fleet-compliance@ridex.com'}&subject=Account%20Reactivation%20Appeal%20-%20Captain%20${encodeURIComponent(deactivatedAccountModal.user?.name || 'Driver')}&body=Hello%20Administrator,%0D%0A%0D%0AMy%20Captain%20account%20(${encodeURIComponent(deactivatedAccountModal.user?.email || email)}%20/%20${encodeURIComponent(deactivatedAccountModal.user?.phone || '')})%20was%20deactivated%20for%20the%20following%20reason:%0D%0A"${encodeURIComponent(deactivatedAccountModal.deactivationReason)}"%0D%0A%0D%0APlease%20review%20my%20appeal%20and%20reactivate%20my%20driver%20access.%0D%0A%0D%0AThank%20you,%0D%0A${encodeURIComponent(deactivatedAccountModal.user?.name || 'Captain')}`}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Appeal Email</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(deactivatedAccountModal.adminEmail || 'admin@ridex.com');
                    setCopiedAdminEmail(true);
                    setTimeout(() => setCopiedAdminEmail(false), 2500);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  {copiedAdminEmail ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500 font-extrabold">Admin Email Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy Admin Email</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDeactivatedAccountModal(null)}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Dismiss
              </button>

            </div>
          </motion.div>
        </div>
      )}

      {/* PRO-LEVEL CAPTAIN PENDING APPROVAL MODAL */}
      {pendingApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Icon Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center ring-4 ring-amber-500/10 shadow-lg shrink-0">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    ⏳ Application Under Review
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Captain Account Not Approved Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Welcome, <strong className="text-slate-800 dark:text-slate-200">{pendingApprovalModal.user?.name || email}</strong>! Please wait for Administrator Approval.
                </p>
              </div>
            </div>

            {/* Application Information Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/60 dark:border-amber-800/60">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Application ID:</span>
                <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  {pendingApprovalModal.applicationId || 'RDX-APP-2026'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Operating City:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {pendingApprovalModal.user?.city || 'Bhubaneswar'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Application Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending Administrator Verification
                </span>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Account Verification in Progress:
              </span>
              <p className="text-[11px] leading-relaxed">
                Your driving license, RC details, and bank account are currently queued in the <strong>Admin Approval Desk</strong>. Once approved, you will receive an official activation email at <strong>{pendingApprovalModal.user?.email || email}</strong>, and you can then log in to your Cockpit.
              </p>
            </div>

            {/* Administrator Contact Details */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Admin Desk: <strong className="text-slate-800 dark:text-slate-200 font-mono">admin@ridex.com</strong></span>
              <span>Helpline: <strong className="text-slate-800 dark:text-slate-200 font-mono">+91 674 291 0088</strong></span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleLogin}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Check Status / Retry Login</span>
              </button>

              <button
                type="button"
                onClick={() => setPendingApprovalModal(null)}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                I Will Wait
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PRO-LEVEL REJECTED APPLICATION MODAL */}
      {rejectedAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/40 shadow-2xl shadow-rose-500/10 p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center ring-4 ring-rose-500/10 shadow-lg shrink-0">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
              </div>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  Application Not Approved
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Driver KYC Requires Correction
                </h3>
                <p className="text-xs text-slate-400">
                  Applicant: <strong className="text-slate-200">{rejectedAccountModal.user?.name || email}</strong>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                Compliance Feedback / Rejection Note:
              </span>
              <p className="font-extrabold text-rose-900 dark:text-rose-200 text-sm">
                "{rejectedAccountModal.rejectionReason || 'Documents require clearer photograph and verification.'}"
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={`mailto:admin@ridex.com?subject=Document%20Re-verification%20Request%20-%20Captain%20${encodeURIComponent(rejectedAccountModal.user?.name || '')}&body=Hello%20Admin,%0D%0A%0D%0AI%20would%20like%20to%20submit%20updated%20documents%20for%20my%20Captain%20account.`}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
              >
                <Send className="w-3.5 h-3.5" /> Email Updated Documents
              </a>
              <button
                type="button"
                onClick={() => setRejectedAccountModal(null)}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
