import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext(null);

const STORAGE_USER_KEY = 'user_session';
const STORAGE_TOKEN_KEY = 'grampulse_auth_token';

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
  gpName: 'Koduvai GP, Tamil Nadu',
  district: 'Tiruppur',
  state: 'Tamil Nadu',
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
  const loginWithGoogleCredential = useCallback((credentialResponse) => {
    setAuthError(null);
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No Google credentials received.');
      }
      const decoded = jwtDecode(credentialResponse.credential);
      const googleUser = {
        token: credentialResponse.credential,
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        avatar: decoded.picture || null,
        role: 'CITIZEN',
        roleLabel: 'Verified Citizen Resident',
        designation: 'Citizen / Gram Sabha Member',
        gpId: 2,
        gpName: 'Punsari GP, Gujarat',
        district: 'Sabarkantha',
        state: 'Gujarat',
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
      const googleUser = {
        token: tokenResponse.access_token,
        id: profile.sub,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        avatar: profile.picture || null,
        role: 'CITIZEN',
        roleLabel: 'Verified Citizen Resident',
        designation: 'Citizen / Gram Sabha Member',
        gpId: 2,
        gpName: 'Punsari GP, Gujarat',
        district: 'Sabarkantha',
        state: 'Gujarat',
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
   * Citizen Sign-In with Username or Gmail ID & Password
   */
  const loginWithCredentials = useCallback(async (identifier, password, profileMeta = {}) => {
    setAuthError(null);
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanIdentifier = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanIdentifier || !cleanPass) {
      setAuthError('Please enter both username/email and password.');
      setLoading(false);
      return false;
    }

    let name = profileMeta?.name || 'Citizen Resident';
    let email = cleanIdentifier;

    if (!profileMeta?.name) {
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

    const villageName = profileMeta?.village || 'Gram Panchayat';

    const token = `ey_citizen_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const citizenUser = {
      token,
      id: `citizen_${Date.now()}`,
      email,
      name,
      avatar: null,
      role: 'CITIZEN',
      roleLabel: 'Verified Citizen Resident',
      designation: `${villageName} Resident & Citizen Member`,
      gpId: 4,
      gpName: `${villageName}`,
      district: 'District',
      state: 'India',
      provider: 'credentials',
      loginTimestamp: new Date().toISOString(),
    };

    persistSession(citizenUser);
    setLoading(false);
    return true;
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
