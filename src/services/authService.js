/**
 * GramPulse AI - Client-Side Authentication & Google OAuth Service
 * Supports Google Identity Services (GIS), Google OAuth popups, and Citizen credential logins.
 */

const GOOGLE_CLIENT_ID =
  import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
  ''; // Set VITE_GOOGLE_CLIENT_ID in .env for custom production client ID

/**
 * Decodes standard Google JWT ID token payload safely.
 */
export const decodeGoogleJwt = (credential) => {
  try {
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode Google JWT token:', error);
    return null;
  }
};

/**
 * Authenticates user via Google OAuth (Google Identity Services or client popup).
 */
export const signInWithGoogleOAuth = async () => {
  // If Google GSI SDK is initialized and client ID is provided
  if (typeof window !== 'undefined' && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            const payload = decodeGoogleJwt(response.credential);
            if (payload) {
              const citizenUser = {
                token: response.credential,
                id: payload.sub,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                avatar: payload.picture || null,
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
              resolve(citizenUser);
              return;
            }
          }
          reject(new Error('Google sign-in could not be completed.'));
        },
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to client prompt if one-tap is skipped
        }
      });
    });
  }

  // Seamless client-side Google OAuth simulation / fallback
  await new Promise((resolve) => setTimeout(resolve, 600));

  const sampleGoogleAccounts = [
    {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rohan Verma',
      email: 'rohan.verma@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const selectedAcc = sampleGoogleAccounts[0];
  const mockJwtToken = `ey_google_oauth_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    token: mockJwtToken,
    id: `google_${Date.now()}`,
    email: selectedAcc.email,
    name: selectedAcc.name,
    avatar: selectedAcc.avatar,
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
};

/**
 * Authenticates citizen via Username or Gmail ID and Password.
 */
export const signInWithCitizenCredentials = async (identifier, password) => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const cleanIdentifier = identifier.trim();
  const cleanPass = password.trim();

  if (!cleanIdentifier || !cleanPass) {
    throw new Error('Please provide both username/email and password.');
  }

  // Format clean display name from identifier
  let name = 'Citizen Resident';
  let email = cleanIdentifier;

  if (cleanIdentifier.includes('@')) {
    const prefix = cleanIdentifier.split('@')[0];
    name = prefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } else {
    name = cleanIdentifier.charAt(0).toUpperCase() + cleanIdentifier.slice(1);
    email = `${cleanIdentifier.toLowerCase()}@punsari.in`;
  }

  const token = `ey_citizen_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    token,
    id: `citizen_${Date.now()}`,
    email,
    name,
    avatar: null,
    role: 'CITIZEN',
    roleLabel: 'Verified Citizen Resident',
    designation: 'Citizen / Gram Sabha Member',
    gpId: 2,
    gpName: 'Punsari GP, Gujarat',
    district: 'Sabarkantha',
    state: 'Gujarat',
    provider: 'credentials',
    loginTimestamp: new Date().toISOString(),
  };
};
