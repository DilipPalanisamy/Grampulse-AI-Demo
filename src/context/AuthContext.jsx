import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { resolveOfficialVillageData } from '../services/officialVillageDataService';

const AuthContext = createContext(null);

const STORAGE_USER_KEY = 'user_session';
const STORAGE_TOKEN_KEY = 'grampulse_auth_token';
const STORAGE_REGISTERED_USERS_KEY = 'grampulse_registered_users';

/**
 * Persistent Registered Users Storage Helper
 */
const getStoredRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse registered users:', e);
    return {};
  }
};

const saveRegisteredUserRecord = (identifier, userData) => {
  try {
    const users = getStoredRegisteredUsers();
    const key = identifier.trim().toLowerCase();
    users[key] = {
      ...users[key],
      ...userData,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not save user to registered accounts database:', e);
  }
};

const findRegisteredUserRecord = (identifier) => {
  try {
    const users = getStoredRegisteredUsers();
    const key = identifier.trim().toLowerCase();
    return users[key] || null;
  } catch (e) {
    return null;
  }
};

// Demo quick-fill citizen account
export const DEMO_CITIZEN = {
  identifier: 'citizen@koduvai.in',
  password: 'citizen123',
  name: 'Aarav Sharma',
  email: 'citizen@koduvai.in',
  villageOrCity: 'Koduvai',
  role: 'CITIZEN',
  roleLabel: 'Verified Citizen Resident',
  designation: 'Ward 3 Resident & Gram Sabha Member',
  gpId: 101,
  gpName: 'Koduvai',
  district: 'Tiruppur',
  state: 'Tamil Nadu',
  lat: 10.9634,
  lng: 77.4727,
  avatar: null,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Permanent Session Persistence:
   * Restores user session automatically on startup from localStorage so the user
   * never needs to log in again across page refreshes or browser restarts.
   */
  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem('user_session') ||
        localStorage.getItem('grampulse_citizen_session');
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch (err) {
      console.error('Failed to parse persistent citizen session:', err);
      localStorage.removeItem('user_session');
      localStorage.removeItem('grampulse_citizen_session');
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Helper to persist authenticated session permanently in localStorage
   */
  const persistSession = (userData) => {
    setUser(userData);
    setToken(userData.token);
    setAuthError(null);
    try {
      localStorage.setItem('user_session', JSON.stringify(userData));
      localStorage.setItem('grampulse_citizen_session', JSON.stringify(userData));
      localStorage.setItem(STORAGE_TOKEN_KEY, userData.token);
    } catch (e) {
      console.warn('Could not persist session to localStorage:', e);
    }
  };

  /**
   * Authenticate via Google ID Token (JWT from GoogleLogin component)
   */
  const loginWithGoogleCredential = useCallback(async (credentialResponse) => {
    setAuthError(null);
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No Google credentials received.');
      }
      const decoded = jwtDecode(credentialResponse.credential);
      let officialVillage = null;
      try {
        officialVillage = await resolveOfficialVillageData('Koduvai', 'Tamil Nadu');
      } catch (err) {
        console.warn('Official village resolution fallback for Google credential:', err);
      }

      if (!officialVillage) {
        officialVillage = {
          gp_id: 101,
          gp_code: 'GP-TN-TPR-101',
          gp_name: 'Koduvai',
          village_name: 'Koduvai',
          district: 'Tiruppur',
          state: 'Tamil Nadu',
          lat: 10.9634,
          lng: 77.4727,
          population: 5800,
          isOfficialData: true,
        };
      }

      const googleUser = {
        token: credentialResponse.credential,
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        avatar: decoded.picture || null,
        role: 'CITIZEN',
        roleLabel: 'Verified Citizen Resident',
        designation: `${officialVillage.gp_name} Citizen Member`,
        villageOrCity: officialVillage.gp_name,
        officialVillage,
        gpId: officialVillage.gp_id,
        gpName: officialVillage.gp_name,
        district: officialVillage.district,
        state: officialVillage.state,
        lat: officialVillage.lat,
        lng: officialVillage.lng,
        provider: 'google',
        loginTimestamp: new Date().toISOString(),
      };
      persistSession(googleUser);
      return true;
    } catch (error) {
      console.error('Google ID token parsing error:', error);
      setAuthError('Failed to process Google sign-in. Please try again.');
      return false;
    }
  }, []);

  /**
   * Authenticate via Google Access Token (from useGoogleLogin popup flow)
   */
  const loginWithGoogleAccessToken = useCallback(async (tokenResponse) => {
    setAuthError(null);
    setLoading(true);
    try {
      if (!tokenResponse?.access_token) {
        throw new Error('No access token received from Google.');
      }
      // Fetch profile from Google UserInfo API
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = res.data;
      let officialVillage = null;
      try {
        officialVillage = await resolveOfficialVillageData('Koduvai', 'Tamil Nadu');
      } catch (err) {
        console.warn('Official village resolution fallback for Google token:', err);
      }

      if (!officialVillage) {
        officialVillage = {
          gp_id: 101,
          gp_code: 'GP-TN-TPR-101',
          gp_name: 'Koduvai',
          village_name: 'Koduvai',
          district: 'Tiruppur',
          state: 'Tamil Nadu',
          lat: 10.9634,
          lng: 77.4727,
          population: 5800,
          isOfficialData: true,
        };
      }

      const googleUser = {
        token: tokenResponse.access_token,
        id: profile.sub,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        avatar: profile.picture || null,
        role: 'CITIZEN',
        roleLabel: 'Verified Citizen Resident',
        designation: `${officialVillage.gp_name} Citizen Member`,
        villageOrCity: officialVillage.gp_name,
        officialVillage,
        gpId: officialVillage.gp_id,
        gpName: officialVillage.gp_name,
        district: officialVillage.district,
        state: officialVillage.state,
        lat: officialVillage.lat,
        lng: officialVillage.lng,
        provider: 'google',
        loginTimestamp: new Date().toISOString(),
      };
      persistSession(googleUser);
      return true;
    } catch (error) {
      console.error('Google UserInfo API error:', error);
      setAuthError('Could not fetch profile info from Google.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Citizen Sign-In or Registration with Username/Email & Password.
   * Seamlessly resolves official village data, binds it to the account profile,
   * and preserves it permanently across all subsequent sessions.
   */
  const loginWithCredentials = useCallback(async (identifier, password, profileMeta = {}) => {
    setAuthError(null);
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 350));

    const cleanIdentifier = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanIdentifier || !cleanPass) {
      setAuthError('Please enter both username/email and password.');
      setLoading(false);
      return false;
    }

    // 1. Check if user already exists in registered database
    const existingRecord = findRegisteredUserRecord(cleanIdentifier);

    if (!existingRecord && cleanIdentifier.toLowerCase() !== DEMO_CITIZEN.identifier.toLowerCase()) {
      setAuthError('No account found with this username or email. Please sign up to create your account.');
      setLoading(false);
      return false;
    }

    // Verify password if user was previously registered
    if (existingRecord?.password && existingRecord.password !== cleanPass) {
      setAuthError('Incorrect password. Please recheck your password and try again.');
      setLoading(false);
      return false;
    }

    if (cleanIdentifier.toLowerCase() === DEMO_CITIZEN.identifier.toLowerCase() && cleanPass !== DEMO_CITIZEN.password) {
      setAuthError('Incorrect password for demo citizen account.');
      setLoading(false);
      return false;
    }

    let name = profileMeta?.name || existingRecord?.name || 'Citizen Resident';
    let email = existingRecord?.email || cleanIdentifier;

    if (!profileMeta?.name && !existingRecord?.name) {
      if (cleanIdentifier.includes('@')) {
        const prefix = cleanIdentifier.split('@')[0];
        name = prefix
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      } else {
        name = cleanIdentifier.charAt(0).toUpperCase() + cleanIdentifier.slice(1);
        email = `${cleanIdentifier.toLowerCase()}@grampulse.gov.in`;
      }
    }

    // 2. Resolve Official Village Data:
    // Priority:
    // a. profileMeta.officialVillage (explicitly provided on signup)
    // b. profileMeta.village (typed on signup)
    // c. existingRecord.officialVillage (persisted from previous signup)
    // d. existingRecord.villageOrCity (persisted name from previous signup)
    // e. DEMO_CITIZEN match
    // f. Fallback to Koduvai
    let officialVillage = profileMeta?.officialVillage || null;

    if (!officialVillage && profileMeta?.village) {
      officialVillage = await resolveOfficialVillageData(profileMeta.village);
    } else if (!officialVillage && existingRecord?.officialVillage) {
      officialVillage = existingRecord.officialVillage;
    } else if (!officialVillage && existingRecord?.villageOrCity) {
      officialVillage = await resolveOfficialVillageData(existingRecord.villageOrCity);
    } else if (!officialVillage && cleanIdentifier.toLowerCase() === DEMO_CITIZEN.identifier.toLowerCase()) {
      officialVillage = await resolveOfficialVillageData(DEMO_CITIZEN.villageOrCity, DEMO_CITIZEN.state);
    } else if (!officialVillage) {
      try {
        officialVillage = await resolveOfficialVillageData('Koduvai', 'Tamil Nadu');
      } catch (err) {
        console.warn('Fallback resolveOfficialVillageData error:', err);
      }
    }

    if (!officialVillage) {
      officialVillage = {
        gp_id: 101,
        gp_code: 'GP-TN-TPR-101',
        gp_name: profileMeta?.village || existingRecord?.villageOrCity || 'Koduvai',
        village_name: profileMeta?.village || existingRecord?.villageOrCity || 'Koduvai',
        district: existingRecord?.district || 'District',
        state: existingRecord?.state || 'Tamil Nadu',
        lat: 10.9634,
        lng: 77.4727,
        population: 5800,
        isOfficialData: true,
      };
    }

    const villageName = officialVillage?.gp_name || profileMeta?.village || existingRecord?.villageOrCity || 'Gram Panchayat';
    const token = `ey_citizen_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const citizenUser = {
      token,
      id: existingRecord?.id || `citizen_${Date.now()}`,
      email,
      name,
      avatar: null,
      role: 'CITIZEN',
      roleLabel: 'Verified Citizen Resident',
      designation: `${villageName} Resident & Citizen Member`,
      villageOrCity: villageName,
      officialVillage,
      gpId: officialVillage?.gp_id || 101,
      gpName: villageName,
      district: officialVillage?.district || 'District',
      state: officialVillage?.state || 'India',
      lat: officialVillage?.lat ?? 10.9634,
      lng: officialVillage?.lng ?? 77.4727,
      provider: 'credentials',
      loginTimestamp: new Date().toISOString(),
    };

    // Save to registered accounts database for permanent recall
    saveRegisteredUserRecord(cleanIdentifier, {
      id: citizenUser.id,
      identifier: cleanIdentifier,
      name,
      email,
      password: cleanPass,
      villageOrCity: villageName,
      officialVillage,
    });

    persistSession(citizenUser);
    setLoading(false);
    return true;
  }, []);

  /**
   * Dedicated Citizen Registration Handler:
   * Takes full name, email/username, village name, and password,
   * computes official census & administrative data, and registers account
   * WITHOUT automatically signing in, requiring the user to explicitly log in.
   */
  const registerCitizenAccount = useCallback(async ({ name, identifier, villageOrCity, password, officialVillage = null }) => {
    setAuthError(null);
    setLoading(true);

    try {
      const cleanIdentifier = String(identifier || '').trim();
      const cleanPass = String(password || '').trim();
      const cleanName = String(name || '').trim();
      const cleanVillage = String(villageOrCity || '').trim();

      if (!cleanIdentifier || !cleanPass) {
        setAuthError('Please enter all required fields.');
        return false;
      }

      // Check if user already exists
      const existing = findRegisteredUserRecord(cleanIdentifier);
      if (existing) {
        setAuthError('An account with this username or email already exists. Please sign in.');
        return false;
      }

      let resolvedVillage = officialVillage;
      if (!resolvedVillage && cleanVillage) {
        resolvedVillage = await resolveOfficialVillageData(cleanVillage);
      }

      if (!resolvedVillage) {
        resolvedVillage = {
          gp_id: 101,
          gp_code: 'GP-TN-TPR-101',
          gp_name: cleanVillage || 'Koduvai',
          village_name: cleanVillage || 'Koduvai',
          district: 'District',
          state: 'Tamil Nadu',
          lat: 10.9634,
          lng: 77.4727,
          population: 5800,
          isOfficialData: true,
        };
      }

      const villageName = resolvedVillage?.gp_name || cleanVillage || 'Gram Panchayat';
      const cleanEmail = cleanIdentifier.includes('@')
        ? cleanIdentifier
        : `${cleanIdentifier.toLowerCase()}@grampulse.gov.in`;

      // Save user to permanent accounts storage
      saveRegisteredUserRecord(cleanIdentifier, {
        id: `citizen_${Date.now()}`,
        identifier: cleanIdentifier,
        name: cleanName || cleanIdentifier,
        email: cleanEmail,
        password: cleanPass,
        villageOrCity: villageName,
        officialVillage: resolvedVillage,
        createdAt: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      console.error('Account registration error:', err);
      setAuthError(err.message || 'Failed to register citizen account.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Quick 1-Click Demo Citizen Login
   */
  const quickDemoLogin = useCallback(async () => {
    return loginWithCredentials(DEMO_CITIZEN.identifier, DEMO_CITIZEN.password);
  }, [loginWithCredentials]);

  /**
   * Explicit Logout: Clears permanent session storage
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    try {
      localStorage.removeItem('user_session');
      localStorage.removeItem('grampulse_citizen_session');
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch (e) {
      console.warn('Could not clear localStorage session:', e);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    authError,
    setAuthError,
    loginWithGoogleCredential,
    loginWithGoogleAccessToken,
    loginWithCredentials,
    registerCitizenAccount,
    quickDemoLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
