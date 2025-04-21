// src/lib/tokenStorage.ts (Using react-native-keychain)
import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'yourAppAuthService'; // Use a unique service name

export const setTokens = async (accessToken: string, refreshToken?: string) => {
  console.log('Attempting to store tokens in Keychain...');
  console.log('Storing accessToken:', accessToken ? 'Exists' : 'null');
  console.log('Storing refreshToken:', refreshToken ? 'Exists' : 'undefined');
  try {
    // Store access token securely
    await Keychain.setGenericPassword(TOKEN_SERVICE, accessToken, { service: 'accessToken' });
    console.log('accessToken stored successfully.');
    // Store refresh token securely if you have one
    if (refreshToken) {
       await Keychain.setGenericPassword(TOKEN_SERVICE, refreshToken, { service: 'refreshToken' });
       console.log('refreshToken stored successfully.');
    } else {
       // If refreshToken is explicitly undefined/null, ensure the old one is removed
       await Keychain.resetGenericPassword({ service: 'refreshToken' });
       console.log('refreshToken was null/undefined, cleared from Keychain.');
    }
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

export const getTokens = async () => {
  console.log('Attempting to retrieve tokens from Keychain...');
  try {
    const accessToken = await Keychain.getGenericPassword({ service: 'accessToken' });
    const refreshToken = await Keychain.getGenericPassword({ service: 'refreshToken' });

    // Keychain.getGenericPassword returns an object with username and password (our stored value)
    const retrievedAccessToken = accessToken ? accessToken.password : null;
    const retrievedRefreshToken = refreshToken ? refreshToken.password : null;

    console.log('Retrieved accessToken:', retrievedAccessToken ? 'Exists' : 'null');
    console.log('Retrieved refreshToken:', retrievedRefreshToken ? 'Exists' : 'null');

    return {
      accessToken: retrievedAccessToken,
      refreshToken: retrievedRefreshToken,
    };
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

export const removeTokens = async () => {
  console.log('Attempting to remove tokens from Keychain...');
  try {
    await Keychain.resetGenericPassword({ service: 'accessToken' });
    console.log('accessToken removed successfully.');
    await Keychain.resetGenericPassword({ service: 'refreshToken' });
     console.log('refreshToken removed successfully.');
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};