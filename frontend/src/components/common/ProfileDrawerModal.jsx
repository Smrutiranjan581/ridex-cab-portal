import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, ChevronRight, Star, HelpCircle, Wallet, History, 
  ShieldCheck, Gift, Bell, Settings as SettingsIcon, LogOut, ArrowLeft,
  Phone, Mail, Check, Copy, UserCheck, Smartphone, Shield, Sparkles,
  Search, Ticket, MessageCircle, AlertCircle, CreditCard, MinusCircle,
  ThumbsUp, ThumbsDown, Headphones, Paperclip, Send, CheckCheck, Image as ImageIcon,
  User, Heart, Info, Trash2, MapPin, Plus, Crosshair, Navigation, Loader2,
  Coins, Award, Flame, Zap, FileCheck, FileText, ClipboardList,
  RotateCcw, Receipt, Calendar, Clock, Car, QrCode, Download, BadgeCheck, CheckCircle2, Printer, Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import jsPDF from 'jspdf';
import api from '../../services/api';

function FavMapCenterTracker({ center, onMove }) {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter();
      onMove([c.lat, c.lng]);
    }
  });

  useEffect(() => {
    if (center && map) {
      map.setView(center, 15);
    }
  }, [center, map]);

  return null;
}

export default function ProfileDrawerModal({ onClose }) {
  const { user, captainProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSubModal, setActiveSubModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [profileNotifications, setProfileNotifications] = useState([]);

  useEffect(() => {
    const loadProfileNotifs = async () => {
      const notifs = [];

      // 1. If Captain, fetch cloud payouts & tips
      if (user?.role === 'captain') {
        try {
          const res = await api.get('/payouts');
          if (res.data?.success && Array.isArray(res.data.payouts)) {
            const myEmail = (user.email || '').toLowerCase();
            const myPhone = (user.phone || '').replace(/[^0-9]/g, '').slice(-10);

            const myPayouts = res.data.payouts.filter(p => {
              const pEmail = (p.captainEmail || '').toLowerCase();
              const pPhone = (p.captainPhone || '').replace(/[^0-9]/g, '').slice(-10);
              if (myEmail && pEmail && myEmail === pEmail) return true;
              if (myPhone && pPhone && myPhone === pPhone) return true;
              if (myEmail === 'captain@cab.com') return true;
              return true;
            });

            myPayouts.forEach(p => {
              if (p.status === 'approved_transferred') {
                notifs.push({
                  id: 'pay_app_' + p.id,
                  title: '💰 Payout Approved & Transferred!',
                  desc: `₹${p.amount} has been successfully credited to your ${p.payoutMethod === 'bank' ? 'Bank Account' : 'UPI ID'} (${p.destination}). Reference UTR: ${p.utrNumber || 'UTR928174829102'}.`,
                  time: p.processedAt ? new Date(p.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Transferred',
                  type: 'payout'
                });
              } else if (p.status === 'rejected') {
                notifs.push({
                  id: 'pay_rej_' + p.id,
                  title: '⚠️ Payout Request Rejected',
                  desc: `Your withdrawal of ₹${p.amount} was rejected and refunded to wallet. Reason: "${p.rejectionReason || 'Bank details mismatch'}".`,
                  time: p.processedAt ? new Date(p.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Refunded',
                  type: 'payout_rejected'
                });
              }
            });
          }
        } catch (e) {}

        // Load Tip transactions from local captain transactions
        try {
          const txnsRaw = localStorage.getItem('ridex_captain_transactions');
          if (txnsRaw) {
            const txns = JSON.parse(txnsRaw);
            const tipTxns = txns.filter(t => t.type === 'CREDIT' && t.category === 'rider_tip');
            tipTxns.forEach(t => {
              notifs.push({
                id: 'tip_' + t.id,
                title: `⭐ ${t.title || 'Passenger Tip Received'} (+₹${t.amount})`,
                desc: t.subtitle || 'Tip received from passenger for great ride experience.',
                time: t.date ? new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
                type: 'payout'
              });
            });
          }
        } catch (e) {}
      }

      // 2. Local fallback custom notifications
      try {
        const notifKey = `ridex_user_notifications_${(user?.email || user?.phone || '').toLowerCase()}`;
        const customNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
        customNotifs.forEach(n => {
          const exists = notifs.some(item => item.id === n.id || (n.utr && item.desc?.includes(n.utr)));
          if (!exists) {
            notifs.push(n);
          }
        });
      } catch (e) {}

      // 3. Welcome item if empty
      if (notifs.length === 0) {
        if (user?.role === 'captain') {
          notifs.push({
            id: 'cap_welcome',
            title: "🚀 Captain Account Live & Active",
            desc: "Your vehicle documents, daily wallet & payout account are online.",
            time: "Active",
            type: "general"
          });
        } else {
          notifs.push({
            id: 'rd_welcome',
            title: "🎉 Welcome to RideX Mobility",
            desc: "Book cabs, auto, and bikes with zero surge pricing.",
            time: "Active",
            type: "general"
          });
        }
      }

      setProfileNotifications(notifs);
    };

    loadProfileNotifs();
  }, [user, activeSubModal]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  // Help topic search & detail state
  const [helpSearch, setHelpSearch] = useState("");
  const [selectedHelpTopic, setSelectedHelpTopic] = useState(null);
  const [selectedPaymentFaqTopic, setSelectedPaymentFaqTopic] = useState(null);
  const [selectedFaqArticle, setSelectedFaqArticle] = useState(null);
  const [articleFeedback, setArticleFeedback] = useState({});
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [ticketRaised, setTicketRaised] = useState(false);

  // Support Chatbot state matching user screenshot
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [supportInput, setSupportInput] = useState("");
  const [attachedImagePreview, setAttachedImagePreview] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // Wallet & Add Money state
  const [walletBalance, setWalletBalance] = useState(0);
  const [addMoneyAmount, setAddMoneyAmount] = useState("50");
  const [addMoneySuccess, setAddMoneySuccess] = useState(false);
  const [passbookList, setPassbookList] = useState([
    { id: 1, type: "Debit", mode: "cash", date: "24 Jun 25, 03:02 pm", amount: "- ₹89.00" },
    { id: 2, type: "Debit", mode: "cash", date: "24 Apr 25, 12:56 pm", amount: "- ₹134.00" },
    { id: 3, type: "Debit", mode: "cash", date: "24 Apr 25, 09:02 am", amount: "- ₹104.00" },
    { id: 4, type: "Debit", mode: "cash", date: "22 Apr 25, 01:52 pm", amount: "- ₹57.00" },
    { id: 5, type: "Debit", mode: "cash", date: "3 Nov 24, 02:24 pm", amount: "- ₹95.00" },
    { id: 6, type: "Debit", mode: "cash", date: "20 Oct 24, 12:49 pm", amount: "- ₹106.00" },
    { id: 7, type: "Debit", mode: "cash", date: "6 Jun 24, 11:43 am", amount: "- ₹118.00" },
    { id: 8, type: "Debit", mode: "cash", date: "20 May 24, 11:42 am", amount: "- ₹100.00" },
  ]);

  // Delete Account modal state & Pro-level Popup state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [customDeleteReason, setCustomDeleteReason] = useState("");
  // Favourites state & Map Picker state
  const [favouritesList, setFavouritesList] = useState([]);
  const [favCoords, setFavCoords] = useState([20.3015, 85.7890]);
  const [favLocationName, setFavLocationName] = useState("Areal constructions & Geoindia Services");
  const [favLocationAddress, setFavLocationAddress] = useState("GA-732, Bharatpur, Bhubaneswar, Odisha 751029, India");
  const [favSelectedTag, setFavSelectedTag] = useState(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [isSearchingFav, setIsSearchingFav] = useState(false);
  const [favSearchQuery, setFavSearchQuery] = useState("");

  const sampleFavLocations = [
    { name: "Areal constructions & Geoindia Services", address: "GA-732, Bharatpur, Bhubaneswar, Odisha 751029, India", coords: [20.3015, 85.7890] },
    { name: "Blossoms School", address: "Bharatpur Rd, Khandagiri, Bhubaneswar, Odisha 751030", coords: [20.3040, 85.7920] },
    { name: "Triveni Academy", address: "Khandagiri - Chandaka Rd, Bhubaneswar, Odisha 751030", coords: [20.3080, 85.7950] },
    { name: "Infocity IT Park", address: "Patia, Bhubaneswar, Odisha 751024", coords: [20.3541, 85.8195] },
    { name: "Master Canteen Square", address: "Janpath, Station Square, Bhubaneswar 751001", coords: [20.2660, 85.8430] },
    { name: "KIIT University Campus 6", address: "Patia, Bhubaneswar, Odisha 751024", coords: [20.3580, 85.8170] }
  ];

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Safety state
  const [activeSafetySlide, setActiveSafetySlide] = useState(0);
  const [showSafetyKnowMore, setShowSafetyKnowMore] = useState(false);
  const [showTrustedContactsModal, setShowTrustedContactsModal] = useState(false);
  const [trustedContacts, setTrustedContacts] = useState([
    { id: 1, name: "Papa", phone: "+91 9437088776", relation: "Father" },
    { id: 2, name: "Sasmita Nayak", phone: "+91 9861234567", relation: "Sister" }
  ]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("Family");

  // RideX Coins state
  const [ridexCoins, setRidexCoins] = useState(250);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [coinsActiveTab, setCoinsActiveTab] = useState("vouchers"); // 'vouchers' | 'earn' | 'history'
  const [coinTransactions, setCoinTransactions] = useState([
    { id: 1, title: "Ride Cashback Bonus", coins: "+25", date: "Today, 09:30 am", type: "credit" },
    { id: 2, title: "Daily Check-in Reward", coins: "+10", date: "Yesterday, 08:15 am", type: "credit" },
    { id: 3, title: "Redeemed for ₹50 Auto Discount", coins: "-50", date: "28 Aug, 04:20 pm", type: "debit" },
    { id: 4, title: "Referral Bonus (Friend 1st Ride)", coins: "+100", date: "24 Aug, 11:10 am", type: "credit" },
    { id: 5, title: "5-Star Rating Captain Bonus", coins: "+15", date: "20 Aug, 06:45 pm", type: "credit" },
  ]);

  // My Rides / Trip History state
  const [ridesFilter, setRidesFilter] = useState("all"); // 'all' | 'completed' | 'cancelled'
  const [selectedRideReceipt, setSelectedRideReceipt] = useState(null);
  const [ridesHistoryList, setRidesHistoryList] = useState([
    {
      id: "RDX-9989",
      date: "Today, 12:20 PM",
      pickup: "Infocity IT Corridor, Patia",
      drop: "BBI Airport Terminal 1",
      distance: "12.5 km",
      duration: "24 mins",
      vehicleType: "Cab (Swift Dzire)",
      vehicleNumber: "OD-02-AB-1234",
      vehicleIcon: "🚗",
      captainName: "Jitendra Mohanty",
      captainRating: "4.92",
      fare: 180,
      paymentMode: "RideX Wallet",
      status: "completed",
      userRating: 5,
      baseFare: 50,
      distanceFare: 110,
      taxes: 20
    },
    {
      id: "RDX-8421",
      date: "30 Aug 2026, 08:45 PM",
      pickup: "KIIT Square, Patia",
      drop: "Master Canteen Station Square",
      distance: "8.2 km",
      duration: "18 mins",
      vehicleType: "Bike (Honda Activa)",
      vehicleNumber: "OD-02-AK-4455",
      vehicleIcon: "🛵",
      captainName: "Bikash Kumar Sahoo",
      captainRating: "4.88",
      fare: 65,
      paymentMode: "Cash on Drop",
      status: "completed",
      userRating: 5,
      baseFare: 25,
      distanceFare: 35,
      taxes: 5
    },
    {
      id: "RDX-7612",
      date: "28 Aug 2026, 09:15 AM",
      pickup: "Jaydev Vihar Overbridge",
      drop: "Esplanade One Mall, Rasulgarh",
      distance: "6.4 km",
      duration: "15 mins",
      vehicleType: "Auto (Bajaj RE)",
      vehicleNumber: "OD-02-BA-2211",
      vehicleIcon: "🛺",
      captainName: "Pradeep Rout",
      captainRating: "4.95",
      fare: 110,
      paymentMode: "UPI / PhonePe",
      status: "completed",
      userRating: 5,
      baseFare: 35,
      distanceFare: 65,
      taxes: 10
    },
    {
      id: "RDX-6902",
      date: "22 Aug 2026, 06:30 PM",
      pickup: "Khandagiri Caves, Bharatpur",
      drop: "Saheed Nagar Market",
      distance: "11.0 km",
      duration: "28 mins",
      vehicleType: "Cab (Hyundai Aura)",
      vehicleNumber: "OD-02-CC-8899",
      vehicleIcon: "🚗",
      captainName: "Manoj Panda",
      captainRating: "4.90",
      fare: 160,
      paymentMode: "RideX Wallet",
      status: "completed",
      userRating: 5,
      baseFare: 45,
      distanceFare: 100,
      taxes: 15
    },
    {
      id: "RDX-5510",
      date: "18 Aug 2026, 10:10 AM",
      pickup: "Utkal University Vani Vihar",
      drop: "Forum Mart, Janpath",
      distance: "4.2 km",
      duration: "12 mins",
      vehicleType: "Bike",
      vehicleNumber: "OD-02-DX-1122",
      vehicleIcon: "🛵",
      captainName: "Santosh Moharana",
      captainRating: "4.80",
      fare: 0,
      paymentMode: "Cancelled",
      status: "cancelled",
      cancelReason: "Captain took too long to arrive",
      userRating: 0
    }
  ]);

  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [invoiceSentSuccess, setInvoiceSentSuccess] = useState(null);

  const handleDownloadAndEmailInvoice = (ride) => {
    if (!ride) return;
    setIsSendingInvoice(true);

    try {
      const doc = new jsPDF();
      
      // Header & Branding with RideX theme
      doc.setFillColor(255, 199, 39); // RideX Yellow
      doc.rect(0, 0, 210, 28, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text("RideX Mobility India", 14, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Official Tax Invoice & Ride Receipt", 135, 14);
      doc.text("GSTIN: 21AAACR9989K1Z4", 135, 20);

      // Invoice Meta
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Invoice ID: INV-${ride.id}`, 14, 40);
      doc.text(`Date & Time: ${ride.date}`, 14, 46);
      doc.text(`Booking Status: COMPLETED`, 14, 52);

      doc.text(`Customer Name: ${userName}`, 120, 40);
      doc.text(`Registered Email: ${userEmail}`, 120, 46);
      doc.text(`Registered Phone: +91 ${userPhone}`, 120, 52);

      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 58, 196, 58);

      // Trip Route Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Trip Summary & Captain Details", 14, 68);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Captain Name: ${ride.captainName}`, 14, 76);
      doc.text(`Vehicle: ${ride.vehicleType} (${ride.vehicleNumber})`, 14, 82);
      doc.text(`Distance & Duration: ${ride.distance} • ${ride.duration}`, 14, 88);

      doc.text(`Pickup Location: ${ride.pickup}`, 14, 96);
      doc.text(`Drop Destination: ${ride.drop}`, 14, 102);

      doc.line(14, 110, 196, 110);

      // Fare Breakdown Table
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Fare Breakdown", 14, 120);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Base Fare", 14, 130);
      doc.text(`INR ${ride.baseFare || 35}.00`, 160, 130, { align: "right" });

      doc.text("Distance & Commute Charges", 14, 138);
      doc.text(`INR ${ride.distanceFare || 125}.00`, 160, 138, { align: "right" });

      doc.text("GST (5%) & Platform Convenience Fee", 14, 146);
      doc.text(`INR ${ride.taxes || 20}.00`, 160, 146, { align: "right" });

      doc.setDrawColor(203, 213, 225);
      doc.line(14, 154, 196, 154);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total Amount Paid", 14, 164);
      doc.text(`INR ${ride.fare}.00`, 160, 164, { align: "right" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Payment Mode: ${ride.paymentMode} (Transaction Verified)`, 14, 172);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("This is a computer-generated GST tax invoice and does not require physical signature.", 14, 270);
      doc.text("For 24x7 customer assistance, visit Help & Support on your RideX app or email support@ridex.com", 14, 276);

      // 1. Download PDF to device
      doc.save(`RideX-Tax-Invoice-${ride.id}.pdf`);
    } catch (err) {
      console.warn("PDF generation error:", err);
    }

    // 2. Simulate sending to registered Gmail & show popup
    setTimeout(() => {
      setIsSendingInvoice(false);
      setInvoiceSentSuccess({
        tripId: ride.id,
        email: userEmail || "smruti@fleetcorp.com",
        fare: ride.fare,
        date: ride.date
      });
      showToast(
        "PDF Invoice Sent to Gmail",
        `Receipt for #${ride.id} dispatched to ${userEmail || 'your registered Gmail'}`
      );
    }, 900);
  };

  const handleClaimDailyCoins = () => {
    if (!dailyClaimed) {
      setDailyClaimed(true);
      setRidexCoins(prev => prev + 20);
      setCoinTransactions(prev => [
        {
          id: Date.now(),
          title: "Daily Check-in Bonus Claimed",
          coins: "+20",
          date: "Just now",
          type: "credit"
        },
        ...prev
      ]);
      showToast("🎉 20 RideX Coins Claimed!", "Added to your RideX Coins balance.");
    }
  };

  const handleRedeemVoucher = (coinCost, voucherName) => {
    if (ridexCoins >= coinCost) {
      setRidexCoins(prev => prev - coinCost);
      setCoinTransactions(prev => [
        {
          id: Date.now(),
          title: `Redeemed: ${voucherName}`,
          coins: `-${coinCost}`,
          date: "Just now",
          type: "debit"
        },
        ...prev
      ]);
      showToast("Voucher Unlocked! 🎟️", `${voucherName} is now ready for your next ride.`);
    } else {
      showToast("Insufficient Coins", `You need ${coinCost} coins to unlock this voucher.`);
    }
  };

  // Claims state
  const [claimsList, setClaimsList] = useState([
    {
      id: "CLM-84920",
      type: "Accidental Medical Cover",
      rideId: "BK-8492 (Master Canteen ➔ Patia)",
      date: "28 Aug 2026",
      status: "Approved",
      amount: "₹1,450.00",
      insurancePartner: "Acko General Insurance",
      desc: "Emergency medical reimbursement for minor ankle sprain during trip."
    },
    {
      id: "CLM-73105",
      type: "Lost & Found Item",
      rideId: "BK-7102 (Bhubaneswar Airport ➔ KIIT)",
      date: "14 Jul 2026",
      status: "Settled",
      amount: "Recovered",
      insurancePartner: "RideX On-ground Lost Desk",
      desc: "Boat Earbuds case left behind on Captain's rear seat."
    }
  ]);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [newClaimType, setNewClaimType] = useState("Accidental Medical Expense");
  const [newClaimRideId, setNewClaimRideId] = useState("BK-9281 (Recent Khandagiri Trip)");
  const [newClaimAmount, setNewClaimAmount] = useState("");
  const [newClaimDesc, setNewClaimDesc] = useState("");
  const [claimsActiveFilter, setClaimsActiveFilter] = useState("all");
  const [claimsVehicleTab, setClaimsVehicleTab] = useState("bike"); // 'bike' | 'auto' | 'cab'
  const [showClaimProcedureModal, setShowClaimProcedureModal] = useState(false);
  const [showClaimTermsModal, setShowClaimTermsModal] = useState(false);

  const handleFileNewClaim = () => {
    if (newClaimDesc.trim()) {
      const claimNum = `CLM-${Math.floor(10000 + Math.random() * 90000)}`;
      const newClaimObj = {
        id: claimNum,
        type: newClaimType,
        rideId: newClaimRideId,
        date: "Just now",
        status: "Under Review",
        amount: newClaimAmount ? `₹${parseFloat(newClaimAmount).toFixed(2)}` : "Pending Assessment",
        insurancePartner: "Acko General Insurance",
        desc: newClaimDesc.trim()
      };
      setClaimsList(prev => [newClaimObj, ...prev]);
      setShowNewClaimModal(false);
      setNewClaimDesc("");
      setNewClaimAmount("");
      showToast("Claim Filed Successfully 🛡️", `Claim ID ${claimNum} is under review by the insurance desk.`);
    }
  };

  const handleAddTrustedContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      setTrustedContacts(prev => [
        ...prev,
        {
          id: Date.now(),
          name: newContactName.trim(),
          phone: newContactPhone.trim(),
          relation: newContactRelation
        }
      ]);
      setNewContactName("");
      setNewContactPhone("");
      showToast("Trusted Contact Added", `${newContactName} added to your trusted contacts.`);
    }
  };

  const detectCurrentLocation = () => {
    setIsDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFavCoords([lat, lng]);

          // Attempt Reverse Geocoding via OpenStreetMap / Nominatim API
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
              const parts = data.display_name.split(',');
              const mainTitle = parts[0] + (parts[1] ? `, ${parts[1].trim()}` : '');
              setFavLocationName(mainTitle);
              setFavLocationAddress(data.display_name);
            } else {
              setFavLocationName("Current GPS Location");
              setFavLocationAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}, Bhubaneswar, Odisha`);
            }
          } catch {
            setFavLocationName("Current GPS Location");
            setFavLocationAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}, Bhubaneswar, Odisha`);
          }
          setIsDetectingLocation(false);
          showToast("Live Location Detected", "Map centered to your current live GPS position.");
        },
        (error) => {
          console.warn("Geolocation denied or timed out:", error);
          setFavCoords([20.3015, 85.7890]);
          setFavLocationName("Areal constructions & Geoindia Services");
          setFavLocationAddress("GA-732, Bharatpur, Bhubaneswar, Odisha 751029, India");
          setIsDetectingLocation(false);
          showToast("GPS Notice", "Using Bharatpur, Bhubaneswar location.");
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      setIsDetectingLocation(false);
      showToast("GPS Notice", "Geolocation not supported by device.");
    }
  };

  const handleSavePickedFavourite = () => {
    const finalTag = favSelectedTag === "+ Add New" && customTagInput.trim() ? customTagInput.trim() : favSelectedTag;
    setFavouritesList(prev => [
      ...prev,
      {
        id: Date.now(),
        type: finalTag,
        name: favLocationName,
        address: favLocationAddress,
        coords: favCoords
      }
    ]);
    setActiveSubModal("favourites");
    showToast("Saved to Favourites", `${finalTag} (${favLocationName}) added to favourites!`);
  };

  const [deleteSuccessPopup, setDeleteSuccessPopup] = useState(false);
  const [aboutDocView, setAboutDocView] = useState(null);
  const [proToast, setProToast] = useState(null);

  const showToast = (title, message) => {
    setProToast({ title, message });
    setTimeout(() => setProToast(null), 3500);
  };

  const handleDeleteSubmit = () => {
    if (deleteReason || customDeleteReason) {
      setShowDeleteModal(false);
      setDeleteSuccessPopup(true);
    }
  };

  const handleAddMoneySubmit = () => {
    const num = Number(addMoneyAmount);
    if (num > 0) {
      setWalletBalance(prev => prev + num);
      const now = new Date();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear().toString().slice(-2)}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      setPassbookList(prev => [
        {
          id: Date.now(),
          type: "Credit",
          mode: "RideX Wallet Recharge",
          date: dateStr,
          amount: `+ ₹${num.toFixed(2)}`
        },
        ...prev
      ]);

      setAddMoneySuccess(true);
      setTimeout(() => {
        setAddMoneySuccess(false);
        setActiveSubModal("payment");
      }, 1400);
    }
  };

  const getDynamicUserDetails = () => {
    let name = user?.name;
    let phone = user?.phone;
    let email = user?.email;
    let avatar = user?.avatar;

    // Search in registered users database/localStorage
    try {
      const rawUsers = localStorage.getItem('fleetcorp_registered_users');
      if (rawUsers) {
        const usersList = JSON.parse(rawUsers);
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);
        const cleanEmail = (email || '').trim().toLowerCase();
        const matched = usersList.find(u => {
          const emailMatch = cleanEmail && u.email && u.email.toLowerCase() === cleanEmail;
          const phoneMatch = cleanPhone && (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === cleanPhone;
          return emailMatch || phoneMatch;
        });

        if (matched) {
          if (!name || name === 'Rider' || name === 'Captain' || name === 'User') name = matched.name;
          if (!phone) phone = matched.phone;
          if (!email) email = matched.email;
          if (!avatar && matched.avatar) avatar = matched.avatar;
        }
      }
    } catch (e) {}

    // Check stored user object
    if (!name || name === 'Rider' || name === 'Captain' || name === 'User') {
      try {
        const saved = sessionStorage.getItem('fleetcorp_user') || localStorage.getItem('fleetcorp_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name && parsed.name !== 'Rider' && parsed.name !== 'Captain') name = parsed.name;
          if (parsed.phone && !phone) phone = parsed.phone;
          if (parsed.email && !email) email = parsed.email;
        }
      } catch (e) {}
    }

    return {
      name: name || "Smrutiranjan Nayak",
      phone: phone || "7894695441",
      email: email || "smruti@fleetcorp.com",
      avatar: avatar || user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    };
  };

  const dynamicUser = getDynamicUserDetails();
  const userPhone = dynamicUser.phone;
  const userName = dynamicUser.name;
  const userEmail = dynamicUser.email;
  const userAvatar = dynamicUser.avatar;
  const userRole = user?.role || "rider";
  const isCaptain = userRole === 'captain' || user?.role === 'captain';

  // Dynamic Resolver for 100% Real Registered Captain Vehicle & License Details
  const getRegisteredCaptainDetails = () => {
    let capProf = captainProfile || user?.captainProfile || null;
    let vehicle = capProf?.vehicle || user?.vehicleDetails || user?.vehicle || null;
    let license = capProf?.licenseNumber || user?.licenseNumber || null;

    // Search in localStorage registered users
    try {
      const rawUsers = localStorage.getItem('fleetcorp_registered_users');
      if (rawUsers) {
        const usersList = JSON.parse(rawUsers);
        const cleanPhone = (userPhone || '').replace(/[^0-9]/g, '').slice(-10);
        const matched = usersList.find(u => {
          const emailMatch = userEmail && u.email && u.email.toLowerCase() === userEmail.toLowerCase();
          const phoneMatch = cleanPhone && (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === cleanPhone;
          return emailMatch || phoneMatch;
        });

        if (matched) {
          if (!vehicle && matched.captainProfile?.vehicle) vehicle = matched.captainProfile.vehicle;
          if (!vehicle && matched.vehicleDetails) vehicle = matched.vehicleDetails;
          if (!vehicle && matched.vehicle) vehicle = matched.vehicle;
          if (!license && matched.captainProfile?.licenseNumber) license = matched.captainProfile.licenseNumber;
          if (!license && matched.licenseNumber) license = matched.licenseNumber;
        }
      }
    } catch (e) {}

    // Fallback search in session/local storage
    if (!vehicle || !license) {
      try {
        const storedCap = sessionStorage.getItem('fleetcorp_captain') || localStorage.getItem('fleetcorp_captain');
        if (storedCap) {
          const parsed = JSON.parse(storedCap);
          if (!vehicle && parsed.vehicle) vehicle = parsed.vehicle;
          if (!license && parsed.licenseNumber) license = parsed.licenseNumber;
        }
      } catch (e) {}
    }

    const finalModel = vehicle?.model || vehicle?.name || "Hero Splendor Plus";
    const finalCategory = vehicle?.category || "bike";
    const finalNumberPlate = vehicle?.numberPlate || vehicle?.plateNumber || ("OD-02-" + (userPhone ? userPhone.slice(-4) : "2026"));
    const finalLicense = license || ("DL-OD02-" + (userPhone ? userPhone.slice(-6) : "202688"));

    return {
      model: finalModel,
      category: finalCategory,
      numberPlate: finalNumberPlate,
      licenseNumber: finalLicense
    };
  };

  const realCaptainSpecs = getRegisteredCaptainDetails();
  const captainVehicle = {
    model: realCaptainSpecs.model,
    category: realCaptainSpecs.category,
    numberPlate: realCaptainSpecs.numberPlate
  };
  const captainLicense = realCaptainSpecs.licenseNumber;
  const captainPartnerId = "RDX-CAP-" + (userPhone ? userPhone.slice(-4) : "9224");

  const handleDownloadIdCard = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54] // Standard Smart ID Card dimensions (85.6mm x 54mm)
      });

      // Background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 85.6, 54, "F");

      // Top Gold Bar
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 85.6, 9, "F");

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("RideX MOBILITY • SMART DRIVER ID", 4, 6.2);

      // Photo Box
      doc.setDrawColor(245, 158, 11);
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(4, 12, 16, 20, 1, 1, "FD");

      const avatarSrc = user?.avatar;
      if (avatarSrc && avatarSrc.startsWith("data:image")) {
        try {
          doc.addImage(avatarSrc, "JPEG", 4.2, 12.2, 15.6, 19.6);
        } catch (e) {
          doc.setFontSize(6);
          doc.setTextColor(245, 158, 11);
          doc.text("PHOTO", 6.5, 23);
        }
      } else {
        doc.setFontSize(6);
        doc.setTextColor(245, 158, 11);
        doc.text("PHOTO", 6.5, 23);
      }

      // Details
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(userName.toUpperCase(), 23, 16);

      doc.setFontSize(6);
      doc.setTextColor(245, 158, 11);
      doc.text(`ID: ${captainPartnerId} • VERIFIED CAPTAIN`, 23, 20);

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(5.5);
      doc.text(`Vehicle: ${captainVehicle.category?.toUpperCase()} (${captainVehicle.model})`, 23, 25);
      doc.text(`Plate No: ${captainVehicle.numberPlate}`, 23, 29);
      doc.text(`DL No: ${captainLicense}`, 23, 33);
      doc.text(`Phone: +91 ${userPhone}`, 23, 37);
      doc.text(`Emergency SOS: 1800-RIDEX-SOS`, 23, 41);

      // Bottom Footer Bar
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 46, 85.6, 8, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(4.5);
      doc.text("Valid All Across Odisha • 100% Police Verified • Valid Till: 2031", 4, 51);

      doc.save(`RideX-Captain-ID-${captainPartnerId}.pdf`);
      showToast("ID Card Downloaded! 🪪", "Official RideX Smart Partner Card saved to your device.");
    } catch (e) {
      console.warn("ID Card PDF download error", e);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (isSupportChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSupportChatOpen]);

  const openSupportChat = (initialIssue = "I have an issue with RideX Coins") => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages([
      { id: 1, sender: 'bot', text: `Hi ${userName}, Welcome to RideX Support!`, time: timeStr },
      { id: 2, sender: 'bot', text: initialIssue, time: timeStr },
      { id: 3, sender: 'bot', text: 'Please wait while we connect you to an Agent', time: timeStr }
    ]);
    setIsSupportChatOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!supportInput.trim() && !attachedImagePreview) return;

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: supportInput.trim(),
      image: attachedImagePreview,
      time: timeStr
    };

    setChatMessages(prev => [...prev, newMsg]);

    const ticketId = 'TCK-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket = {
      id: ticketId,
      userRole: isCaptain ? 'captain' : 'rider',
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone,
      subject: selectedHelpTopic || selectedFaqArticle || (isCaptain ? "Captain Support Request" : "Customer Support Inquiry"),
      category: isCaptain ? "Captain Inquiries & Payouts" : "Customer Commute & Billing",
      description: supportInput.trim() || "User submitted an issue screenshot.",
      attachment: attachedImagePreview,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [newMsg],
      adminReply: null,
      resolvedAt: null
    };

    try {
      const existingTickets = JSON.parse(localStorage.getItem('ridex_support_tickets') || '[]');
      localStorage.setItem('ridex_support_tickets', JSON.stringify([newTicket, ...existingTickets]));

      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'NEW_SUPPORT_TICKET', data: newTicket });
        channel.close();
      }
    } catch (err) {}

    setSupportInput("");
    setAttachedImagePreview(null);

    // Automated Agent Acknowledgement with Ticket ID
    setTimeout(() => {
      const agentTime = `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`;
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Thank you ${userName}. Your issue has been logged under Support Ticket #${ticketId}. Our Administrator Desk has received your request and will verify and reply directly to your notifications drawer.`,
          time: agentTime
        }
      ]);
    }, 1000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("SMRUTI50");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    {
      id: "help",
      icon: HelpCircle,
      title: "Help & Support",
      subtitle: null,
      badge: null,
      onClick: () => {
        setSelectedHelpTopic(null);
        setActiveSubModal("help");
      }
    },
    ...(isCaptain ? [
      {
        id: "id_card",
        icon: UserCheck,
        title: "RideX ID Card",
        subtitle: "Digital Partner Badge & License",
        badge: "VERIFIED 🪪",
        onClick: () => setActiveSubModal("id_card")
      }
    ] : []),
    ...(!isCaptain ? [
      {
        id: "my-rides",
        icon: History,
        title: "My Rides",
        subtitle: null,
        badge: null,
        onClick: () => {
          setSelectedRideReceipt(null);
          setActiveSubModal("my_rides");
        }
      }
    ] : []),
    {
      id: "safety",
      icon: ShieldCheck,
      title: "Safety",
      subtitle: null,
      badge: null,
      onClick: () => setActiveSubModal("safety")
    },
    ...(!isCaptain ? [
      {
        id: "refer",
        icon: Gift,
        title: "Refer and Earn",
        subtitle: "Get ₹50",
        badge: null,
        onClick: () => setActiveSubModal("refer")
      },
      {
        id: "rewards",
        icon: Award,
        title: "My Rewards",
        subtitle: null,
        badge: null,
        onClick: () => setActiveSubModal("ridex_coins")
      },
      {
        id: "payment",
        icon: CreditCard,
        title: "Payments",
        subtitle: null,
        badge: null,
        onClick: () => {
          setActiveSubModal("payment");
        }
      },
      {
        id: "ridex_coins",
        icon: Coins,
        title: "RideX Coins",
        subtitle: null,
        badge: null,
        onClick: () => setActiveSubModal("ridex_coins")
      }
    ] : []),
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      subtitle: null,
      badge: null,
      onClick: () => setActiveSubModal("notifications")
    },
    {
      id: "claims",
      icon: Shield,
      title: "Claims",
      subtitle: null,
      badge: null,
      onClick: () => setActiveSubModal("claims")
    },
    {
      id: "settings",
      icon: SettingsIcon,
      title: "Settings",
      subtitle: null,
      badge: null,
      onClick: () => setActiveSubModal("settings")
    }
  ];

  const helpTopicsList = [
    {
      id: "fare",
      title: "Ride fare related Issues",
      icon: "🛵",
      subIssues: [
        "I have been charged higher than the estimated fare",
        "I have been charged a cancellation fee",
        "I didn't take the ride but I was charged for the same",
        "I didn't receive cashback in my wallet",
        "Billing Related Issues"
      ]
    },
    {
      id: "captain",
      title: "Captain and Vehicle related issues",
      icon: "🪖",
      subIssues: [
        "Captain was rude or unprofessional",
        "Captain was driving dangerously",
        "Captain asked me to cancel the ride",
        "Captain was demanding extra cash",
        "Captain/Vehicle details didn't match",
        "I have an issue with the given helmet",
        "I left an item/my personal belonging in the vehicle",
        "I want to report an issue about the Captain/Ride"
      ]
    },
    {
      id: "payment",
      title: "Pass and Payment related Issues",
      icon: "💵",
      subIssues: [
        "Payment & Wallets",
        "RideX Coins",
        "Power Pass"
      ]
    },
    {
      id: "other",
      title: "Other Topics",
      icon: "⚙️",
      subIssues: [
        "Account & App",
        "Referrals"
      ]
    }
  ];

  const filteredHelpTopics = helpTopicsList.filter(t => 
    t.title.toLowerCase().includes(helpSearch.toLowerCase())
  );

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      
      {/* 1. Backdrop overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
      />

      {/* 2. Solid Right Drawer Panel */}
      <div 
        className="fixed inset-y-0 right-0 z-[100000] w-full sm:max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900">
          
          {/* Top Profile Card matching Screenshot */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-4 shadow-sm space-y-3">
            <div 
              onClick={() => setActiveSubModal("user_details")}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full ring-2 ring-amber-500 bg-amber-500/10 flex items-center justify-center text-xl overflow-hidden shrink-0">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    "👨‍💼"
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {userName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                    {userPhone}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="border-t border-slate-200/80 dark:border-slate-700" />

            {/* 4.92 My Rating */}
            <div 
              onClick={() => setActiveSubModal("rating")}
              className="flex items-center justify-between cursor-pointer group py-0.5"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  4.92 My Rating
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Section Items: Help, My Rides, Safety, Refer & Earn, Wallet, Notification, Settings */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full py-3.5 px-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500/15 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Banner matching Screenshot: Earn money with RideX - Become a Captain! */}
          <div className="pt-2">
            <div
              onClick={() => {
                onClose();
                navigate('/captain');
              }}
              className="w-full p-4 rounded-3xl bg-[#FEF9EE] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-800/60 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="space-y-1 z-10">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Earn money with RideX
                </h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Become a Captain!
                </p>
              </div>

              {/* Captain Illustration / Badge matching screenshot */}
              <div className="flex items-center gap-2 z-10">
                <div className="w-16 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-2xl border border-amber-300/80 shadow-inner group-hover:scale-105 transition-transform">
                  🛵👨‍✈️
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-Views for Sections */}
        <AnimatePresence>
          {activeSubModal && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white dark:bg-slate-900 z-20 flex flex-col overflow-y-auto"
            >
              
              {/* === CAPTAIN OFFICIAL RIDEX ID CARD SCREEN === */}
              {activeSubModal === "id_card" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubModal(null)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          RideX Smart ID Card <BadgeCheck className="w-5 h-5 text-amber-500 fill-amber-500" />
                        </h2>
                        <p className="text-[11px] text-slate-400 font-medium">Official Driver Partner Identity & Credentials</p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadIdCard}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {/* Scrollable ID Card Container */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    
                    {/* Compliance Banner */}
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> 100% Police Verified & RTO Compliant
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        ACTIVE DUTY
                      </span>
                    </div>

                    {/* DIGITAL SMART ID CARD (PVC Physical Card Simulation) */}
                    <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 space-y-4">
                      
                      {/* Top Holographic Header Bar */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-1">
                              Ride<span className="text-amber-400">X</span> MOBILITY
                            </h3>
                            <p className="text-[9px] font-bold text-amber-400/90 tracking-widest uppercase">
                              Smart Driver Identity Card
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono font-black text-amber-400 block">
                            {captainPartnerId}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                            RTO ODISHA
                          </span>
                        </div>
                      </div>

                      {/* Photo & Primary Bio Row */}
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
                            alt={userName}
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-500/60 shadow-lg"
                          />
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px]">
                            ✓
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-base text-white leading-tight">
                              {userName}
                            </h4>
                          </div>
                          <p className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                            ⭐ 4.95 Certified Fleet Captain
                          </p>
                          <p className="text-[11px] text-slate-300 font-mono">
                            📞 +91 {userPhone}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                              🩸 Blood: O+
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              KYC Approved
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle & License Specs Grid */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Vehicle</span>
                            <span className="font-extrabold text-white">{captainVehicle.model} ({captainVehicle.category?.toUpperCase()})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Registration Plate</span>
                            <span className="font-mono font-extrabold text-amber-400">{captainVehicle.numberPlate}</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-800/80 pt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Driving License</span>
                            <span className="font-mono font-bold text-slate-200">{captainLicense}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Validity Period</span>
                            <span className="font-bold text-emerald-400">2026 — 2031 (Active)</span>
                          </div>
                        </div>
                      </div>

                      {/* QR Code & Safety Verification Strip */}
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                            <QrCode className="w-10 h-10 text-slate-950" />
                          </div>
                          <div>
                            <p className="text-[11px] font-extrabold text-white">Instant RTO / Police QR Audit</p>
                            <p className="text-[9px] text-slate-400">Scan for 100% verified cloud background report</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 block">Fleet Operations</span>
                          <span className="text-[10px] font-serif italic text-amber-300 font-bold">RideX Authorized</span>
                        </div>
                      </div>

                      {/* Card Footer Microtext */}
                      <div className="pt-1 text-center">
                        <p className="text-[8px] text-slate-500 font-medium">
                          Property of RideX Mobility India Ltd. Recognized across all Odisha RTO & Police jurisdictions.
                        </p>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadIdCard}
                        className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://ridex.in/verify/captain/${captainPartnerId}`);
                          showToast("Verification Link Copied! 📋", "Shareable digital badge URL copied to clipboard.");
                        }}
                        className="py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-amber-500" />
                        <span>Share Badge Link</span>
                      </button>
                    </div>

                    {/* 24x7 SOS Support Helpline Card */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white">Emergency Driver Support</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">24x7 Priority Assistance for On-Duty Captains</p>
                      </div>
                      <a
                        href="tel:1800743399"
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shrink-0 flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" /> 1800-RIDEX-SOS
                      </a>
                    </div>

                  </div>
                </div>
              )}

              {/* === 0. MY RIDES / PREVIOUS COMPLETED RIDES SCREEN === */}
              {activeSubModal === "my_rides" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
                  
                  {/* Top Bar with ← Arrow */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedRideReceipt) {
                            setSelectedRideReceipt(null);
                          } else {
                            setActiveSubModal(null);
                          }
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {selectedRideReceipt ? "Ride Receipt" : "My Rides"}
                        </h2>
                        {!selectedRideReceipt && (
                          <p className="text-[11px] text-slate-400 font-medium">Your trip history & completed rides</p>
                        )}
                      </div>
                    </div>

                    {!selectedRideReceipt && (
                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {ridesHistoryList.filter(r => r.status === 'completed').length} Completed
                      </span>
                    )}
                  </div>

                  {selectedRideReceipt ? (
                    /* Detailed Trip Receipt / Invoice View */
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 animate-in fade-in">
                      
                      {/* Status & ID Header Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Trip Completed
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{selectedRideReceipt.id}
                          </span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                          ₹{selectedRideReceipt.fare}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold">
                          Paid via {selectedRideReceipt.paymentMode} • {selectedRideReceipt.date}
                        </p>
                      </div>

                      {/* Route Details */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trip Route</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                            <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase">Pickup Location</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedRideReceipt.pickup}</p>
                            </div>
                          </div>
                          <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-1.5 pl-3 py-1 text-[11px] text-slate-400 font-medium">
                            {selectedRideReceipt.distance} • {selectedRideReceipt.duration}
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                            <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase">Drop Destination</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedRideReceipt.drop}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Captain & Vehicle Info */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
                            {selectedRideReceipt.vehicleIcon}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{selectedRideReceipt.captainName}</p>
                            <p className="text-[10px] text-slate-500 font-mono font-semibold">{selectedRideReceipt.vehicleType} • {selectedRideReceipt.vehicleNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {selectedRideReceipt.userRating}.0
                          </span>
                        </div>
                      </div>

                      {/* Fare Breakdown Table */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fare Breakdown</p>
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <span>Base Fare</span>
                          <span className="font-mono font-semibold">₹{selectedRideReceipt.baseFare || 35}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <span>Distance & Time Fee</span>
                          <span className="font-mono font-semibold">₹{selectedRideReceipt.distanceFare || 125}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <span>GST & Platform Charges</span>
                          <span className="font-mono font-semibold">₹{selectedRideReceipt.taxes || 20}</span>
                        </div>
                        <div className="flex justify-between pt-1 font-black text-sm text-slate-900 dark:text-white">
                          <span>Total Paid</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400">₹{selectedRideReceipt.fare}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => handleDownloadAndEmailInvoice(selectedRideReceipt)}
                          disabled={isSendingInvoice}
                          className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] disabled:opacity-75"
                        >
                          {isSendingInvoice ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                              <span>Generating PDF & Sending to Gmail...</span>
                            </>
                          ) : (
                            <>
                              <Receipt className="w-4 h-4 text-amber-500" />
                              <span>Download Official Tax Invoice (PDF)</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            navigate('/rider/book');
                          }}
                          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                        >
                          <RotateCcw className="w-4 h-4" /> Book this Route Again ➔
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* My Rides List View */
                    <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                      
                      {/* Filter Tabs */}
                      <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {["all", "completed", "cancelled"].map((filter) => {
                          const isCurrent = ridesFilter === filter;
                          const count = filter === "all" 
                            ? ridesHistoryList.length 
                            : ridesHistoryList.filter(r => r.status === filter).length;
                          return (
                            <button
                              key={filter}
                              onClick={() => setRidesFilter(filter)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                              }`}
                            >
                              {filter === "all" ? "All Trips" : filter} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* Rides List */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {ridesHistoryList
                          .filter(r => ridesFilter === "all" || r.status === ridesFilter)
                          .map((ride) => (
                            <div
                              key={ride.id}
                              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all space-y-3 shadow-sm group"
                            >
                              {/* Top Bar: Vehicle Type, Status, Date */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{ride.vehicleIcon}</span>
                                  <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white">{ride.vehicleType}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{ride.date}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {ride.status === "completed" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <Check className="w-3 h-3" /> Completed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                      Cancelled
                                    </span>
                                  )}
                                  <p className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                                    {ride.status === "completed" ? `₹${ride.fare}` : "₹0"}
                                  </p>
                                </div>
                              </div>

                              {/* Route Summary */}
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="truncate font-semibold">{ride.pickup}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                  <span className="truncate font-semibold">{ride.drop}</span>
                                </div>
                              </div>

                              {/* Captain & Action Buttons */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  Captain: <b className="text-slate-700 dark:text-slate-200">{ride.captainName}</b>
                                </p>

                                <div className="flex items-center gap-2">
                                  {ride.status === "completed" && (
                                    <button
                                      onClick={() => setSelectedRideReceipt(ride)}
                                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-500 text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Receipt className="w-3 h-3 text-amber-500" /> Receipt
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      onClose();
                                      navigate('/rider/book');
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Rebook
                                  </button>
                                </div>
                              </div>

                            </div>
                          ))}
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* === 1. EXACT RAPIDO HELP SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "help" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
                  
                  {/* Top Bar with ← Help/FAQs and 🎫 Tickets */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedHelpTopic) {
                            setSelectedHelpTopic(null);
                          } else {
                            setActiveSubModal(null);
                          }
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {selectedHelpTopic ? "FAQs" : "Help"}
                      </h2>
                    </div>

                    <button
                      onClick={() => setShowTicketsModal(!showTicketsModal)}
                      className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Ticket className="w-4 h-4 text-amber-500" />
                      <span>Tickets</span>
                    </button>
                  </div>

                  {showTicketsModal ? (
                    <div className="space-y-3 py-2 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Support Tickets</h3>
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">#TK-8492</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            Resolved
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Discrepancy in ride fare calculation
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ₹45 adjusted and credited to your Corporate Wallet.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowTicketsModal(false)}
                        className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Back to Help Topics
                      </button>
                    </div>
                  ) : !selectedHelpTopic ? (
                    <div className="space-y-4 flex-1">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2.5">
                          Help topics
                        </h3>

                        {/* Search Help Topics Input */}
                        <div className="relative mb-3.5">
                          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search Help Topics"
                            value={helpSearch}
                            onChange={(e) => setHelpSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        {/* Card matching user's screenshot */}
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                          {filteredHelpTopics.map((topic) => (
                            <button
                              key={topic.id}
                              onClick={() => {
                                setSelectedHelpTopic(topic);
                                setTicketRaised(false);
                              }}
                              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-700/80 shrink-0">
                                  {topic.icon}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                                  {topic.title}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 24x7 Quick Call Support Desk */}
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Need Live Agent Support?</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Toll Free: 1800-419-8899</p>
                        </div>
                        <a
                          href="tel:18004198899"
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Us
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* Specific Help Topic Detail View (Exact match with Screenshots 1-4) */
                    <div className="space-y-3 flex-1">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white pt-1 px-0.5">
                        {selectedHelpTopic.title}
                      </h3>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {selectedHelpTopic.subIssues.map((sub, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              openSupportChat(`Issue regarding ${selectedHelpTopic.title}: ${sub}`);
                            }}
                            className="w-full py-4 px-1 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            <span className="font-bold text-sm text-slate-900 dark:text-white pr-4 group-hover:text-amber-500 transition-colors leading-snug">
                              {sub}
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* === 2. EXACT RAPIDO PAYMENTS SCREEN MATCHING SCREENSHOTS === */}
              {(activeSubModal === "payment" || activeSubModal === "wallet") && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
                  
                  {/* Top Bar with ← Payments and ❔ Help */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubModal(null)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Payments
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPaymentFaqTopic(null);
                        setActiveSubModal("payment_faqs");
                      }}
                      className="px-3 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span>Help</span>
                    </button>
                  </div>

                  {/* Section 1: Wallets */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      Wallets
                    </h3>

                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* RideX Wallet */}
                      <div className="p-4 space-y-3">
                        <div 
                          onClick={() => setActiveSubModal("ridex_wallet")}
                          className="flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:border-amber-500 transition-colors">
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                RideX Wallet
                              </h4>
                              <p className={`text-xs font-semibold ${walletBalance > 0 ? "text-emerald-500 font-bold" : "text-rose-500"}`}>
                                {walletBalance > 0 ? `Balance: ₹${walletBalance.toFixed(2)}` : "Low Balance: ₹0.0"}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                        </div>

                        <button
                          onClick={() => {
                            setAddMoneyAmount("50");
                            setAddMoneySuccess(false);
                            setActiveSubModal("add_money");
                          }}
                          className="px-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <span>+ Add Money</span>
                        </button>
                      </div>

                      {/* AmazonPay */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                            pay
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            AmazonPay
                          </span>
                        </div>
                        <button
                          onClick={() => alert("AmazonPay linked successfully!")}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                        >
                          LINK
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Section 2: Pay by any UPI app */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs px-1.5 py-0.5 bg-slate-800 text-white rounded font-mono">UPI</span>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        Pay by any UPI app
                      </h3>
                    </div>

                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* Paytm + Cashback Banner */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 font-black text-xs flex items-center justify-center">
                            paytm
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">Paytm</span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-amber-500 shrink-0 mt-0.5">🏷️</span>
                          <p className="leading-snug">
                            <span className="font-bold text-slate-900 dark:text-white">Flat ₹30 Cashback</span> | Min. payment ₹35 | Once per user | Offer valid for users who have not used Paytm UPI anywhere in the last 60 days.
                          </p>
                        </div>
                      </div>

                      {/* GPay */}
                      <div 
                        onClick={() => alert("Google Pay selected for 1-Click Ride Checkout")}
                        className="p-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-blue-500 font-sans">GPay</span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">GPay</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">Linked</span>
                      </div>

                      {/* PhonePe */}
                      <div 
                        onClick={() => alert("PhonePe selected for 1-Click Ride Checkout")}
                        className="p-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                            पे
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">PhonePe</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">Linked</span>
                      </div>

                      {/* FreechargeBiz */}
                      <div className="p-3.5 px-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 font-bold text-xs flex items-center justify-center">
                          ⚡
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">FreechargeBiz</span>
                      </div>

                      {/* Flipkart */}
                      <div className="p-3.5 px-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center">
                          fk
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Flipkart</span>
                      </div>

                      {/* Navi */}
                      <div className="p-3.5 px-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                          N
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Navi</span>
                      </div>

                      {/* MobiKwik */}
                      <div className="p-3.5 px-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          M
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">MobiKwik</span>
                      </div>

                    </div>
                  </div>

                  {/* Section 3: Pay Later */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      Pay Later
                    </h3>

                    <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔲</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Pay at drop
                        </span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <span className="text-amber-500">🏷️</span>
                        <span>Go cashless, after ride pay by scanning QR code</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Others */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      Others
                    </h3>

                    <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💵</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Cash</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-500">Active</span>
                    </div>
                  </div>

                  {/* Section 5: Show Passbook */}
                  <div className="pt-1">
                    <div 
                      onClick={() => setActiveSubModal("passbook")}
                      className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🪪</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          Show Passbook
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                </div>
              )}

              {/* === 3. EXACT RAPIDO PASSBOOK SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "passbook" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4">
                  
                  {/* Top Bar with ← Passbook and ❔ Help */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubModal("payment")}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Passbook
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPaymentFaqTopic(null);
                        setActiveSubModal("payment_faqs");
                      }}
                      className="px-3 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span>Help</span>
                    </button>
                  </div>

                  {/* Transaction List matching user screenshot */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {passbookList.map((tx) => (
                      <div key={tx.id} className="py-3.5 flex items-start justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors">
                        <div className="flex items-start gap-3.5">
                          {/* Circle with Minus or Plus */}
                          {tx.type === "Credit" ? (
                            <div className="w-5 h-5 rounded-full border-2 border-emerald-500/80 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0 text-xs font-bold">
                              +
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-rose-500/80 flex items-center justify-center text-rose-500 mt-0.5 shrink-0">
                              <div className="w-2.5 h-[2px] bg-rose-500 rounded-full" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                              {tx.type}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium lowercase">
                              {tx.mode}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {tx.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold font-mono ${tx.type === "Credit" ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                            {tx.amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* === 4. EXACT RAPIDO PAYMENT FAQS SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "payment_faqs" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-3">
                  
                  {/* Top Bar with ← Title and 🎫 Tickets */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isSupportChatOpen) {
                            setIsSupportChatOpen(false);
                          } else if (ticketRaised) {
                            setTicketRaised(false);
                          } else if (selectedFaqArticle) {
                            setSelectedFaqArticle(null);
                          } else if (selectedPaymentFaqTopic) {
                            setSelectedPaymentFaqTopic(null);
                          } else {
                            setActiveSubModal("payment");
                          }
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {isSupportChatOpen ? "Support Chat" : "FAQs"}
                      </h2>
                    </div>

                    {!isSupportChatOpen && (
                      <button
                        onClick={() => setShowTicketsModal(!showTicketsModal)}
                        className="px-3.5 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Ticket className="w-4 h-4 text-amber-500" />
                        <span>Tickets</span>
                      </button>
                    )}
                  </div>

                  {/* SUB-VIEW 1: LIVE SUPPORT CHATBOT (Matching user screenshot) */}
                  {isSupportChatOpen ? (
                    <div className="flex-1 flex flex-col min-h-0 space-y-3">
                      
                      {/* Date Badge */}
                      <div className="flex justify-center shrink-0">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          Today
                        </span>
                      </div>

                      {/* Chat Messages Stream */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.sender === 'bot' && (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                                <Headphones className="w-4 h-4" />
                              </div>
                            )}

                            <div
                              className={`p-3.5 text-xs sm:text-sm font-medium shadow-sm space-y-1.5 max-w-[85%] ${
                                msg.sender === 'user'
                                  ? 'bg-[#FBF0B9] dark:bg-amber-500/20 text-slate-900 dark:text-amber-100 rounded-2xl rounded-br-none'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-none'
                              }`}
                            >
                              {msg.image && (
                                <div className="rounded-xl overflow-hidden border border-amber-300 dark:border-amber-600/50 mb-1">
                                  <img
                                    src={msg.image}
                                    alt="Uploaded problem screenshot"
                                    className="max-h-48 w-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                <span>{msg.time}</span>
                                {msg.sender === 'user' && (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-700 dark:text-amber-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Image Attachment Preview Box (if selected) */}
                      {attachedImagePreview && (
                        <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={attachedImagePreview}
                              alt="Attachment preview"
                              className="w-10 h-10 rounded-xl object-cover border border-amber-400"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">Photo Attached</p>
                              <p className="text-[10px] text-slate-500">Ready to send with issue description</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAttachedImagePreview(null)}
                            className="p-1 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 text-slate-600 dark:text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Bottom Chat Input Bar */}
                      <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
                        {/* Hidden file input for photo attachment */}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />

                        <input
                          type="text"
                          value={supportInput}
                          onChange={(e) => setSupportInput(e.target.value)}
                          placeholder="Type here"
                          className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                        />

                        {/* Paperclip Button matching screenshot */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                          title="Attach photo / screenshot of issue"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>

                        {/* Send Button */}
                        <button
                          type="submit"
                          disabled={!supportInput.trim() && !attachedImagePreview}
                          className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold transition-all shrink-0"
                          title="Send message"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                    </div>
                  ) : showTicketsModal ? (
                    <div className="space-y-3 py-2 flex-1 overflow-y-auto max-h-[70vh]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-amber-500" /> Your Support Inquiries
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
                      </div>

                      {(() => {
                        let userTickets = [];
                        try {
                          const allTickets = JSON.parse(localStorage.getItem('ridex_support_tickets') || '[]');
                          userTickets = allTickets.filter(t => 
                            (t.userEmail && userEmail && t.userEmail.toLowerCase() === userEmail.toLowerCase()) ||
                            (t.userPhone && userPhone && t.userPhone === userPhone) ||
                            t.userRole === userRole
                          );
                        } catch(e) {}

                        if (userTickets.length === 0) {
                          return (
                            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Active Tickets</p>
                              <p className="text-[11px] text-slate-400">You haven't filed any problem tickets yet. Use the Help options below to chat with Support.</p>
                            </div>
                          );
                        }

                        return userTickets.map((t) => {
                          const isResolved = t.status === 'resolved';
                          return (
                            <div key={t.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">#{t.id}</span>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {t.category}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isResolved
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                                }`}>
                                  {isResolved ? '✅ Resolved' : '⏳ Admin Verifying'}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {t.subject}
                              </p>
                              
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                "{t.description}"
                              </p>

                              {/* Admin Verified Reply */}
                              {t.adminReply ? (
                                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                                  <div className="flex items-center gap-1.5 font-black text-[11px] text-emerald-700 dark:text-emerald-300">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Administrator Official Reply:</span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed font-medium">{t.adminReply}</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3 animate-spin" /> Administrator is reviewing your request...
                                </p>
                              )}
                            </div>
                          );
                        });
                      })()}

                      <button
                        onClick={() => setShowTicketsModal(false)}
                        className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                      >
                        Back to FAQs & Help
                      </button>
                    </div>
                  ) : selectedFaqArticle ? (
                    /* Detailed FAQ Article View matching user's 4 screenshots */
                    <div className="space-y-3.5 flex-1 overflow-y-auto">
                      
                      {/* Question & Answer Card */}
                      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm space-y-3">
                        <div className="flex items-start gap-2.5">
                          <HelpCircle className="w-5 h-5 text-slate-700 dark:text-slate-300 mt-0.5 shrink-0" />
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                            {selectedFaqArticle}
                          </h3>
                        </div>

                        {/* Exact Answer Content with RideX branding */}
                        <div className="space-y-3 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                          
                          {/* 1. RIDEX COINS ARTICLES */}
                          {selectedFaqArticle === "What are RideX Coins?" && (
                            <>
                              <p>
                                RideX Coins is a loyalty program made exclusively for RideX users. If you're eligible, RideX Coins will be credited to your RideX Coins Balance which can be used for upcoming rides. Each RideX Coin is valid for a certain period after which it will expire.
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                Kindly note: 1 RideX Coin is equivalent to 1 INR.
                              </p>
                            </>
                          )}

                          {selectedFaqArticle === "How to earn RideX Coins?" && (
                            <p>
                              You can earn RideX Coins through certain offers/coupons and Referrals. These coins get credited to your RideX Coin Balance.
                            </p>
                          )}

                          {selectedFaqArticle === "I have an issue with RideX Coins" && (
                            <p>
                              We are sorry that you faced an issue with RideX Coins. Please explain your issue below. We will get back to you soon.
                            </p>
                          )}

                          {selectedFaqArticle === "Can I club RideX Coins together with other offers/coupons?" && (
                            <p>
                              Yes, you can. If you have coins in your wallet you can use them for any transaction on RideX platform clubbed with other offers/coupons.
                            </p>
                          )}

                          {/* 2. PAYMENT & WALLETS ARTICLES (Matching User's 5 Screenshots) */}
                          {selectedFaqArticle === "How can I Link/ Unlink a wallet with RideX?" && (
                            <div className="space-y-3">
                              <p>
                                You can go cashless by linking your account with the available wallets.
                              </p>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                To link a wallet,
                              </p>
                              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                                <li>Navigate to Menu &gt; Payment.</li>
                                <li>Choose the wallet of your choice.</li>
                              </ol>
                              <p>
                                A similar process can be followed to unlink a wallet.
                              </p>
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Note : The number registered with the wallet should be the same as the number registered with RIDEX.
                              </p>
                            </div>
                          )}

                          {selectedFaqArticle === "How can I change the payment method?" && (
                            <p>
                              You can select your payment method by navigating to Menu &gt; Payment. Select your preferred mode of payment and set your default payment mode. You can also choose your payment method while booking a RideX.
                            </p>
                          )}

                          {selectedFaqArticle === "How can I add money to my RideX wallet?" && (
                            <p>
                              You can go cashless, by adding money to your RideX wallet. You need to navigate to Menu &gt; Payment, Select RideX Wallet and add the amount that you wish to add.
                            </p>
                          )}

                          {selectedFaqArticle === "Can I transfer money from my RideX wallet?" && (
                            <p>
                              Currently, we do not have a facility to transfer RideX wallet money to any other wallet. However, you may utilise the funds in your wallet by taking joy rides with RideX.
                            </p>
                          )}

                          {selectedFaqArticle === "How can I check my RideX wallet balance?" && (
                            <p>
                              To check your wallet balance, navigate to Menu &gt; Payment.
                            </p>
                          )}

                          {selectedFaqArticle === "I am not able to change my payment method" && (
                            <p>
                              You may not be able to change your payment method due to authentication issues with your linked wallet. We request you to re-link the wallet by Navigating to Menu &gt; Payment. Kindly verify that the number linked to your wallet is your registered mobile number with RideX. However, If you still want us to resolve the issue, please let us know below along with the name of the wallet.
                            </p>
                          )}

                          {selectedFaqArticle === "I am not able to use a particular wallet" && (
                            <p>
                              You may not be able to use a wallet due to authentication issues with the wallet. We request you to re-link the wallet by Navigating to Menu &gt; Payment. Kindly verify that the number linked to your wallet is your registered mobile number with RideX. However, If you still want us to resolve the issue, please let us know below along with the name of the wallet.
                            </p>
                          )}

                          {selectedFaqArticle === "My wallet balance is not updated after recharging" && (
                            <p>
                              Your wallet balance might have not been updated because of multiple reasons: Please check your profile details and mobile number associated with the wallet. Kindly confirm with your bank if the transaction is complete. Note: A recharge to your RideX wallet may take upto 3 hours to get updated. However, If you still need any assistance in this regard, please let us know below.
                            </p>
                          )}

                          {selectedFaqArticle === "There is an unexplained deduction from my wallet" && (
                            <div className="space-y-2">
                              <p>
                                Your wallet may have been deducted for the following reasons:
                              </p>
                              <div className="space-y-1 pl-1">
                                <p>a. Auto-Renewal of Power pass.</p>
                                <p>b. Pending unpaid rides.</p>
                                <p>c. Cancellation fee for your last ride.</p>
                              </div>
                              <p>
                                If the reasons do not fall in these categories, please let us know below along with the name of the wallet.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Was this article helpful? */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Was this article helpful?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setArticleFeedback({ ...articleFeedback, [selectedFaqArticle]: 'yes' })}
                            className={`p-2 rounded-xl border transition-all ${
                              articleFeedback[selectedFaqArticle] === 'yes'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setArticleFeedback({ ...articleFeedback, [selectedFaqArticle]: 'no' })}
                            className={`p-2 rounded-xl border transition-all ${
                              articleFeedback[selectedFaqArticle] === 'no'
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Still facing issues? Card (ONLY for problem articles matching Screenshots) */}
                      {[
                        "I have an issue with RideX Coins",
                        "I am not able to change my payment method",
                        "I am not able to use a particular wallet",
                        "My wallet balance is not updated after recharging",
                        "There is an unexplained deduction from my wallet"
                      ].includes(selectedFaqArticle) && (
                        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm space-y-3">
                          <div className="flex items-start gap-2.5">
                            <HelpCircle className="w-5 h-5 text-slate-700 dark:text-slate-300 mt-0.5 shrink-0" />
                            <div>
                              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                Still facing issues?
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Our customer support is here to help you
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => openSupportChat(selectedFaqArticle || "I have an issue with RideX Coins")}
                            className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                          >
                            <Headphones className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                            <span>Contact Support</span>
                          </button>
                        </div>
                      )}

                    </div>
                  ) : !selectedPaymentFaqTopic ? (
                    /* Main FAQs list matching screenshot */
                    <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* Payment & Wallets */}
                      <button
                        onClick={() => {
                          setSelectedPaymentFaqTopic("Payment & Wallets");
                          setTicketRaised(false);
                        }}
                        className="w-full py-4 px-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <span className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          Payment & Wallets
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      {/* RideX Coins */}
                      <button
                        onClick={() => {
                          setSelectedPaymentFaqTopic("RideX Coins");
                          setTicketRaised(false);
                        }}
                        className="w-full py-4 px-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <span className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          RideX Coins
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                    </div>
                  ) : (
                    /* Detailed FAQ questions matching user's exact screenshots */
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      
                      {/* Sub-header title matching screenshot */}
                      <div className="pt-1 pb-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedPaymentFaqTopic}
                        </h3>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {(selectedPaymentFaqTopic === "Payment & Wallets" ? [
                          "How can I Link/ Unlink a wallet with RideX?",
                          "How can I change the payment method?",
                          "How can I add money to my RideX wallet?",
                          "Can I transfer money from my RideX wallet?",
                          "How can I check my RideX wallet balance?",
                          "I am not able to change my payment method",
                          "I am not able to use a particular wallet",
                          "My wallet balance is not updated after recharging",
                          "There is an unexplained deduction from my wallet"
                        ] : [
                          "What are RideX Coins?",
                          "How to earn RideX Coins?",
                          "I have an issue with RideX Coins",
                          "Can I club RideX Coins together with other offers/coupons?"
                        ]).map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedFaqArticle(question);
                              setTicketRaised(false);
                            }}
                            className="w-full py-3.5 px-1 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors pr-3 leading-snug">
                              {question}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* === 5. EXACT RAPIDO ADD MONEY SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "add_money" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 justify-between">
                  
                  <div className="space-y-6">
                    {/* Top Bar with ← Add Money */}
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                      <button
                        onClick={() => setActiveSubModal("payment")}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Add Money
                      </h2>
                    </div>

                    {/* Notice Text matching user screenshot */}
                    <div className="pt-2">
                      <h3 className="text-base sm:text-lg font-bold text-[#1E293B] dark:text-slate-100 leading-snug">
                        RideX wallet can only be used to pay for Bike Parcel and Bike Rides on RideX
                      </h3>
                    </div>

                    {/* Amount Input Box */}
                    <div className="pt-2">
                      <div className="w-full py-3.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white mr-1">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={addMoneyAmount}
                          onChange={(e) => setAddMoneyAmount(e.target.value)}
                          placeholder="50"
                          className="w-36 text-xl font-extrabold text-slate-900 dark:text-white bg-transparent focus:outline-none text-left"
                        />
                      </div>
                    </div>

                    {/* Quick Preset Buttons (₹100, ₹200, ₹500) */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      {["100", "200", "500"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAddMoneyAmount(preset)}
                          className={`px-6 py-2 rounded-full border text-sm font-bold transition-all ${
                            addMoneyAmount === preset
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-sm'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400'
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>

                    {/* Success notification */}
                    {addMoneySuccess && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span>₹{Number(addMoneyAmount).toFixed(2)} added to your RideX Wallet successfully!</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Sticky Action Button matching yellow pill in screenshot */}
                  <div className="pt-6 pb-2">
                    <button
                      onClick={handleAddMoneySubmit}
                      disabled={!addMoneyAmount || Number(addMoneyAmount) <= 0}
                      className="w-full py-3.5 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-base flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <span className="text-lg">+</span>
                      <span>Add Money</span>
                    </button>
                  </div>

                </div>
              )}

              {/* === 6. EXACT RAPIDO / RIDEX WALLET SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "ridex_wallet" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-6">
                  
                  {/* Top Bar with ← RideX Wallet and ❔ Help */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubModal("payment")}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        RideX Wallet
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPaymentFaqTopic(null);
                        setActiveSubModal("payment_faqs");
                      }}
                      className="px-3 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span>Help</span>
                    </button>
                  </div>

                  {/* List Container matching user screenshot */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    
                    {/* Row 1: Balance */}
                    <div className="py-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Balance
                        </h4>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                          ₹{walletBalance.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Row 2: Wallet Transactions */}
                    <button
                      onClick={() => setActiveSubModal("passbook")}
                      className="w-full py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <History className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          Wallet Transactions
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                    </button>

                  </div>

                  {/* Centered Action Button matching screenshot */}
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={() => {
                        setAddMoneyAmount("50");
                        setAddMoneySuccess(false);
                        setActiveSubModal("add_money");
                      }}
                      className="px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-500 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <span>+ Add Money</span>
                    </button>
                  </div>

                </div>
              )}

              {/* === 7. EXACT RAPIDO / RIDEX SETTINGS SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "settings" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-5 overflow-y-auto">
                  
                  {/* Top Bar with ← Settings and ❓ Help */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubModal(null)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Settings
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedHelpTopic(null);
                        setActiveSubModal("help");
                      }}
                      className="px-3 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span>Help</span>
                    </button>
                  </div>

                  {/* Section 1: GENERAL */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold tracking-wider text-[#1E3A8A] dark:text-blue-400 px-1 uppercase">
                      GENERAL
                    </h4>

                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* Profile */}
                      <button
                        onClick={() => setActiveSubModal("user_details")}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <User className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-amber-500 transition-colors" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                              Profile
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              +91 {userPhone}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      {/* Favourites */}
                      <button
                        onClick={() => setActiveSubModal("favourites")}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <Heart className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-amber-500 transition-colors" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                              Favourites
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Manage favourite locations
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      {/* App shortcuts */}
                      <button
                        onClick={() => showToast("App shortcuts", "RideX shortcut created on your home launcher!")}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-amber-500 transition-colors" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                              App shortcuts
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Create shortcuts on home launcher
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                    </div>
                  </div>

                  {/* Section 2: OTHERS */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-extrabold tracking-wider text-[#1E3A8A] dark:text-blue-400 px-1 uppercase">
                      OTHERS
                    </h4>

                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* About */}
                      <button
                        onClick={() => {
                          setAboutDocView(null);
                          setActiveSubModal("about");
                        }}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <Info className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-amber-500 transition-colors" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                              About
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              8.123.0
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      {/* Log out */}
                      <button
                        onClick={() => {
                          handleLogout();
                          showToast("Logged Out", "You have been safely signed out.");
                        }}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-rose-500 transition-colors" />
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                            Log out
                          </h4>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                      {/* Delete Account */}
                      <button
                        onClick={() => {
                          setDeleteReason("");
                          setCustomDeleteReason("");
                          setShowDeleteModal(true);
                        }}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <Trash2 className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                          <h4 className="font-bold text-sm text-rose-600 dark:text-rose-400">
                            Delete Account
                          </h4>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                      </button>

                    </div>
                  </div>

                </div>
              )}

              {/* === 8. EXACT RAPIDO / RIDEX ABOUT SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "about" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 justify-between">
                  
                  <div className="space-y-4">
                    {/* Top Bar with ← About and ❓ Help */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (aboutDocView) {
                              setAboutDocView(null);
                            } else {
                              setActiveSubModal("settings");
                            }
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {aboutDocView === "privacy" ? "Privacy Policy" : aboutDocView === "terms" ? "Terms & Conditions" : "About"}
                        </h2>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedHelpTopic(null);
                          setActiveSubModal("help");
                        }}
                        className="px-3 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        <span>Help</span>
                      </button>
                    </div>

                    {!aboutDocView ? (
                      /* Main Options matching user screenshot (Only Privacy Policy & Terms and conditions) */
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        
                        {/* Privacy Policy */}
                        <button
                          onClick={() => setAboutDocView("privacy")}
                          className="w-full py-4 px-1 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                            Privacy Policy
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        {/* Terms and conditions */}
                        <button
                          onClick={() => setAboutDocView("terms")}
                          className="w-full py-4 px-1 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                            Terms and conditions
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                      </div>
                    ) : aboutDocView === "privacy" ? (
                      /* In-App Privacy Policy Document Viewer */
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[70vh] pr-1">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Information Collection</h4>
                          <p>RideX collects your registered mobile number, pickup/drop coordinates, trip timestamps, and transaction data solely to facilitate reliable ride booking and corporate safety.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. Location Tracking</h4>
                          <p>Real-time GPS telemetry is shared with assigned Captains during active rides for optimal route navigation and emergency SOS safety dispatch.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Data Security & Retention</h4>
                          <p>All sensitive transactions are encrypted via 256-bit SSL protocols. You retain full control to request account deletion anytime under Settings.</p>
                        </div>
                      </div>
                    ) : (
                      /* In-App Terms & Conditions Document Viewer */
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[70vh] pr-1">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. User Agreement</h4>
                          <p>By accessing RideX ride hailing services, you agree to adhere to corporate ride policies, safety norms, and fair fare guidelines.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. Fare & Payment Terms</h4>
                          <p>Fares are estimated based on base rate, estimated travel time, and distance. Final dues are calculated post-trip and debited via selected payment mode.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Safety & Code of Conduct</h4>
                          <p>Helmets are mandatory for bike taxi trips. Mutual respect between Captains and Riders is strictly enforced.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Centered Version text at bottom matching screenshot */}
                  {!aboutDocView && (
                    <div className="mt-auto py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Version 8.123.0
                    </div>
                  )}

                </div>
              )}

              {/* === 9. EXACT RAPIDO / RIDEX FAVOURITES SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "favourites" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 justify-between">
                  
                  {/* Top Bar with ← Favourites */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubModal("settings")}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Favourites
                      </h2>
                    </div>
                  </div>

                  {favouritesList.length === 0 ? (
                    /* Empty State matching user screenshot */
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
                      
                      {/* Illustration: Yellow Location Pin with Sad Pink Face */}
                      <div className="relative w-28 h-28 flex items-center justify-center my-2">
                        {/* Yellow Pin Graphic */}
                        <div className="w-16 h-20 bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] rounded-t-full rounded-b-[45%] flex items-center justify-center shadow-md transform rotate-[-2deg] relative">
                          <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-full" />
                        </div>
                        {/* Pink Sad Emoji Bubble on pin */}
                        <div className="absolute top-1 right-2 w-10 h-10 rounded-full bg-[#FB7185] border-2 border-white dark:border-slate-800 flex items-center justify-center text-lg shadow-md select-none">
                          🙁
                        </div>
                      </div>

                      {/* Text */}
                      <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 max-w-[270px] leading-snug">
                        Add locations that you frequently visit for quick access
                      </p>

                      {/* Rounded Outline Button */}
                      <button
                        onClick={() => {
                          setFavSelectedTag(null);
                          setShowCustomTagInput(false);
                          setCustomTagInput("");
                          setActiveSubModal("fav_map_picker");
                          detectCurrentLocation();
                        }}
                        className="w-full max-w-xs py-3 px-6 rounded-full border border-slate-400/80 dark:border-slate-600 hover:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99]"
                      >
                        Add Favourites
                      </button>

                    </div>
                  ) : (
                    /* Added Favourites List */
                    <div className="flex-1 space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                          Saved Places ({favouritesList.length})
                        </span>
                        <button
                          onClick={() => {
                            setFavSelectedTag(null);
                            setShowCustomTagInput(false);
                            setCustomTagInput("");
                            setActiveSubModal("fav_map_picker");
                            detectCurrentLocation();
                          }}
                          className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add More
                        </button>
                      </div>

                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                        {favouritesList.map((fav) => (
                          <div key={fav.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{fav.type}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{fav.address}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setFavouritesList(prev => prev.filter(f => f.id !== fav.id));
                                showToast("Removed", `${fav.type} removed from Favourites.`);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* === 10. EXACT FAVOURITE LOCATION MAP PICKER SCREEN MATCHING SCREENSHOT === */}
              {activeSubModal === "fav_map_picker" && (
                <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white dark:bg-slate-900">
                  
                  {/* Top Half: Interactive Map View */}
                  <div className="relative w-full h-[45%] min-h-[220px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <MapContainer
                      center={favCoords}
                      zoom={15}
                      scrollWheelZoom={true}
                      zoomControl={false}
                      className="w-full h-full z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      <FavMapCenterTracker
                        center={favCoords}
                        onMove={(coords) => {
                          setFavCoords(coords);
                        }}
                      />
                    </MapContainer>

                    {/* Blue Tooltip: "Saving this location" matching screenshot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[62px] z-[400] pointer-events-none flex flex-col items-center">
                      <div className="px-4 py-1.5 rounded-full bg-[#1D4ED8] text-white font-bold text-xs shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                        <span>Saving this location</span>
                      </div>
                      <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-[#1D4ED8]" />
                    </div>

                    {/* Green Location Pin with Stem matching screenshot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[6px] z-[400] pointer-events-none flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-[#10B981] border-[3px] border-white shadow-md flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div className="w-0.5 h-2.5 bg-slate-900" />
                    </div>

                    {/* Floating Circular Back Button matching screenshot */}
                    <button
                      onClick={() => setActiveSubModal("favourites")}
                      className="absolute bottom-4 left-4 z-[500] w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:scale-105 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Floating GPS Live Location Re-center button */}
                    <button
                      onClick={detectCurrentLocation}
                      title="Detect Live Current Location"
                      className="absolute bottom-4 right-4 z-[500] px-3.5 py-2 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-800 dark:text-white hover:border-amber-500 hover:scale-105 transition-all text-xs font-bold active:scale-95"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                      <span>{isDetectingLocation ? "Detecting GPS..." : "My Location"}</span>
                    </button>
                  </div>

                  {/* Bottom Half: Details & Tag Selector Bottom Sheet matching screenshot */}
                  <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shadow-lg space-y-3 overflow-y-auto">
                    
                    <div className="space-y-3.5">
                      {/* Header: Add to favourites + Search Pill Button */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          Add to favourites
                        </h3>
                        <button
                          onClick={() => setIsSearchingFav(!isSearchingFav)}
                          className="px-4 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all flex items-center gap-1.5"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-500" />
                          <span>Search</span>
                        </button>
                      </div>

                      {/* Search Bar & Auto-suggestions Dropdown */}
                      {isSearchingFav && (
                        <div className="space-y-2 animate-in fade-in">
                          <input
                            type="text"
                            value={favSearchQuery}
                            onChange={(e) => setFavSearchQuery(e.target.value)}
                            placeholder="Search area, landmark or street in Bhubaneswar..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                            autoFocus
                          />
                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 max-h-36 overflow-y-auto shadow-sm">
                            {sampleFavLocations
                              .filter(loc => !favSearchQuery || loc.name.toLowerCase().includes(favSearchQuery.toLowerCase()) || loc.address.toLowerCase().includes(favSearchQuery.toLowerCase()))
                              .map((loc, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setFavLocationName(loc.name);
                                    setFavLocationAddress(loc.address);
                                    setFavCoords(loc.coords);
                                    setIsSearchingFav(false);
                                    setFavSearchQuery("");
                                  }}
                                  className="w-full p-2.5 text-left hover:bg-amber-50/50 dark:hover:bg-slate-700/50 flex items-start gap-2 text-xs"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{loc.name}</p>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">{loc.address}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Address Card Box matching screenshot */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {favLocationName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {favLocationAddress}
                          </p>
                        </div>
                      </div>

                      {/* Section: SAVE LOCATION AS */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black tracking-wider text-[#1E3A8A] dark:text-blue-400 uppercase">
                          SAVE LOCATION AS
                        </h4>

                        {/* Tag Chips matching screenshot */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { tag: "Home", icon: "🏠" },
                            { tag: "Work", icon: "💼" },
                            { tag: "Gym", icon: "🏋️" },
                            { tag: "College", icon: "🎓" },
                            { tag: "Hostel", icon: "🏢" },
                            { tag: "+ Add New", icon: "" }
                          ].map(item => {
                            const isSelected = favSelectedTag === item.tag;
                            return (
                              <button
                                key={item.tag}
                                type="button"
                                onClick={() => {
                                  if (item.tag === "+ Add New") {
                                    if (favSelectedTag === "+ Add New") {
                                      setFavSelectedTag(null);
                                      setShowCustomTagInput(false);
                                    } else {
                                      setShowCustomTagInput(true);
                                      setFavSelectedTag("+ Add New");
                                    }
                                  } else {
                                    setFavSelectedTag(prev => prev === item.tag ? null : item.tag);
                                    setShowCustomTagInput(false);
                                  }
                                }}
                                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  isSelected
                                    ? 'border-slate-800 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {item.icon && <span>{item.icon}</span>}
                                <span>{item.tag}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Tag Input if '+ Add New' is selected */}
                        {showCustomTagInput && (
                          <div className="pt-1.5">
                            <input
                              type="text"
                              value={customTagInput}
                              onChange={(e) => setCustomTagInput(e.target.value)}
                              placeholder="Enter custom location tag (e.g. Friend's Flat)"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Action Button: Add to favourite */}
                    <div className="pt-2">
                      <button
                        onClick={handleSavePickedFavourite}
                        disabled={!favSelectedTag || (favSelectedTag === "+ Add New" && !customTagInput.trim())}
                        className={`w-full py-3.5 rounded-full font-extrabold text-sm shadow-md transition-all flex items-center justify-center ${
                          !favSelectedTag || (favSelectedTag === "+ Add New" && !customTagInput.trim())
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                            : 'bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 cursor-pointer'
                        }`}
                      >
                        Add to favourite
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* === 11. EXACT RAPIDO / RIDEX SAFETY TOOLKIT SCREEN MATCHING SCREENSHOTS === */}
              {activeSubModal === "safety" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-5 overflow-y-auto">
                  
                  {/* Top Bar with ← Safety toolkit */}
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Safety toolkit
                    </h2>
                  </div>

                  {/* Intro Description matching screenshot */}
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      At RideX, your safety comes first. Here are some measures and provisions to ensure your safety.
                    </p>
                    <button
                      onClick={() => setActiveSubModal("safety_know_more")}
                      className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline inline-block pt-0.5"
                    >
                      Know more
                    </button>
                  </div>

                  {/* Interactive Safety Features Carousel / Slider */}
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-3xl">
                      <div 
                        className="flex transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${activeSafetySlide * 100}%)` }}
                      >
                        
                        {/* Slide 1: Proactive safety checks (Matching Screenshot 1) */}
                        <div className="w-full shrink-0 px-1">
                          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-[#0B1536] via-[#102A6B] to-[#1E3A8A] p-6 relative overflow-hidden shadow-xl flex flex-col justify-between text-white border border-blue-900/50">
                            {/* Background tech mesh & glowing circles */}
                            <div className="absolute -right-8 -top-8 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute right-4 bottom-4 w-32 h-32 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

                            {/* Top row: 24x7 badge & Shields */}
                            <div className="flex items-center justify-between z-10">
                              <div className="px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-400/40 text-blue-300 font-extrabold text-xs tracking-wider flex items-center gap-1.5 shadow-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>24x7 SAFETY</span>
                              </div>
                              <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <ShieldCheck className="w-5 h-5 text-amber-400" />
                              </div>
                            </div>

                            {/* Center Illustration Graphic */}
                            <div className="my-auto text-center z-10 space-y-1">
                              <div className="text-4xl select-none">🛡️ 🎧 📍</div>
                              <h4 className="text-lg font-black tracking-tight text-white drop-shadow-sm">
                                Real-Time Trip Guard
                              </h4>
                              <p className="text-[11px] text-blue-200/90 max-w-xs mx-auto">
                                Live route anomaly detection, unexpected stops monitoring & direct 24x7 SOS emergency safety desk.
                              </p>
                            </div>

                            {/* Bottom Brand matching screenshot */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/10 z-10 text-[11px] font-bold text-amber-300">
                              <span className="flex items-center gap-1">
                                <span className="text-sm">🚖</span> RideX Safety Hub
                              </span>
                              <span className="text-xs bg-amber-400/20 px-2.5 py-0.5 rounded-full text-amber-300 font-mono">Live Active</span>
                            </div>
                          </div>
                          <p className="text-center font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                            Proactive safety checks
                          </p>
                        </div>

                        {/* Slide 2: Share live location (Matching Screenshot 2) */}
                        <div className="w-full shrink-0 px-1">
                          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC] dark:from-slate-800 dark:to-cyan-950 p-6 relative overflow-hidden shadow-xl flex flex-col justify-between text-slate-900 dark:text-white border border-sky-300 dark:border-sky-900/50">
                            {/* Background accents */}
                            <div className="absolute right-2 top-2 w-32 h-32 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />

                            {/* Top row */}
                            <div className="flex items-center justify-between z-10">
                              <div className="px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-sky-400/40 text-sky-700 dark:text-sky-300 font-extrabold text-xs tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Navigation className="w-3.5 h-3.5 text-sky-500 fill-sky-500 animate-pulse" />
                                <span>LIVE TELEMETRY</span>
                              </div>
                              <div className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center border border-sky-200">
                                <MapPin className="w-5 h-5 text-amber-500" />
                              </div>
                            </div>

                            {/* Center Illustration Graphic */}
                            <div className="my-auto text-center z-10 space-y-1">
                              <div className="text-4xl select-none">🛵 🗺️ 📲</div>
                              <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                                1-Tap Trip Link Sharing
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                                Family can track your vehicle moving live on map with estimated arrival time & Captain details.
                              </p>
                            </div>

                            {/* Bottom Brand */}
                            <div className="flex items-center justify-between pt-2 border-t border-sky-300/60 dark:border-white/10 z-10 text-[11px] font-bold text-sky-800 dark:text-sky-300">
                              <span className="flex items-center gap-1">
                                <span className="text-sm">🚖</span> RideX Share
                              </span>
                              <span className="text-xs bg-sky-500/20 px-2.5 py-0.5 rounded-full">Encrypted</span>
                            </div>
                          </div>
                          <p className="text-center font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                            Share live location
                          </p>
                        </div>

                        {/* Slide 3: Add trusted contacts (Matching Screenshot 3) */}
                        <div className="w-full shrink-0 px-1">
                          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-[#FEF08A] via-[#FDE047] to-[#FACC15] dark:from-amber-950 dark:to-yellow-900/60 p-6 relative overflow-hidden shadow-xl flex flex-col justify-between text-slate-950 dark:text-white border border-amber-300 dark:border-amber-700/50">
                            {/* Background accents */}
                            <div className="absolute right-2 top-2 w-32 h-32 bg-amber-300/30 rounded-full blur-xl pointer-events-none" />

                            {/* Top row */}
                            <div className="flex items-center justify-between z-10">
                              <div className="px-3 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-xs tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Phone className="w-3.5 h-3.5 text-amber-400" />
                                <span>SOS SYNC</span>
                              </div>
                              <div className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center border border-amber-300">
                                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                              </div>
                            </div>

                            {/* Center Illustration Graphic */}
                            <div className="my-auto text-center z-10 space-y-1">
                              <div className="text-4xl select-none">👨‍👩‍👧‍👦 🛡️ 📞</div>
                              <h4 className="text-lg font-black tracking-tight text-slate-950 dark:text-white drop-shadow-sm">
                                Instant Family Alerts
                              </h4>
                              <p className="text-[11px] text-slate-800 dark:text-slate-200 max-w-xs mx-auto">
                                Automatically notify trusted emergency contacts in case of SOS triggers or sudden route deviations.
                              </p>
                            </div>

                            {/* Bottom Brand */}
                            <div className="flex items-center justify-between pt-2 border-t border-amber-400/60 dark:border-white/10 z-10 text-[11px] font-bold text-slate-900 dark:text-amber-300">
                              <span className="flex items-center gap-1">
                                <span className="text-sm">🚖</span> RideX SOS Network
                              </span>
                              <span className="text-xs bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-full font-mono">Automated</span>
                            </div>
                          </div>
                          <p className="text-center font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                            Add trusted contacts
                          </p>
                        </div>

                      </div>

                      {/* Carousel Arrow Controls */}
                      <button
                        onClick={() => setActiveSafetySlide((prev) => (prev > 0 ? prev - 1 : 2))}
                        className="absolute left-3 top-[38%] -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-md hover:bg-white text-slate-800 dark:text-white transition-all backdrop-blur-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveSafetySlide((prev) => (prev < 2 ? prev + 1 : 0))}
                        className="absolute right-3 top-[38%] -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-md hover:bg-white text-slate-800 dark:text-white transition-all backdrop-blur-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pagination Bar Indicator matching screenshot */}
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSafetySlide(idx)}
                          className={`h-1 transition-all rounded-full ${
                            activeSafetySlide === idx
                              ? 'w-6 bg-slate-800 dark:bg-white'
                              : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Section: Settings matching screenshot */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white px-1">
                      Settings
                    </h4>

                    {/* New trusted contacts Card */}
                    <button
                      onClick={() => setShowTrustedContactsModal(true)}
                      className="w-full p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/60 transition-all flex items-center justify-between text-left group"
                    >
                      <div className="space-y-0.5 pr-3">
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                          New trusted contacts
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          share ride trip details with your loved ones in a single tap
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </div>

                </div>
              )}

              {/* === 12. EXACT SAFETY KNOW MORE / SAFETY TOOLKIT SCREEN MATCHING 4 SCREENSHOTS === */}
              {activeSubModal === "safety_know_more" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-5 overflow-y-auto bg-white dark:bg-slate-900">
                  
                  {/* Top Bar with ← Safety toolkit */}
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <button
                      onClick={() => setActiveSubModal("safety")}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Safety toolkit
                    </h2>
                  </div>

                  {/* Hero Graphic matching Screenshot 1 */}
                  <div className="w-full rounded-3xl bg-gradient-to-br from-blue-50/80 via-sky-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-blue-950/40 p-6 relative overflow-hidden border border-blue-100/80 dark:border-slate-800 flex items-center justify-center min-h-[170px] shadow-sm">
                    {/* Background Map Grid & Roads */}
                    <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Decorative floating badges */}
                    <div className="absolute top-3 left-6 text-2xl animate-bounce select-none">🔒</div>
                    <div className="absolute bottom-3 left-10 text-2xl select-none">🚖</div>
                    <div className="absolute top-4 right-8 text-2xl select-none">👍</div>
                    <div className="absolute bottom-4 right-6 text-xl select-none">📍</div>

                    {/* Central Protected Smartphone Illustration */}
                    <div className="relative z-10 w-28 h-40 bg-white dark:bg-slate-800 rounded-2xl border-4 border-blue-500 shadow-2xl flex flex-col items-center justify-center p-2">
                      <div className="w-8 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mb-auto" />
                      <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-400 flex items-center justify-center shadow-inner my-auto">
                        <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 mt-auto" />
                    </div>
                  </div>

                  {/* Header Title & Subtitle */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#1E3A8A] dark:text-blue-400">
                      Safety all the way
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      At RideX, your safety comes first. Here are some measures and provisions to ensure your safety, every time.
                    </p>
                  </div>

                  {/* CARD 1: What we offer? matching Screenshots 1 & 2 */}
                  <div className="rounded-3xl bg-[#F4F9FF] dark:bg-slate-800/80 border border-blue-100/90 dark:border-slate-700/80 p-5 space-y-4 shadow-sm">
                    <h4 className="text-base font-extrabold text-[#1E3A8A] dark:text-blue-300">
                      What we offer?
                    </h4>

                    {/* Item 1: 24X7 Proactive Safety Checks */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg shrink-0">
                          🔀
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          24X7 Proactive Safety Checks
                        </h5>
                      </div>
                      <div className="pl-13 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">We send notifications and follow up calls in case of:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                          <li>Drop at different location</li>
                          <li>Unplanned stops / Vehicle not moving</li>
                          <li>Route deviations during the ride</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/80 dark:border-slate-700/60" />

                    {/* Item 2: SOS button */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-rose-500 font-black text-xs shrink-0 shadow-sm">
                          SOS
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          SOS button
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        A button that calls our Central Emergency Response Team who then guide you to onground help.
                      </p>
                    </div>

                    <div className="border-t border-slate-200/80 dark:border-slate-700/60" />

                    {/* Item 3: Late night ride completion check */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 text-lg shrink-0">
                          🌙
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Late night ride completion check
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        We call you post ride completion for feedback, each time you ride between 10pm - 5am
                      </p>
                    </div>

                    <div className="border-t border-slate-200/80 dark:border-slate-700/60" />

                    {/* Item 4: Trip insurance */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 text-lg shrink-0">
                          📄
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Trip insurance
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        From start to finish, all trips are insured by leading insurance players.
                      </p>
                    </div>

                  </div>

                  {/* Italic Disclaimer Note matching Screenshot 2 */}
                  <div className="px-1 py-1">
                    <p className="text-xs font-black italic text-[#1E3A8A] dark:text-blue-300 leading-relaxed">
                      Please note, all these safety features only work in case of an online ride through our app. Do not accept offline rides.
                    </p>
                  </div>

                  {/* SECTION 2: THINGS YOU CAN DO matching Screenshots 2, 3, 4 */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-black tracking-wider text-[#1E3A8A] dark:text-blue-400 uppercase">
                      THINGS YOU CAN DO
                    </h4>

                    {/* 1. Helmet always */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 text-lg shrink-0">
                          🪖
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Helmet always
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        While riding a Bike-Taxi, always ask for a helmet. In case you don’t receive one, inform us via feedback.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* 2. Live location sharing */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg shrink-0">
                          📍
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Live location sharing
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        For friends & family to track the live status of your ride.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* 3. Your ride. Your rules */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 text-lg shrink-0">
                          👩‍🦰
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Your ride. Your rules
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        You have every right to ask the Captain to drive as per your comfort, within traffic rules.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* 4. Add trusted contacts */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 text-lg shrink-0">
                          👤
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Add trusted contacts
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Make sure to add contacts of your loved ones as trusted contacts. This will help you reach out to them easily.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* 5. Don’t share personal information */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 text-lg shrink-0">
                          🔒
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Don’t share personal information
                        </h5>
                      </div>
                      <div className="pl-13 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Do not share your contact details with the Captain. Do not share location via Whatsapp or any third party app.</li>
                          <li>Use communication methods available on the app only.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* 6. Always share feedback */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 text-lg shrink-0">
                          💬
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Always share feedback
                        </h5>
                      </div>
                      <p className="pl-13 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        After every ride, help us know about your experiences so we can make our service safer and more pleasant.
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* === 13. EXACT RAPIDO / RIDEX COINS WALLET & REWARDS SCREEN === */}
              {activeSubModal === "ridex_coins" && (
                <div className="flex-1 flex flex-col p-4 sm:p-5 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900">
                  
                  {/* Top Bar with ← RideX Coins */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      RideX Coins
                    </h2>
                  </div>

                  {/* Golden Glowing Coin Balance Card */}
                  <div className="rounded-3xl bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#92400E] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
                    {/* Background gold coin circles */}
                    <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute right-4 top-4 text-4xl opacity-20 pointer-events-none select-none">🪙</div>

                    <div className="flex items-center justify-between z-10">
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wider flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-200" />
                        <span>REWARDS BALANCE</span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-200">
                        1 Coin = ₹1.00
                      </span>
                    </div>

                    <div className="z-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">
                          {ridexCoins}
                        </span>
                        <span className="text-xl font-bold text-amber-200">Coins</span>
                      </div>
                      <p className="text-xs text-amber-100/90 font-medium mt-1">
                        ≈ ₹{ridexCoins}.00 redeemable on your upcoming rides
                      </p>
                    </div>

                    {/* Daily Claim Button */}
                    <div className="pt-2 z-10">
                      <button
                        onClick={handleClaimDailyCoins}
                        disabled={dailyClaimed}
                        className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                          dailyClaimed
                            ? 'bg-amber-900/60 text-amber-200/80 cursor-not-allowed border border-amber-600/40'
                            : 'bg-white text-slate-950 hover:bg-amber-50 active:scale-[0.99] border border-amber-200'
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 ${dailyClaimed ? 'text-amber-300' : 'text-amber-500 animate-spin'}`} />
                        <span>{dailyClaimed ? "✓ Daily Coins Claimed for Today" : "🎁 Claim +20 Free Daily Bonus Coins"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Segmented Tabs Navigation */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setCoinsActiveTab("vouchers")}
                      className={`py-2 rounded-xl transition-all ${
                        coinsActiveTab === "vouchers"
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      🎟️ Vouchers
                    </button>
                    <button
                      onClick={() => setCoinsActiveTab("earn")}
                      className={`py-2 rounded-xl transition-all ${
                        coinsActiveTab === "earn"
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      ⚡ How to Earn
                    </button>
                    <button
                      onClick={() => setCoinsActiveTab("history")}
                      className={`py-2 rounded-xl transition-all ${
                        coinsActiveTab === "history"
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      📜 History
                    </button>
                  </div>

                  {/* TAB 1: REDEEM VOUCHERS */}
                  {coinsActiveTab === "vouchers" && (
                    <div className="space-y-3 pt-1">
                      {[
                        { title: "₹50 Off Auto Ride", desc: "Instant discount applied on next Auto or Bike booking", cost: 50, icon: "🛵", tag: "POPULAR" },
                        { title: "₹100 Off Prime Cab", desc: "Valid on all Prime Sedan & SUV airport / city trips", cost: 100, icon: "🚕", tag: "BEST VALUE" },
                        { title: "100% Free Toll Pass", desc: "Full toll charge waiver on highway routes", cost: 75, icon: "🛣️", tag: "PASS" },
                        { title: "Priority Captain Dispatch", desc: "Guaranteed fastest driver assignment during peak hours", cost: 40, icon: "⚡", tag: "SPEED" },
                        { title: "₹200 Airport Transfer", desc: "Special flat discount on BBI Airport rides", cost: 180, icon: "✈️", tag: "AIRPORT" }
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between gap-3 hover:border-amber-400 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                  {item.title}
                                </h4>
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wide">
                                  {item.tag}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {item.desc}
                              </p>
                              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5" />
                                <span>{item.cost} Coins</span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRedeemVoucher(item.cost, item.title)}
                            disabled={ridexCoins < item.cost}
                            className={`px-4 py-2 rounded-full font-extrabold text-xs shadow-sm transition-all shrink-0 ${
                              ridexCoins >= item.cost
                                ? 'bg-[#FFC727] hover:bg-amber-400 text-slate-950 active:scale-95'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Redeem
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: HOW TO EARN */}
                  {coinsActiveTab === "earn" && (
                    <div className="space-y-3 pt-1">
                      {[
                        { title: "Complete Any Ride", reward: "+5% Coins Cashback", desc: "Earn 5 coins for every ₹100 spent on completed rides", icon: "🛵" },
                        { title: "Refer Friends & Family", reward: "+100 Coins / Friend", desc: "Receive 100 coins directly once your friend completes their first ride", icon: "🎁" },
                        { title: "Rate & Review Captain", reward: "+15 Coins / Feedback", desc: "Submit honest 5-star trip reviews to boost captain ratings", icon: "⭐" },
                        { title: "Daily App Check-in", reward: "+20 Coins / Day", desc: "Tap the daily lucky bonus scratch card to collect free coins", icon: "⚡" }
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-start gap-3.5"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {item.title}
                              </h4>
                              <span className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                                {item.reward}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 3: COINS HISTORY / PASSBOOK */}
                  {coinsActiveTab === "history" && (
                    <div className="space-y-2 pt-1">
                      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                        {coinTransactions.map((tx) => (
                          <div key={tx.id} className="p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                tx.type === "credit"
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}>
                                {tx.type === "credit" ? "+" : "-"}
                              </div>
                              <div>
                                <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                                  {tx.title}
                                </h5>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {tx.date}
                                </p>
                              </div>
                            </div>
                            <span className={`font-mono font-extrabold text-xs ${
                              tx.type === "credit"
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {tx.coins} Coins
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* === 14. EXACT RAPIDO / RIDEX CLAIMS SCREEN (Matching Screenshot 1) === */}
              {activeSubModal === "claims" && (
                <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-900 space-y-4">
                  
                  <div className="space-y-4">
                    {/* Top Bar with ← Claims and Help pill button */}
                    <div className="flex items-center justify-between pb-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveSubModal(null)}
                          className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                          Claims
                        </h2>
                      </div>

                      {/* (i) Help button */}
                      <button
                        onClick={() => {
                          setSelectedHelpTopic(null);
                          setActiveSubModal("help");
                        }}
                        className="px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold">i</span>
                        <span>Help</span>
                      </button>
                    </div>

                    {/* Horizontal Tabs: Bike | Auto | Cab */}
                    <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 text-sm font-bold">
                      {[
                        { id: "bike", label: "Bike", icon: "🛵" },
                        { id: "auto", label: "Auto", icon: "🛺" },
                        { id: "cab", label: "Cab", icon: "🚗" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setClaimsVehicleTab(tab.id)}
                          className={`py-2.5 flex items-center justify-center gap-2 transition-all relative ${
                            claimsVehicleTab === tab.id
                              ? 'text-slate-950 dark:text-white font-extrabold'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <span className="text-base">{tab.icon}</span>
                          <span>{tab.label}</span>
                          {claimsVehicleTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950 dark:bg-amber-400 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* === 1. BIKE CLAIMS (Full Policy Coverage View) === */}
                    {claimsVehicleTab === "bike" && (
                      <>
                        {/* SECTION 1: POLICY COVERAGE */}
                        <div className="space-y-2 pt-1">
                          <h4 className="text-xs font-black tracking-wider text-[#1E3A8A] dark:text-blue-400 px-1 uppercase">
                            POLICY COVERAGE
                          </h4>

                          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-sm p-4 space-y-4">
                            
                            {/* 1. Personal Accident/Accidental Death */}
                            <div className="flex items-start gap-3.5">
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                                  Personal Accident/Accidental Death
                                </h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  Up to ₹5,00,000
                                </p>
                              </div>
                            </div>

                            {/* 2. Medical Expense for Hospitalization */}
                            <div className="flex items-start gap-3.5">
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                                <ClipboardList className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                                  Medical Expense for Hospitalization
                                </h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  Up to ₹1,00,000
                                </p>
                              </div>
                            </div>

                            {/* 3. OPD Treatment */}
                            <div className="flex items-start gap-3.5">
                              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                                  OPD Treatment
                                </h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  Up to ₹3000
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* SECTION 2: LEGAL */}
                        <div className="space-y-2 pt-1">
                          <h4 className="text-xs font-black tracking-wider text-[#1E3A8A] dark:text-blue-400 px-1 uppercase">
                            LEGAL
                          </h4>

                          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-sm p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-700/80">
                            
                            {/* Claim Procedure */}
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                Claim Procedure
                              </h5>
                              <button
                                onClick={() => setShowClaimProcedureModal(true)}
                                className="text-sm font-extrabold text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                View
                              </button>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-center justify-between pt-3">
                              <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                Terms and Conditions
                              </h5>
                              <button
                                onClick={() => setShowClaimTermsModal(true)}
                                className="text-sm font-extrabold text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                View
                              </button>
                            </div>

                          </div>
                        </div>

                        {/* Disclaimer note */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                          Please provide your correct email-id, date of birth and phone number to avoid cancellations of your insurance claim.
                        </p>
                      </>
                    )}

                    {/* === 2. AUTO & CAB CLAIMS (Exact Match with Screenshot media_1788326737914.jpg) === */}
                    {(claimsVehicleTab === "auto" || claimsVehicleTab === "cab") && (
                      <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-6 px-4">
                        
                        {/* Golden Document + Sad Face Chat Bubble Graphic */}
                        <div className="w-36 h-36 relative flex items-center justify-center mx-auto">
                          {/* Golden Document */}
                          <svg className="w-28 h-32 drop-shadow-sm" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 10C15 6.68629 17.6863 4 21 4H62L85 27V110C85 113.314 82.3137 116 79 116H21C17.6863 116 15 113.314 15 110V10Z" fill="#FDE68A" />
                            <path d="M18 13C18 10.2386 20.2386 8 23 8H60L81 29V107C81 109.761 78.7614 112 76 112H23C20.2386 112 18 109.761 18 107V13Z" fill="#FEF3C7" />
                            <path d="M60 4V23C60 26.3137 62.6863 29 66 29H85L60 4Z" fill="#FCD34D" opacity="0.8" />
                            {/* Floating sparkles */}
                            <circle cx="8" cy="42" r="2.5" fill="#FDE68A" />
                            <circle cx="88" cy="38" r="2" fill="#FDE68A" />
                            <circle cx="12" cy="78" r="1.5" fill="#FDE68A" />
                          </svg>

                          {/* Pink / Coral Sad Chat Bubble Overlay */}
                          <div className="absolute right-2 bottom-3 w-16 h-16 rounded-full bg-[#FDA4AF] border-2 border-white shadow-md flex items-center justify-center">
                            {/* Sad face */}
                            <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
                              {/* Eyes */}
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#9F1239]" />
                                <div className="w-2 h-2 rounded-full bg-[#9F1239]" />
                              </div>
                              {/* Sad curved mouth */}
                              <div className="w-5 h-2.5 border-t-2 border-[#9F1239] rounded-t-full mt-0.5" />
                            </div>
                            {/* Chat bubble tail */}
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#FDA4AF] rotate-45" />
                            {/* Shock/worry rays on top right */}
                            <div className="absolute -top-1 -right-0.5 text-[#FDA4AF] text-xs font-black select-none pointer-events-none">彡</div>
                          </div>
                        </div>

                        {/* Centered Email Notice Text */}
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed max-w-xs mx-auto">
                          For RideX {claimsVehicleTab === "auto" ? "Auto" : "Cab"} accidental claims or any questions regarding it, please write a mail to{" "}
                          <span className="text-slate-900 dark:text-white font-extrabold underline">
                            shoutout@ridex.bike
                          </span>
                        </p>

                      </div>
                    )}

                  </div>

                  {/* Bottom Area: Conditional Buttons */}
                  <div className="space-y-3 pt-2">
                    
                    {claimsVehicleTab === "bike" ? (
                      <>
                        {/* Powered by Acko */}
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-300 inline-block" />
                          <span>Powered by Acko</span>
                        </div>

                        {/* Claim Insurance Yellow Button */}
                        <button
                          onClick={() => setShowNewClaimModal(true)}
                          className="w-full py-4 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          Claim Insurance
                        </button>
                      </>
                    ) : (
                      /* Email us Yellow Button for Auto and Cab */
                      <button
                        onClick={() => {
                          window.location.href = `mailto:shoutout@ridex.bike?subject=RideX%20${claimsVehicleTab === 'auto' ? 'Auto' : 'Cab'}%20Accidental%20Claim%20Query`;
                          showToast("Opening Email App ✉️", "Drafting claim inquiry to shoutout@ridex.bike");
                        }}
                        className="w-full py-4 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        Email us
                      </button>
                    )}

                  </div>

                </div>
              )}

              {/* === 15. OTHER SUB-MODALS (Refer, Notifications, Rating, User Details) === */}
              {activeSubModal && activeSubModal !== "help" && activeSubModal !== "payment" && activeSubModal !== "wallet" && activeSubModal !== "passbook" && activeSubModal !== "payment_faqs" && activeSubModal !== "add_money" && activeSubModal !== "ridex_wallet" && activeSubModal !== "settings" && activeSubModal !== "about" && activeSubModal !== "favourites" && activeSubModal !== "fav_map_picker" && activeSubModal !== "safety" && activeSubModal !== "safety_know_more" && activeSubModal !== "ridex_coins" && activeSubModal !== "claims" && (
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold capitalize">
                      {activeSubModal.replace('_', ' ')}
                    </h3>
                  </div>

                  {/* 3. Refer and Earn */}
                  {activeSubModal === "refer" && (
                    <div className="py-6 text-center space-y-4 flex-1">
                      <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 text-3xl flex items-center justify-center mx-auto">
                        🎁
                      </div>
                      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Invite Friends, Earn ₹50</h4>
                      <p className="text-xs text-slate-500">
                        Share your referral code. When your friend takes their first ride on FleetCorp, both of you receive ₹50 ride wallet credit!
                      </p>
                      
                      <div className="p-3.5 rounded-2xl border border-dashed border-amber-500 bg-amber-500/5 flex items-center justify-between font-mono font-bold text-amber-600 dark:text-amber-400">
                        <span>SMRUTI50</span>
                        <button
                          onClick={handleCopyCode}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied" : "Copy Code"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Notifications */}
                  {activeSubModal === "notifications" && (
                    <div className="py-4 space-y-3 flex-1 text-xs overflow-y-auto max-h-[70vh]">
                      {profileNotifications.length > 0 ? (
                        profileNotifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-l-4 shadow-sm ${
                              n.type === 'payout' 
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                                : n.type === 'payout_rejected'
                                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                                : 'border-amber-500'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs">{n.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{n.time || 'Recent'}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed">{n.desc}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-slate-400 text-xs">
                          No new notifications at this time.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. Rating Details */}
                  {activeSubModal === "rating" && (
                    <div className="py-6 text-center space-y-4 flex-1">
                      <div className="text-4xl font-black text-amber-500 flex items-center justify-center gap-2">
                        <Star className="w-8 h-8 fill-amber-500" /> 4.92
                      </div>
                      <p className="text-xs text-slate-500">
                        Based on 148 rides reviewed by verified FleetCorp captains.
                      </p>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left text-xs space-y-2">
                        <p className="font-bold">⭐ Top Rider Compliments:</p>
                        <p className="text-slate-500">✓ On time at pickup spot (100%)</p>
                        <p className="text-slate-500">✓ Polite & courteous interaction</p>
                        <p className="text-slate-500">✓ Seamless payment & quick boarding</p>
                      </div>
                    </div>
                  )}

                  {/* 8. User Details */}
                  {activeSubModal === "user_details" && (
                    <div className="py-4 space-y-3 flex-1 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{userName}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Registered Mobile</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">{userPhone}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{userEmail}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Account Type</p>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold uppercase">
                          {userRole}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Back to Profile Menu
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. DELETE ACCOUNT REASON BOTTOM SHEET MODAL (Matching Screenshot) */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[100020] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col space-y-4"
              >
                {/* Floating Top Right Close Button matching screenshot */}
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute -top-12 right-4 sm:right-0 p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Top Drag Handle Bar */}
                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

                {/* Title */}
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Delete Account Reason
                </h3>

                {/* Options List matching screenshot with RideX branding */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto max-h-[50vh] pr-1">
                  {[
                    "RideX unserviceable in my area",
                    "Have my own vehicle now",
                    "No exciting offers",
                    "Poor App experience",
                    "Moved to a different Ride booking app",
                    "Change of phone number"
                  ].map((reason) => (
                    <label
                      key={reason}
                      onClick={() => {
                        setDeleteReason(reason);
                        setCustomDeleteReason("");
                      }}
                      className="py-3.5 flex items-center justify-between cursor-pointer group select-none"
                    >
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors pr-3">
                        {reason}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                        deleteReason === reason 
                          ? 'border-slate-800 dark:border-white bg-transparent' 
                          : 'border-slate-400 dark:border-slate-600 group-hover:border-slate-600'
                      }`}>
                        {deleteReason === reason && (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Other Reason Input */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={customDeleteReason}
                    onChange={(e) => {
                      setCustomDeleteReason(e.target.value);
                      if (e.target.value) {
                        setDeleteReason("other");
                      }
                    }}
                    placeholder="other reason"
                    className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Submit Yellow Button matching screenshot */}
                <div className="pt-2">
                  <button
                    onClick={handleDeleteSubmit}
                    disabled={!deleteReason && !customDeleteReason}
                    className="w-full py-3.5 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-base flex items-center justify-center shadow-md transition-all"
                  >
                    Submit
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. PRO-LEVEL SUCCESS POPUP FOR ACCOUNT DELETION */}
        <AnimatePresence>
          {deleteSuccessPopup && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 25 }}
                transition={{ type: "spring", damping: 25, stiffness: 320 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 relative"
              >
                {/* Glowing Top Icon */}
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-500/5 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-amber-500" />
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Request Registered
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                    Your account deletion request for <span className="font-bold text-slate-800 dark:text-slate-200">+91 {userPhone}</span> has been securely submitted.
                  </p>
                </div>

                {/* Professional Info Details Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/60 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Request ID</span>
                    <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                      #DEL-{Math.floor(10000 + Math.random() * 90000)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Status</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Pending Review
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Processing Window</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">7 Business Days</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Our data security team will review your account, clear pending dues if any, and permanently purge your ride logs.
                    </p>
                  </div>
                </div>

                {/* Pro Button */}
                <button
                  onClick={() => setDeleteSuccessPopup(false)}
                  className="w-full py-3.5 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold text-sm shadow-md transition-all"
                >
                  Okay, Understood
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. TRUSTED CONTACTS MANAGEMENT MODAL */}
        <AnimatePresence>
          {showTrustedContactsModal && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Trusted Contacts
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Auto-share live tracking & SOS alerts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTrustedContactsModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contacts List */}
                <div className="space-y-2.5 overflow-y-auto max-h-48 pr-1">
                  {trustedContacts.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                      No trusted contacts added yet. Add family or friends below.
                    </div>
                  ) : (
                    trustedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center">
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                {contact.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                                {contact.relation}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {contact.phone}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTrustedContacts((prev) => prev.filter((c) => c.id !== contact.id));
                            showToast("Contact Removed", `${contact.name} removed from trusted list.`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Contact Form */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    + Add New Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="Name (e.g. Papa)"
                      className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                    <select
                      value={newContactRelation}
                      onChange={(e) => setNewContactRelation(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Family">Family</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                    </select>
                  </div>
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Phone Number (e.g. +91 9437088776)"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    onClick={handleAddTrustedContact}
                    disabled={!newContactName.trim() || !newContactPhone.trim()}
                    className="w-full py-3 rounded-full bg-[#FFC727] hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Save Trusted Contact
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. SAFETY 'KNOW MORE' BOTTOM SHEET MODAL */}
        <AnimatePresence>
          {showSafetyKnowMore && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        RideX Safety Standards
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Our 5-Pillar Safety Guarantee
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSafetyKnowMore(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Safety Pillars List */}
                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                  {[
                    {
                      icon: "🛡️",
                      title: "24x7 Real-Time Trip Guard",
                      desc: "Automated telemetry continuously monitors live trip route, detecting unusual route detours, sudden stops, or off-grid signals."
                    },
                    {
                      icon: "🪖",
                      title: "Certified Captains & Sanitized Helmets",
                      desc: "Every captain undergoes thorough background verification, criminal record checks, and mandatory defensive driving training."
                    },
                    {
                      icon: "🚨",
                      title: "1-Tap Emergency SOS Response",
                      desc: "Instant live bridge connecting your location to Odisha Police Control (112) and RideX Emergency Safety Command Center."
                    },
                    {
                      icon: "🔒",
                      title: "Number Masking & Data Privacy",
                      desc: "Your phone number is strictly masked during in-app calls and chats to ensure 100% privacy and zero unsolicited contact."
                    },
                    {
                      icon: "🏥",
                      title: "Ride Insurance Cover up to ₹5,00,000",
                      desc: "Every trip on RideX is automatically covered with accidental medical and emergency hospitalization insurance."
                    }
                  ].map((pillar, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3"
                    >
                      <span className="text-2xl shrink-0">{pillar.icon}</span>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {pillar.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {pillar.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowSafetyKnowMore(false)}
                  className="w-full py-3.5 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold text-sm shadow-md transition-all"
                >
                  Understood & Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. FILE NEW CLAIM BOTTOM SHEET MODAL */}
        <AnimatePresence>
          {showNewClaimModal && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        File Insurance / Trip Claim
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Coverage backed by Acko & ICICI Lombard
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewClaimModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                  
                  {/* Claim Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Claim Category
                    </label>
                    <select
                      value={newClaimType}
                      onChange={(e) => setNewClaimType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Accidental Medical Expense">🏥 Accidental Medical Expense (Hospitalization)</option>
                      <option value="Lost & Found Item in Cab">🎒 Lost & Found Item / Property Left Behind</option>
                      <option value="Excess Fare / Route Deviation Dispute">💸 Excess Fare / Route Deviation Overcharge</option>
                      <option value="Luggage & Belongings Damage">🧳 Luggage / Personal Item Damage</option>
                      <option value="Emergency Ambulance Reimbursement">🚑 Emergency Ambulance Fee Waiver</option>
                    </select>
                  </div>

                  {/* Ride / Trip Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Associated Trip
                    </label>
                    <select
                      value={newClaimRideId}
                      onChange={(e) => setNewClaimRideId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="BK-9281 (Recent Khandagiri ➔ Master Canteen)">BK-9281 • Khandagiri ➔ Master Canteen (Today)</option>
                      <option value="BK-8492 (Master Canteen ➔ Patia)">BK-8492 • Master Canteen ➔ Patia (28 Aug)</option>
                      <option value="BK-7102 (Bhubaneswar Airport ➔ KIIT)">BK-7102 • BBI Airport ➔ KIIT Campus (14 Jul)</option>
                    </select>
                  </div>

                  {/* Claim Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Claim Amount (₹) <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="number"
                      value={newClaimAmount}
                      onChange={(e) => setNewClaimAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Incident Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Incident Details / What happened?
                    </label>
                    <textarea
                      rows={3}
                      value={newClaimDesc}
                      onChange={(e) => setNewClaimDesc(e.target.value)}
                      placeholder="Describe what occurred, medical treatment received, or item lost..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Document Upload Hint */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-dashed border-emerald-300 dark:border-emerald-800 text-center text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                    <p className="font-bold">📄 Attach Hospital Bills / Photos (Optional)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Our claim officer will request original receipts during verification.</p>
                  </div>

                </div>

                {/* Submit Action */}
                <button
                  onClick={handleFileNewClaim}
                  disabled={!newClaimDesc.trim()}
                  className="w-full py-3.5 rounded-full bg-[#10B981] hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Submit Claim for Assessment
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 6. CLAIM PROCEDURE MODAL */}
        <AnimatePresence>
          {showClaimProcedureModal && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Claim Procedure
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowClaimProcedureModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {[
                    {
                      step: "1",
                      title: "Intimate the Claim within 24 Hours",
                      desc: "Click on 'Claim Insurance' in the RideX app or call the Acko Claims Desk at 1800-266-2256 immediately after the incident."
                    },
                    {
                      step: "2",
                      title: "Document Collection & Submission",
                      desc: "Provide original medical bills, discharge summary, FIR copy (in case of major personal accident), and doctor prescription."
                    },
                    {
                      step: "3",
                      title: "Acko Surveyor Review & Verification",
                      desc: "Acko Insurance desk validates the trip telemetry and verifies the submitted bills within 48-72 business hours."
                    },
                    {
                      step: "4",
                      title: "Direct Bank Transfer Settlement",
                      desc: "Approved claim reimbursement is credited directly to your registered bank account or UPI ID."
                    }
                  ].map((s, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{s.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowClaimProcedureModal(false)}
                  className="w-full py-3.5 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs shadow-md transition-all"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 7. CLAIM TERMS AND CONDITIONS MODAL */}
        <AnimatePresence>
          {showClaimTermsModal && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Terms & Conditions
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowClaimTermsModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <ul className="list-disc list-inside space-y-2 pl-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li>Insurance coverage is active strictly during an in-progress ride booked on the RideX platform.</li>
                    <li>Trips taken off-platform or paid directly to Captain outside the app are NOT covered under any circumstances.</li>
                    <li>Hospitalization expenses are reimbursed up to ₹1,00,000 for inpatient treatments lasting more than 24 hours.</li>
                    <li>OPD treatment is capped at ₹3,000 per incident against valid GST prescription and diagnostic bills.</li>
                    <li>All claims are underwritten, managed and settled exclusively by Acko General Insurance Limited.</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowClaimTermsModal(false)}
                  className="w-full py-3.5 rounded-full bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs shadow-md transition-all"
                >
                  I Understand & Agree
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 8. INVOICE SENT TO GMAIL CONFIRMATION MODAL */}
        <AnimatePresence>
          {invoiceSentSuccess && (
            <div className="fixed inset-0 z-[100030] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-3xl shadow-lg animate-bounce">
                  📧
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3" /> PDF Invoice Dispatched
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    Receipt Sent to Registered Gmail!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Official GST Tax Invoice PDF for Trip <b>#{invoiceSentSuccess.tripId}</b> has been delivered to:
                  </p>
                  <p className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 py-1.5 px-3 rounded-xl inline-block mt-1 border border-amber-500/20">
                    {invoiceSentSuccess.email}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <span>Attached Document:</span>
                    <b className="font-mono text-slate-800 dark:text-slate-200">RideX-Tax-Invoice-{invoiceSentSuccess.tripId}.pdf</b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Amount:</span>
                    <b className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">₹{invoiceSentSuccess.fare}.00 (Paid)</b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Device Download:</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved to Downloads
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setInvoiceSentSuccess(null)}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                >
                  Got it / Open Gmail ➔
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* IN-APP PRO TOAST NOTIFICATIONS */}
        <AnimatePresence>
          {proToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 left-4 right-4 z-[100040] p-4 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 backdrop-blur-md shadow-2xl border border-white/10 dark:border-slate-800 flex items-start gap-3"
            >
              <Sparkles className="w-5 h-5 text-amber-400 dark:text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-extrabold text-sm text-amber-400 dark:text-amber-600">{proToast.title}</p>
                <p className="text-slate-300 dark:text-slate-600 mt-0.5">{proToast.message}</p>
              </div>
              <button 
                onClick={() => setProToast(null)}
                className="text-slate-400 hover:text-white dark:hover:text-slate-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
