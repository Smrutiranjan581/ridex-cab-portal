import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Car, Lock, Mail, User, Phone, Building, ArrowRight, ShieldCheck, CreditCard, 
  FileCheck, MapPin, Camera, Upload, X, Check, Calendar, Users, FileText, Landmark, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function RegisterPage() {
  const [role, setRole] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'captain') return 'captain';
      return 'rider';
    } catch (e) {
      return 'rider';
    }
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  
  // 1. Captain Personal Information fields
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  // 2. Captain Vehicle Details fields
  const [vehicleCategory, setVehicleCategory] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');

  // 3. Captain Registration Submission Modal state
  const [captainSubmittedModal, setCaptainSubmittedModal] = useState(null);

  // 3. Captain Driver KYC & Bank Payout Details
  const [licenseNumber, setLicenseNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [payoutUpi, setPayoutUpi] = useState('');

  // 4. Legal acknowledgments
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (val) => {
    setVehicleCategory(val);
    if (val === 'bike') setSeatingCapacity('1');
    else if (val === 'auto') setSeatingCapacity('3');
    else if (val === 'mini' || val === 'sedan') setSeatingCapacity('4');
    else if (val === 'suv') setSeatingCapacity('6');
    else setSeatingCapacity('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'rider') {
      if (!gender) {
        setError('Please select your Gender');
        return;
      }
      if (!dob) {
        setError('Please select your Date of Birth');
        return;
      }
    }

    if (role === 'captain') {
      if (!gender) {
        setError('Please select your Gender');
        return;
      }
      if (!dob) {
        setError('Please select your Date of Birth');
        return;
      }
      if (!city) {
        setError('Please select your Operating City');
        return;
      }
      if (!vehicleCategory || !vehicleModel || !numberPlate || !licenseNumber) {
        setError('Please fill in required vehicle details and driving license number');
        return;
      }
      if (!seatingCapacity) {
        setError('Please select Seating Capacity');
        return;
      }
      if (!agreeTerms || !agreePrivacy) {
        setError('Please agree to both the Terms & Conditions and Privacy Policy to register as a Captain');
        return;
      }
    }

    setLoading(true);

    const defaultAvatar = role === 'captain' 
      ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

    const formData = {
      name,
      email,
      phone,
      password,
      role: role === 'captain' ? 'captain' : 'rider',
      city: city || 'Bhubaneswar',
      company: role === 'rider' ? 'Individual Rider' : 'RideX Captain Network',
      avatar: photo || defaultAvatar,
      dob: dob || '',
      gender: gender || 'Male',
      address: address || '',
      pincode: pincode || '',
      emergencyContact: emergencyContact || ''
    };

    if (role === 'captain') {
      formData.vehicleDetails = {
        model: vehicleModel,
        numberPlate: numberPlate.toUpperCase(),
        category: vehicleCategory || 'bike',
        capacity: seatingCapacity ? Number(seatingCapacity) : (vehicleCategory === 'suv' ? 6 : vehicleCategory === 'auto' ? 3 : vehicleCategory === 'bike' ? 1 : 4)
      };
      formData.licenseNumber = licenseNumber.toUpperCase();
      formData.rcNumber = rcNumber ? rcNumber.toUpperCase() : '';
      formData.panNumber = panNumber ? panNumber.toUpperCase() : '';
      formData.aadhaarNumber = aadhaarNumber || "Verified Online";
      formData.bankDetails = {
        holderName: bankHolderName || name,
        accountNumber: accountNumber || '',
        ifscCode: ifscCode ? ifscCode.toUpperCase() : '',
        bankName: bankName || ''
      };
      formData.payoutUpi = payoutUpi || `${phone}@upi`;
      formData.rating = 5.0;
      formData.totalTrips = 0;
      formData.todayEarnings = 0;
      formData.isOnline = true;
    }

    const res = await register(formData, false);
    setLoading(false);
    if (res.success) {
      if (role === 'captain') {
        setCaptainSubmittedModal({
          name,
          email,
          phone,
          city: city || 'Bhubaneswar',
          vehicleModel,
          numberPlate: numberPlate.toUpperCase(),
          applicationId: res.applicationId || ('RDX-APP-' + Math.floor(100000 + Math.random() * 900000)),
          submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })
        });
      } else {
        navigate('/login', {
          state: {
            registeredEmail: email,
            role: role,
            successMessage: `🎉 Congratulations ${name}! Your RideX Rider account has been created. Please sign in.`
          }
        });
      }
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-6">
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 font-bold">
              <Car className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Create Ride<span className="text-amber-500">X</span> Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {role === 'captain' ? 'Drive & Earn with RideX • Instant Daily Payouts' : 'Join as a Rider • Fast Booking & Safe Commute'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
            
            {/* Role Tab Selector */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6">
              <button
                type="button"
                onClick={() => { setRole('rider'); setError(''); }}
                className={`py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  role === 'rider'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🚗</span> Passenger (Rider)
              </button>
              <button
                type="button"
                onClick={() => { setRole('captain'); setError(''); }}
                className={`py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  role === 'captain'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>👨‍✈️</span> Become a Captain
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              
              {/* 1. PERSONAL INFORMATION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3.5">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> 1. Personal & Contact Information
                </p>

                {/* Profile Photo Upload for Captain */}
                {role === 'captain' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-500" /> Profile Photo & ID Card Badge (Passport Style)
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        Smart ID 🪪
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 pt-1">
                      <div className="relative group shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-amber-500 bg-white dark:bg-slate-900 flex items-center justify-center shadow-md">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Driver Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-1">
                              <Camera className="w-6 h-6 text-amber-500 mx-auto" />
                              <span className="text-[8px] font-bold text-slate-400 block mt-0.5">Upload</span>
                            </div>
                          )}
                        </div>
                        {photoPreview && (
                          <button
                            type="button"
                            onClick={() => { setPhoto(''); setPhotoPreview(''); }}
                            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 text-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <label className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-amber-500/50 hover:border-amber-500 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold text-xs cursor-pointer transition-all hover:bg-amber-500/5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{photoPreview ? "Change Photo" : "Upload Passport Photo"}</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {photoPreview ? "✓ Attached for RideX Smart ID Card & Profile" : "Clear face photo printed on ID card & visible to riders"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Name & Mobile Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajesh Mohapatra"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Email Address & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@ridex.bike"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Account Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>

                {/* Date of Birth & Gender (For Both Rider & Captain) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Gender *
                    </label>
                    <select
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="" disabled>-- Select Gender --</option>
                      <option value="Male">Male 👨</option>
                      <option value="Female">Female 👩</option>
                      <option value="Other">Other 🧑</option>
                    </select>
                  </div>
                </div>

                {/* Captain Specific Personal Fields: Address, City, Pin, Emergency */}
                {role === 'captain' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Full Residential Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Plot No, Street, Locality, Landmark"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Operating City *
                        </label>
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="" disabled>-- Select Operating City --</option>
                          <option value="Bhubaneswar">Bhubaneswar</option>
                          <option value="Cuttack">Cuttack</option>
                          <option value="Puri">Puri</option>
                          <option value="Rourkela">Rourkela</option>
                          <option value="Berhampur">Berhampur</option>
                          <option value="Sambalpur">Sambalpur</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Postal PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="e.g. 751024"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Emergency Contact Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="e.g. 9437012345 (Family / Guardian)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 2. VEHICLE DETAILS (Captain Only) */}
              {role === 'captain' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 space-y-3.5">
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-amber-500" /> 2. Vehicle Details & Seating Capacity
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Vehicle Category *
                      </label>
                      <select
                        required
                        value={vehicleCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="" disabled>-- Select Category --</option>
                        <option value="bike">🛵 Bike / Moto (1 Seat)</option>
                        <option value="auto">🛺 Auto / Tuk-Tuk (3 Seats)</option>
                        <option value="mini">🚗 Cab Mini / Hatchback (4 Seats)</option>
                        <option value="sedan">🚘 Cab Sedan Prime (4 Seats)</option>
                        <option value="suv">🚙 Cab SUV (6 Seats)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Vehicle Maker & Model *
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="e.g. Hero Splendor / Swift Dzire"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Vehicle Number Plate *
                      </label>
                      <input
                        type="text"
                        required
                        value={numberPlate}
                        onChange={(e) => setNumberPlate(e.target.value)}
                        placeholder="e.g. OD-02-AB-1234"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Seating Capacity (Passenger Count) *
                      </label>
                      <select
                        required
                        value={seatingCapacity}
                        onChange={(e) => setSeatingCapacity(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="" disabled>-- Select Seating Capacity --</option>
                        <option value="1">1 Passenger (Bike)</option>
                        <option value="3">3 Passengers (Auto)</option>
                        <option value="4">4 Passengers (Hatchback / Sedan)</option>
                        <option value="6">6 Passengers (SUV / XL)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DRIVER KYC, RC, PAN, AADHAAR & BANKING PAYOUT DETAILS (Captain Only) */}
              {role === 'captain' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-blue-500" /> 3. Driver KYC & Banking Payout Details
                  </p>

                  {/* Driving License & RC Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Driving License Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. OD-0220200012345"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        RC (Registration Certificate) Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={rcNumber}
                        onChange={(e) => setRcNumber(e.target.value)}
                        placeholder="e.g. RC-OD02-2022-9988"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* PAN & Aadhaar Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        PAN Card Number *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        placeholder="e.g. ABCDE1234F"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        placeholder="12-digit Aadhaar Number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Bank Holder Name & Bank Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Bank Account Holder Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankHolderName}
                        onChange={(e) => setBankHolderName(e.target.value)}
                        placeholder="As per bank passbook"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India / HDFC Bank"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Account Number & IFSC Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        Bank Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter full account number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="e.g. SBIN0002026 / HDFC0001234"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* UPI ID for Daily Instant Payouts */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                      UPI ID for Instant Daily Payouts *
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutUpi}
                      onChange={(e) => setPayoutUpi(e.target.value)}
                      placeholder="e.g. 9876543210@paytm / name@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* 4. TERMS & CONDITIONS AND PRIVACY POLICY CHECKBOXES */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    I agree to the <span className="font-bold text-slate-900 dark:text-white">RideX Driver Partner Terms & Conditions</span> and commercial vehicle safety guidelines.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    I acknowledge and accept the <span className="font-bold text-slate-900 dark:text-white">Privacy Policy</span>, including continuous GPS background tracking for passenger trip security.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 rounded-2xl bg-[#FFC727] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Registering Partner Account..." : `Submit & Complete ${role === 'captain' ? 'Captain' : 'Rider'} Registration ➔`}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* PRO-LEVEL CAPTAIN SUBMISSION SUCCESS MODAL */}
      {captainSubmittedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Icon Header */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center ring-8 ring-amber-500/10 shadow-lg shadow-amber-500/20">
                <FileCheck className="w-9 h-9 text-amber-500" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-block mb-1.5">
                  Application Submitted Successfully 🚀
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Awaiting Administrator Approval
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Thank you, <strong className="text-slate-800 dark:text-slate-200">{captainSubmittedModal.name}</strong>! Your captain registration & KYC credentials have been received.
                </p>
              </div>
            </div>

            {/* Application Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Application Tracking ID:</span>
                <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">{captainSubmittedModal.applicationId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Operating City:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{captainSubmittedModal.city}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Vehicle Details:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{captainSubmittedModal.vehicleModel} ({captainSubmittedModal.numberPlate})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Clearance Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Administrator Verification
                </span>
              </div>
            </div>

            {/* What Happens Next Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Next Steps for Activation:</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                • Our compliance team will review your Driving License, RC, PAN, and Bank details.<br />
                • Upon approval, an <strong>official activation email</strong> will be sent to <strong>{captainSubmittedModal.email}</strong>.<br />
                • You will then be able to log in to your Captain Cockpit and accept rides.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Go to Sign In Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Return to Home
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
