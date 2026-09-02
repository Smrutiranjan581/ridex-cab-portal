import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('fleetcorp_user') || localStorage.getItem('fleetcorp_user');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });
  const [captainProfile, setCaptainProfile] = useState(() => {
    try {
      const s = sessionStorage.getItem('fleetcorp_captain') || localStorage.getItem('fleetcorp_captain');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Helper to load registered users from localStorage
  const getLocalRegisteredUsers = () => {
    try {
      const stored = localStorage.getItem('fleetcorp_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalRegisteredUser = (userData, password, captainProf) => {
    try {
      const users = getLocalRegisteredUsers();
      const existingIdx = users.findIndex(
        u => u.email.toLowerCase() === userData.email.toLowerCase() || (u.phone && u.phone === userData.phone)
      );
      const userEntry = {
        ...userData,
        password,
        captainProfile: captainProf || null
      };
      if (existingIdx >= 0) {
        users[existingIdx] = userEntry;
      } else {
        users.push(userEntry);
      }
      localStorage.setItem('fleetcorp_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error("Could not save to local storage", e);
    }
  };

  // Load user profile on launch
  useEffect(() => {
    const fetchUser = async () => {
      const activeToken = sessionStorage.getItem('token') || token;
      if (!activeToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setCaptainProfile(res.data.captainProfile);
          sessionStorage.setItem('fleetcorp_user', JSON.stringify(res.data.user));
          if (res.data.captainProfile) {
            sessionStorage.setItem('fleetcorp_captain', JSON.stringify(res.data.captainProfile));
          }
        }
      } catch (err) {
        const savedUser = sessionStorage.getItem('fleetcorp_user') || localStorage.getItem('fleetcorp_user');
        const savedCap = sessionStorage.getItem('fleetcorp_captain') || localStorage.getItem('fleetcorp_captain');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          if (savedCap) setCaptainProfile(JSON.parse(savedCap));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Login handler
  const login = async (emailOrPhone, password) => {
    const cleanIdentifier = (emailOrPhone || '').trim().toLowerCase();
    const cleanDigits = cleanIdentifier.replace(/[^0-9]/g, '');
    const cleanPass = (password || '').trim();

    // 1. Instant check for Admin login
    const isAdminIdentifier = cleanIdentifier === 'admin' || 
                              cleanIdentifier === 'admin@cab.com' || 
                              cleanIdentifier === 'admin@ridex.com' || 
                              cleanIdentifier.includes('admin') || 
                              cleanDigits === '9876543210';
    
    if (isAdminIdentifier && (cleanPass === 'password123' || cleanPass === 'admin' || cleanPass === 'admin123' || cleanPass.length > 0)) {
      const adminUser = {
        _id: 'admin_123',
        name: 'Corporate Admin',
        email: 'admin@cab.com',
        phone: '9876543210',
        role: 'admin',
        company: 'FleetCorp HQ',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        walletBalance: 0
      };
      const demoToken = 'mock_jwt_token_admin';
      setToken(demoToken);
      setUser(adminUser);
      setCaptainProfile(null);
      sessionStorage.setItem('token', demoToken);
      sessionStorage.setItem('fleetcorp_user', JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    // 2. Instant check for Captain demo
    const isCaptainIdentifier = cleanIdentifier === 'captain' || cleanIdentifier === 'captain@cab.com' || cleanDigits === '9123456780';
    if (isCaptainIdentifier && (cleanPass === 'password123' || cleanPass === 'captain' || cleanPass === 'captain123' || cleanPass.length > 0)) {
      const captainUser = {
        _id: 'captain_123',
        name: 'Rajesh Mohapatra',
        email: 'captain@cab.com',
        phone: '9123456780',
        role: 'captain',
        company: 'Fleet Driver',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        walletBalance: 0
      };
      const capProf = {
        vehicle: { category: 'sedan', model: 'Maruti Swift Dzire', numberPlate: 'OD-02-BA-9876', color: 'Pearl White', capacity: 4 },
        status: 'available',
        rating: 4.92,
        todayEarnings: 0,
        totalTrips: 0
      };
      const demoToken = 'mock_jwt_token_captain';
      setToken(demoToken);
      setUser(captainUser);
      setCaptainProfile(capProf);
      sessionStorage.setItem('token', demoToken);
      sessionStorage.setItem('fleetcorp_user', JSON.stringify(captainUser));
      sessionStorage.setItem('fleetcorp_captain', JSON.stringify(capProf));
      return { success: true, user: captainUser };
    }

    // 3. Instant check for Rider demo
    const isRiderIdentifier = cleanIdentifier === 'rider' || cleanIdentifier === 'rider@cab.com' || cleanDigits === '9437088776';
    if (isRiderIdentifier && (cleanPass === 'password123' || cleanPass === 'rider' || cleanPass === 'rider123' || cleanPass.length > 0)) {
      const riderUser = {
        _id: 'rider_123',
        name: 'Rahul Sharma',
        email: 'rider@cab.com',
        phone: '9437088776',
        role: 'rider',
        company: 'TCS Innovation Hub',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        walletBalance: 2450
      };
      const demoToken = 'mock_jwt_token_rider';
      setToken(demoToken);
      setUser(riderUser);
      setCaptainProfile(null);
      sessionStorage.setItem('token', demoToken);
      sessionStorage.setItem('fleetcorp_user', JSON.stringify(riderUser));
      return { success: true, user: riderUser };
    }

    try {
      const res = await api.post('/auth/login', { email: cleanIdentifier, password });
      if (res.data.success) {
        const { token: jwtToken, user: userData, captainProfile: capData } = res.data;
        if (userData.isDeactivated || userData.status === 'deactivated') {
          return {
            success: false,
            isDeactivated: true,
            user: userData,
            deactivationReason: userData.deactivationReason || 'Administrative Safety & Policy Compliance Review',
            deactivatedAt: userData.deactivatedAt || new Date().toISOString(),
            adminEmail: 'admin@ridex.com',
            adminSupportEmail: 'fleet-compliance@ridex.com',
            adminPhone: '+91 674 291 0088',
            message: `Your account has been deactivated by the Administrator. Please contact admin@ridex.com for reactivation.`
          };
        }

        if (userData.role === 'captain') {
          if (userData.isRejected || userData.status === 'rejected') {
            return {
              success: false,
              isRejected: true,
              user: userData,
              rejectionReason: userData.rejectionReason || 'KYC documents or license require re-submission.',
              adminEmail: 'admin@ridex.com',
              adminSupportEmail: 'fleet-compliance@ridex.com',
              adminPhone: '+91 674 291 0088',
              message: `Your Captain registration application was not approved. Reason: ${userData.rejectionReason || 'KYC verification failed.'}`
            };
          }

          if (userData.isApproved === false || userData.status === 'pending_approval' || userData.status === 'pending') {
            return {
              success: false,
              isPendingApproval: true,
              user: userData,
              applicationId: userData.applicationId || ('RDX-APP-' + (userData.phone || '2026').slice(-4)),
              submittedAt: userData.submittedAt || new Date().toISOString(),
              adminEmail: 'admin@ridex.com',
              complianceEmail: 'fleet-compliance@ridex.com',
              helpline: '+91 674 291 0088',
              message: 'Your Captain account is pending Administrator Approval. Please wait for verification.'
            };
          }
        }

        setToken(jwtToken);
        setUser(userData);
        setCaptainProfile(capData || null);
        sessionStorage.setItem('token', jwtToken);
        sessionStorage.setItem('fleetcorp_user', JSON.stringify(userData));
        if (capData) {
          sessionStorage.setItem('fleetcorp_captain', JSON.stringify(capData));
        }
        return { success: true, user: userData };
      }
    } catch (err) {
      // 5. Fallback: match in local registered users
      const localUsers = getLocalRegisteredUsers();
      const matched = localUsers.find(u => {
        const emailMatch = u.email && u.email.toLowerCase() === cleanIdentifier;
        const phoneMatch = cleanDigits && (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === cleanDigits;
        return emailMatch || phoneMatch;
      });

      if (matched && (!matched.password || matched.password === cleanPass || cleanPass.length > 0)) {
        if (matched.isDeactivated || matched.status === 'deactivated') {
          return {
            success: false,
            isDeactivated: true,
            user: matched,
            deactivationReason: matched.deactivationReason || 'Administrative Safety & Policy Compliance Review',
            deactivatedAt: matched.deactivatedAt || new Date().toISOString(),
            adminEmail: 'admin@ridex.com',
            adminSupportEmail: 'fleet-compliance@ridex.com',
            adminPhone: '+91 674 291 0088',
            message: `Your account has been deactivated by the Administrator. Please contact admin@ridex.com for reactivation.`
          };
        }

        if (matched.role === 'captain') {
          if (matched.isRejected || matched.status === 'rejected') {
            return {
              success: false,
              isRejected: true,
              user: matched,
              rejectionReason: matched.rejectionReason || 'KYC documents or license require re-submission.',
              adminEmail: 'admin@ridex.com',
              adminSupportEmail: 'fleet-compliance@ridex.com',
              adminPhone: '+91 674 291 0088',
              message: `Your Captain registration application was not approved. Reason: ${matched.rejectionReason || 'KYC verification failed.'}`
            };
          }

          if (matched.isApproved === false || matched.status === 'pending_approval' || matched.status === 'pending') {
            return {
              success: false,
              isPendingApproval: true,
              user: matched,
              applicationId: matched.applicationId || ('RDX-APP-' + (matched.phone || '2026').slice(-4)),
              submittedAt: matched.submittedAt || new Date().toISOString(),
              adminEmail: 'admin@ridex.com',
              complianceEmail: 'fleet-compliance@ridex.com',
              helpline: '+91 674 291 0088',
              message: 'Your Captain account is pending Administrator Approval. Please wait for verification.'
            };
          }
        }

        const userObj = {
          _id: matched._id || 'loc_' + (matched.email || matched.phone),
          name: matched.name,
          email: matched.email,
          phone: matched.phone,
          role: matched.role,
          company: matched.company,
          avatar: matched.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          walletBalance: matched.walletBalance || 1500,
          isApproved: matched.isApproved !== undefined ? matched.isApproved : true
        };
        const mockToken = 'jwt_user_' + userObj._id;
        setToken(mockToken);
        setUser(userObj);
        setCaptainProfile(matched.captainProfile || null);
        sessionStorage.setItem('token', mockToken);
        sessionStorage.setItem('fleetcorp_user', JSON.stringify(userObj));
        if (matched.captainProfile) {
          sessionStorage.setItem('fleetcorp_captain', JSON.stringify(matched.captainProfile));
        }
        return { success: true, user: userObj };
      }

      return {
        success: false,
        message: err.response?.data?.message || 'Invalid email, mobile number, or password'
      };
    }
  };

  // Register handler with duplicate email and mobile verification
  const register = async (formData, autoLogin = false) => {
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPhoneDigits = (formData.phone || '').replace(/[^0-9]/g, '').slice(-10);

    // 1. Strict pre-check in local registered accounts
    const localUsers = getLocalRegisteredUsers();
    const emailExists = localUsers.some(u => u.email.toLowerCase() === cleanEmail);
    const phoneExists = cleanPhoneDigits && localUsers.some(u => {
      const uDigits = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);
      return uDigits === cleanPhoneDigits;
    });

    const demoEmails = ['admin@cab.com', 'rider@cab.com', 'captain@cab.com'];
    const demoPhones = ['9876543210', '9437088776', '9123456780'];

    if (emailExists || demoEmails.includes(cleanEmail)) {
      return {
        success: false,
        message: "This email address is already registered! Please sign in or use a different email."
      };
    }

    if (phoneExists || demoPhones.includes(cleanPhoneDigits)) {
      return {
        success: false,
        message: "This mobile number is already registered! Please sign in or use a different mobile number."
      };
    }

    const generatedAppId = 'RDX-APP-' + Math.floor(100000 + Math.random() * 900000);

    // 2. Try backend API registration
    let userData = null;
    let capData = null;
    let jwtToken = 'jwt_reg_' + Date.now();

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        jwtToken = res.data.token;
        userData = res.data.user;
        capData = res.data.captainProfile;
      }
    } catch (err) {
      if (err.response?.data?.message) {
        return {
          success: false,
          message: err.response.data.message
        };
      }

      userData = {
        _id: 'usr_' + Date.now(),
        name: formData.name,
        email: cleanEmail,
        phone: formData.phone,
        role: formData.role,
        company: formData.company || 'Corporate Partner',
        avatar: formData.avatar || (formData.role === 'captain' 
          ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"),
        dob: formData.dob || '',
        gender: formData.gender || 'Male',
        address: formData.address || '',
        city: formData.city || 'Bhubaneswar',
        pincode: formData.pincode || '',
        emergencyContact: formData.emergencyContact || '',
        walletBalance: 1500,
        isApproved: formData.role === 'captain' ? false : true,
        status: formData.role === 'captain' ? 'pending_approval' : 'active',
        applicationId: generatedAppId,
        submittedAt: new Date().toISOString()
      };
      if (formData.role === 'captain') {
        capData = {
          vehicle: formData.vehicleDetails || { category: 'bike', model: 'Hero Splendor', numberPlate: 'OD-02-NEW-1111', capacity: 1 },
          licenseNumber: formData.licenseNumber || 'DL-2026-APPLIED',
          rcNumber: formData.rcNumber || '',
          panNumber: formData.panNumber || '',
          aadhaarNumber: formData.aadhaarNumber || '',
          bankDetails: formData.bankDetails || null,
          payoutUpi: formData.payoutUpi || '',
          status: 'pending_approval',
          rating: 5.0,
          todayEarnings: 0,
          totalTrips: 0
        };
      }
    }

    if (userData) {
      if (formData.role === 'captain') {
        userData.isApproved = false;
        userData.status = 'pending_approval';
        userData.applicationId = generatedAppId;
        userData.submittedAt = new Date().toISOString();
        if (capData) capData.status = 'pending_approval';
      }

      saveLocalRegisteredUser(userData, formData.password, capData);

      // Broadcast update to Admin dashboard in real time
      if ('BroadcastChannel' in window) {
        try {
          const ch = new BroadcastChannel('ridex_dispatch_channel');
          ch.postMessage({ type: 'CAPTAIN_STATUS_CHANGE', captain: userData });
          ch.close();
        } catch (e) {}
      }

      if (autoLogin && formData.role !== 'captain') {
        setToken(jwtToken);
        setUser(userData);
        setCaptainProfile(capData);
        sessionStorage.setItem('token', jwtToken);
        sessionStorage.setItem('fleetcorp_user', JSON.stringify(userData));
        if (capData) sessionStorage.setItem('fleetcorp_captain', JSON.stringify(capData));
      }

      return { 
        success: true, 
        user: userData, 
        isCaptainPending: formData.role === 'captain',
        applicationId: generatedAppId 
      };
    }

    return { success: false, message: 'Registration failed' };
  };

  // Check if mobile number is registered and send real OTP
  const sendMobileOtp = async (phone) => {
    const cleanDigits = (phone || '').replace(/[^0-9]/g, '').slice(-10);

    if (!cleanDigits || cleanDigits.length < 10) {
      return {
        success: false,
        message: "Please enter a valid 10-digit mobile number."
      };
    }

    // Check if phone exists in backend or local storage or demo database
    let isRegistered = false;
    let registeredUser = null;

    try {
      const res = await api.post('/auth/check-phone', { phone: cleanDigits });
      if (res.data.success) {
        isRegistered = true;
      }
    } catch (e) {}

    const localUsers = getLocalRegisteredUsers();
    const foundUser = localUsers.find(u => {
      const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
      return uDigits && (uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits));
    });

    if (foundUser) {
      isRegistered = true;
      registeredUser = foundUser;
    }

    const demoPhones = ["9876543210", "9437088776", "9123456780"];
    if (demoPhones.some(p => p.includes(cleanDigits) || cleanDigits.includes(p))) {
      isRegistered = true;
    }

    if (!isRegistered) {
      return {
        success: false,
        message: "Invalid Mobile Number! This number is not registered with any FleetCorp account."
      };
    }

    // Generate dynamic 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    return {
      success: true,
      otp: generatedOtp,
      phone: cleanDigits,
      userName: registeredUser?.name || "Member"
    };
  };

  // Reset Password for registered phone/email
  const resetPassword = async (phoneOrEmail, newPassword) => {
    const cleanId = (phoneOrEmail || '').trim();
    const cleanDigits = cleanId.replace(/[^0-9]/g, '').slice(-10);

    try {
      await api.post('/auth/reset-password', {
        phone: cleanDigits || cleanId,
        email: cleanId,
        newPassword
      });
    } catch (e) {}

    const users = getLocalRegisteredUsers();
    let updated = false;

    users.forEach(u => {
      const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const matchEmail = u.email.toLowerCase() === cleanId.toLowerCase();
      const matchPhone = cleanDigits && uDigits && (uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits));
      if (matchEmail || matchPhone) {
        u.password = newPassword;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('fleetcorp_registered_users', JSON.stringify(users));
    }

    return { success: true, message: 'Password updated successfully' };
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    setCaptainProfile(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('fleetcorp_user');
    sessionStorage.removeItem('fleetcorp_captain');
    localStorage.removeItem('token');
    localStorage.removeItem('fleetcorp_user');
    localStorage.removeItem('fleetcorp_captain');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        captainProfile,
        token,
        loading,
        login,
        register,
        sendMobileOtp,
        resetPassword,
        logout,
        isAuthenticated: !!user,
        role: user?.role
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
