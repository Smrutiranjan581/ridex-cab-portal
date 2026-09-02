import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  User, 
  Car, 
  ShieldAlert, 
  FileText, 
  X, 
  MessageSquare, 
  ExternalLink, 
  ChevronRight, 
  Sparkles,
  Phone,
  Mail,
  HelpCircle,
  Paperclip,
  Check
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import { useAuth } from '../../context/AuthContext';

export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all', 'rider', 'captain', 'resolved'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('resolved'); // 'resolved' | 'in_progress'
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastNotice({ msg, type });
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Initial Seed Sample Tickets if none exist
  const loadTickets = () => {
    try {
      const stored = localStorage.getItem('ridex_support_tickets');
      if (stored) {
        setTickets(JSON.parse(stored));
      } else {
        const sampleTickets = [
          {
            id: 'TCK-928104',
            userRole: 'rider',
            userName: 'Priyanka Senapati',
            userEmail: 'priyanka.s@gmail.com',
            userPhone: '+91 9861054321',
            subject: 'Fare Overcharged on Khandagiri to Patia Ride',
            category: 'Billing & Fare Dispute',
            description: 'The estimated fare shown was ₹140, but at the end of trip driver asked for ₹210 due to high traffic surge. Please adjust the extra fare.',
            attachment: null,
            status: 'open',
            createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            messages: [
              {
                sender: 'user',
                text: 'The estimated fare shown was ₹140, but at the end of trip driver asked for ₹210 due to high traffic surge. Please adjust the extra fare.',
                time: '25 mins ago'
              }
            ],
            adminReply: null,
            resolvedAt: null
          },
          {
            id: 'TCK-710492',
            userRole: 'captain',
            userName: 'Jitendra Kumar Sahoo',
            userEmail: 'captain@cab.com',
            userPhone: '+91 9437088776',
            subject: 'Weekly Incentive Bonus Not Credited in Payout Wallet',
            category: 'Captain Payouts & Earnings',
            description: 'I completed 25 rides yesterday as part of the Sunday Weekend Sprint, but the ₹500 bonus is not reflecting in my withdrawable balance.',
            attachment: null,
            status: 'open',
            createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
            messages: [
              {
                sender: 'user',
                text: 'I completed 25 rides yesterday as part of the Sunday Weekend Sprint, but the ₹500 bonus is not reflecting in my withdrawable balance.',
                time: '50 mins ago'
              }
            ],
            adminReply: null,
            resolvedAt: null
          },
          {
            id: 'TCK-649102',
            userRole: 'rider',
            userName: 'Amitav Mohanty',
            userEmail: 'amitav.m@outlook.com',
            userPhone: '+91 7008123456',
            subject: 'Left Water Bottle & Umbrella in Cab',
            category: 'Lost & Found Item',
            description: 'I left a black Tupperware water bottle and blue umbrella in the back seat of Swift Dzire OD-02-BA-9876 today morning around 9:30 AM.',
            attachment: null,
            status: 'resolved',
            createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
            messages: [
              {
                sender: 'user',
                text: 'I left a black Tupperware water bottle and blue umbrella in the back seat of Swift Dzire OD-02-BA-9876 today morning around 9:30 AM.',
                time: '3 hours ago'
              }
            ],
            adminReply: 'We contacted Captain Rajesh Mohapatra. He has safely kept your belongings and will hand them over at Master Canteen RideX Hub.',
            resolvedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem('ridex_support_tickets', JSON.stringify(sampleTickets));
        setTickets(sampleTickets);
      }
    } catch (e) {
      setTickets([]);
    }
  };

  useEffect(() => {
    loadTickets();

    const handleStorage = (e) => {
      if (e.key === 'ridex_support_tickets') {
        loadTickets();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_SUPPORT_TICKET' || event.data?.type === 'SUPPORT_TICKET_RESOLVED') {
          loadTickets();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, []);

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    // Tab filter
    if (activeTab === 'pending' && t.status === 'resolved') return false;
    if (activeTab === 'resolved' && t.status !== 'resolved') return false;
    if (activeTab === 'rider' && t.userRole !== 'rider') return false;
    if (activeTab === 'captain' && t.userRole !== 'captain') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = t.id?.toLowerCase().includes(q);
      const matchName = t.userName?.toLowerCase().includes(q);
      const matchPhone = t.userPhone?.toLowerCase().includes(q);
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      return matchId || matchName || matchPhone || matchSubject || matchCat;
    }
    return true;
  });

  // KPI Metrics
  const totalTickets = tickets.length;
  const pendingCount = tickets.filter(t => t.status !== 'resolved').length;
  const riderTicketsCount = tickets.filter(t => t.userRole === 'rider').length;
  const captainTicketsCount = tickets.filter(t => t.userRole === 'captain').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  // Handle Admin Resolution & Reply
  const handleSendAdminReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSendingReply(true);

    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const newMessages = [
          ...(t.messages || []),
          {
            sender: 'admin',
            text: replyText.trim(),
            time: timeStr,
            adminName: user?.name || 'Administrator'
          }
        ];
        return {
          ...t,
          status: resolutionStatus,
          adminReply: replyText.trim(),
          resolvedAt: resolutionStatus === 'resolved' ? new Date().toISOString() : t.resolvedAt,
          messages: newMessages
        };
      }
      return t;
    });

    try {
      localStorage.setItem('ridex_support_tickets', JSON.stringify(updatedTickets));
      setTickets(updatedTickets);

      // Dispatch in-app notification to the rider / captain's mailbox
      const userEmailKey = (selectedTicket.userEmail || selectedTicket.userPhone || '').toLowerCase();
      if (userEmailKey) {
        const notifKey = `ridex_user_notifications_${userEmailKey}`;
        const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
        const newNotif = {
          id: 'NOTIF-' + Date.now(),
          title: resolutionStatus === 'resolved' ? `✅ Support Ticket #${selectedTicket.id} Resolved` : `💬 Admin Replied to Ticket #${selectedTicket.id}`,
          desc: `Admin Response: "${replyText.trim()}"`,
          time: 'Just now',
          type: 'support_resolved',
          createdAt: new Date().toISOString(),
          isRead: false
        };
        localStorage.setItem(notifKey, JSON.stringify([newNotif, ...existingNotifs]));
      }

      // Broadcast update across tabs
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ 
          type: 'SUPPORT_TICKET_RESOLVED', 
          ticketId: selectedTicket.id, 
          reply: replyText.trim(),
          status: resolutionStatus
        });
        channel.close();
      }

      showToast(`Official response sent to ${selectedTicket.userName}! Ticket marked as ${resolutionStatus === 'resolved' ? 'Resolved' : 'In Progress'}.`);
      setIsSendingReply(false);
      setSelectedTicket(null);
      setReplyText('');
    } catch (err) {
      setIsSendingReply(false);
      showToast('Failed to save reply', 'error');
    }
  };

  // Quick reply snippet insertion
  const applyQuickSnippet = (snippet) => {
    setReplyText(snippet);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-rose-500/20 shadow-sm relative overflow-hidden">
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" /> 24x7 Help & Support Desk
                </span>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 animate-pulse">
                    {pendingCount} Awaiting Verification
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Rider & Captain Support Tickets
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Review complaints, fare disputes, payout queries, and lost items reported by Riders & Captains. Verify details and send official verified replies.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 z-10">
              <button
                onClick={() => {
                  loadTickets();
                  showToast("Tickets refreshed with latest real-time inquiries.");
                }}
                className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-amber-500 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>🔄 Sync Inquiries</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastNotice && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in ${
              toastNotice.type === 'error' 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastNotice.msg}</span>
              </div>
              <button onClick={() => setToastNotice(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              title="Total Inquiries"
              value={totalTickets}
              icon={Headphones}
              color="amber"
              description="All-time support tickets"
            />
            <StatCard
              title="Pending Verification"
              value={pendingCount}
              icon={Clock}
              color="rose"
              description="Needs Admin response"
            />
            <StatCard
              title="Rider Complaints"
              value={riderTicketsCount}
              icon={User}
              color="blue"
              description="Fare & trip disputes"
            />
            <StatCard
              title="Captain Queries"
              value={captainTicketsCount}
              icon={Car}
              color="emerald"
              description="Payouts & incentives"
            />
            <StatCard
              title="Resolved"
              value={resolvedCount}
              icon={CheckCircle2}
              color="emerald"
              description="Closed & resolved"
            />
          </div>

          {/* Filters & Search Control Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-fit">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Action ({pendingCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('rider')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'rider'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🚗 Rider Tickets ({riderTicketsCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('captain')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'captain'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🪖 Captain Queries ({captainTicketsCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('resolved')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'resolved'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>✅ Resolved ({resolvedCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({totalTickets})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Ticket ID, Name, Phone..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

            </div>
          </div>

          {/* Tickets List Queue */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 text-3xl flex items-center justify-center mx-auto">
                  🎧
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  No Support Tickets Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no customer or captain tickets matching the selected filter criteria.
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isPending = t.status !== 'resolved';
                const isRider = t.userRole === 'rider';

                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 group"
                  >
                    {/* Left: Ticket & User Info */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 font-bold ${
                        isRider 
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {isRider ? '🚗' : '👨‍✈️'}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                            #{t.id}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isRider 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {t.userRole}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {new Date(t.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {t.subject}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-2xl">
                          {t.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" /> {t.userName}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {t.userPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {t.userEmail}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-400">
                            {t.category}
                          </span>
                        </div>

                        {/* If already resolved, show quick reply preview */}
                        {t.adminReply && (
                          <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-0.5">
                            <p className="font-black text-[11px]">💬 Admin Resolution:</p>
                            <p className="text-[11px]">{t.adminReply}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Action Button */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5'
                          : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5'
                      }`}>
                        {isPending ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Action Required</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Resolved</span>
                          </>
                        )}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setReplyText(t.adminReply || '');
                          setResolutionStatus(t.status === 'resolved' ? 'resolved' : 'resolved');
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isPending ? 'Verify & Reply ➔' : 'View Thread / Edit'}</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* ======================================================== */}
          {/* INTERACTIVE ADMIN VERIFICATION & REPLY MODAL            */}
          {/* ======================================================== */}
          {selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xl shrink-0">
                      {selectedTicket.userRole === 'rider' ? '🚗' : '👨‍✈️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                          #{selectedTicket.id}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          {selectedTicket.userRole} ISSUE
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {selectedTicket.subject}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User & Ticket Metadata Dossier */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">User Name</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{selectedTicket.userName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone Number</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{selectedTicket.userPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Email Address</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate block">{selectedTicket.userEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Category</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{selectedTicket.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Submitted At</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Status</span>
                      <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                        selectedTicket.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem Description & Attached Image */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Reported Problem Description:
                  </label>
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {selectedTicket.description}
                  </div>

                  {selectedTicket.attachment && (
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">Attached Proof Screenshot:</p>
                      <img
                        src={selectedTicket.attachment}
                        alt="Issue proof"
                        className="max-h-48 rounded-xl object-contain border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>

                {/* Quick Reply Presets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    ⚡ Quick Resolution Presets (Click to insert):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyQuickSnippet("We have reviewed the fare discrepancy and credited ₹50 to your RideX Wallet. We apologize for the inconvenience.")}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    >
                      💰 Fare Adjusted & Credited
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickSnippet("Your captain payout and sprint bonus have been verified and credited to your registered bank account.")}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    >
                      🏦 Payout Bonus Released
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickSnippet("We have contacted the Captain. Your lost belonging is safely kept and available for pickup at the nearest RideX Hub.")}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    >
                      📦 Lost Item Recovered
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickSnippet("Our technical operations team has resolved this issue. Please restart your RideX app to refresh your profile.")}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    >
                      ⚙️ Technical Bug Fixed
                    </button>
                  </div>
                </div>

                {/* Admin Official Reply Form */}
                <form onSubmit={handleSendAdminReply} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-amber-500" /> Official Admin Explanation & Reply:
                    </label>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your verification finding and resolution message. This will be sent directly to the user's notification drawer & support screen..."
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Resolution Status Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Resolution Status:
                      </label>
                      <select
                        value={resolutionStatus}
                        onChange={(e) => setResolutionStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="resolved">✅ Mark as Resolved & Closed</option>
                        <option value="in_progress">⏳ Mark as In Progress</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSendingReply}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSendingReply ? 'Sending Reply...' : 'Send Reply & Update Ticket'}</span>
                      </button>
                    </div>
                  </div>

                </form>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
