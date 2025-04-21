// src/screens/MfaVerificationScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
// Import useRoute to get navigation parameters, useNavigation to navigate
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
// Import necessary hooks and libraries for form handling and validation
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Import OTP input component and related types
import {
  CodeField,
  useBlurOnFulfill,
  useClearByFocusCell,
  // Other types if needed like CellProps
} from 'react-native-confirmation-code-field';
// Import useMutation for API call
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import useQueryClient if needed directly, or get it from AuthContext
// Import your API instance and token/cookie helpers

// Import Cookies library
import Cookies from '@react-native-cookies/cookies';
// Import AuthContext to update state after successful MFA verification
import { useAuthContext } from '../../context/auth-context'; // Adjust path if needed
import API, { BASE_URL } from '../../lib/axios';
import { setTokens } from '../../lib/tokenStorage';
import { RootStackParamList } from '../../navigation/AppNavigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'MfaVerification'>;
// Define the Zod schema for validation (matches your web schema for pin)
const mfaSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time code must be 6 digits.",
  }).max(6, { // Added max length validation
      message: "Your one-time code must be 6 digits.",
  }),
  // Note: The email is passed via navigation params, not part of the form
});

// Define type for the form data
type MfaFormValues = z.infer<typeof mfaSchema>;

// Define the type for the route parameters expected by this screen
// Assuming your navigator setup uses a RootStackParamList type somewhere
// import { RootStackParamList } from '../navigation/AppNavigator'; // Example type import
type MfaVerificationRouteParams = {
  // 'MfaVerification' should be the name of this route in your navigator
  MfaVerification: { email: string }; // Expecting email as a required string param
};


// Define the type for the route prop for this screen
type MfaVerificationRouteProp = RouteProp<MfaVerificationRouteParams, 'MfaVerification'>;
type MfaVerificationScreenNavigationProp = NavigationProp<RootStackParamList>;

const CELL_COUNT = 6; // Number of OTP digits

const MfaVerificationScreen = () => {

  const route = useRoute<MfaVerificationRouteProp>();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  
  
  const email = route.params?.email; 


  const navigation = useNavigation<MfaVerificationScreenNavigationProp>(); 

  // Get AuthContext to update state after successful verification
  // We need setUser and queryClient from context to update authentication state
 // Assuming queryClient is available in AuthContextType
  const queryClient = useQueryClient(); // Get query client for invalidating queries
  // Initialize react-hook-form
  const form = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema), // Use Zod resolver
    defaultValues: {
      pin: "",
    },
    mode: 'onBlur', // Validate on blur or onSubmit
  });
  useEffect(() => {
    // if (isAuthenticated && !authLoading) {
    //   navigation.navigate('Home');
    // }
  }, [isAuthenticated, authLoading, navigation]);

  const { control, handleSubmit, formState, setValue, getValues } = form;
  const { errors } = formState; // Get validation errors


  const ref = useBlurOnFulfill({ value: getValues('pin'), cellCount: CELL_COUNT }); // Use getValues for value
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
      setValue: (value) => setValue('pin', value),
  });



  const [verificationError, setVerificationError] = useState<string | null>(null);



  const { mutate: verifyMfaMutation, isPending: isVerifyingMfa } = useMutation({
    mutationFn: async ({ email, code }: { email: string, code: string }) => {

  
      const response = await API.post('/mfa/verify-login', { email, code });
      console.log('Verify MFA API response:', response);
      return response.data; 
    },
    onSuccess: async (response) => {
      console.log('MFA Verification API call successful.');
      setVerificationError(null); 

      const cookies = await Cookies.get(`${BASE_URL}/mfa/verify-login`);
      const cookies_1 = await Cookies.get(`${BASE_URL}/auth/refresh`);

      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      if (cookies) {
        if (cookies?.accessToken?.value) {
          accessToken = cookies.accessToken.value;
          refreshToken = cookies_1.refreshToken?.value || null;
        }

      } else {
           console.warn(`No cookies returned by Cookies.get(${BASE_URL}, ['accessToken', 'refreshToken']) after MFA verification.`);
      }

      if (accessToken) {

          await setTokens(accessToken, refreshToken || undefined);

          queryClient.invalidateQueries({ 
            queryKey: ['authUser'],
            refetchType: 'active'
          }); 

      } else {
         console.error('MFA verification successful but no new access token cookie received or extracted correctly.');
         Alert.alert("Login Failed", "Could not establish session after MFA. Please log in again.");
         navigation.navigate('Login'); 
      }


    },
    onError: (error: any) => {
      console.error('MFA verification failed:', error);
      const errorMessage = error.message || error.response?.data?.message || 'MFA verification failed.';
      setVerificationError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
    },
  });


  const onSubmit = async (values: MfaFormValues) => {
    if (!email) {
        console.error("Email parameter missing for MFA verification.");
        Alert.alert("Error", "Email is missing. Please return to login.");
         navigation.navigate('Login');
        return;
    }

    setVerificationError(null);

    verifyMfaMutation({ email, code: values.pin });
  };

  const handleReturnToSignIn = () => {
      navigation.navigate('Login'); 
  };

  if (!email) {
      console.error("MfaVerificationScreen loaded without email parameter.");
      return (
          <View style={styles.errorContainer}>
              <Text style={styles.apiErrorText}>Error: Email parameter missing.</Text>
              <TouchableOpacity style={styles.button} onPress={handleReturnToSignIn}>
                  <Text style={styles.buttonText}>Return to Login</Text>
              </TouchableOpacity>
          </View>
      );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* You might add your Logo here too */}
        {/* <Logo size={50} /> */}

        <Text style={styles.title}>Verify Your Login</Text>
        <Text style={styles.subtitle}>
          An OTP has been sent to your email: <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.instructionText}>
          Please enter the 6-digit code to complete your login.
        </Text>

        {verificationError && (
          <Text style={styles.apiErrorText}>{verificationError}</Text>
        )}
        {errors.pin && <Text style={styles.validationErrorText}>{errors.pin.message}</Text>}


         <Controller
            control={control}
            name="pin"
            render={({ field: { onChange, onBlur, value } }) => (
                <CodeField
                    ref={ref} 
                    {...props} 
                    value={value} 
                    onChangeText={(text) => {
                        onChange(text); // Update hookform value
                         // Optional: trigger submit automatically when all cells are filled
                         if (text.length === CELL_COUNT) {
                         }
                    }}
                    onBlur={onBlur} // Bind onBlur from hookform
                    cellCount={CELL_COUNT} // Number of cells
                    rootStyle={styles.codeFieldRoot} // Style for the container View
                    keyboardType="number-pad" // Number keyboard
                    textContentType="oneTimeCode" // Auto-fill from SMS on iOS 12+
                    autoComplete="one-time-code" // Auto-fill from SMS on Android 11+
                    testID="otp-input" // Optional test ID
                    renderCell={({index, symbol, isFocused}) => (
                        // Render each individual cell (Text component)
                        <Text
                            key={index}
                            style={[
                                styles.cell,
                                isFocused && styles.focusCell, // Apply focus style
                                errors.pin && styles.cellError, // Apply error style if validation fails
                            ]}
                            onLayout={getCellOnLayoutHandler(index)}> // Attach layout handler for useClearByFocusCell
                            {symbol || (isFocused ? '_' : ' ')} Show digit, underscore when focused, space when empty
                        </Text>
                    )}
                    editable={!isVerifyingMfa} // Disable input while API call is pending
                />
            )}
          />


        {/* Submit OTP Button */}
        <TouchableOpacity
          style={[styles.button, isVerifyingMfa && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)} // Use handleSubmit to trigger validation before onSubmit
          disabled={isVerifyingMfa} // Disable while API call is pending
        >
          {isVerifyingMfa ? (
            <ActivityIndicator color="#fff" /> // Show spinner while verifying
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Placeholder for Resend OTP button (Optional) */}
        {/* You'll need to add a new useMutation for resending the code */}
        {/* <TouchableOpacity onPress={handleResendOtp} disabled={isVerifyingMfa /* || isResendingOTP */ /*}>
          <Text style={styles.resendLink}>Resend Code</Text>
        </TouchableOpacity> */}


        {/* Return to Sign In Button */}
         <TouchableOpacity
           style={styles.returnButton} // Add style for this button
           onPress={handleReturnToSignIn} // Handle navigation
           disabled={isVerifyingMfa} // Disable while verifying
         >
           <Text style={styles.returnButtonText}>Return to sign in</Text>
         </TouchableOpacity>


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
   errorContainer: { // Style for the error state if email param is missing
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#fff',
   },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emailText: {
      fontWeight: 'bold',
      color: '#333',
  },
  instructionText: {
      fontSize: 14,
      color: '#666',
      marginBottom: 20,
      textAlign: 'center',
  },
  apiErrorText: { // Style for API errors (from mutation)
      fontSize: 14,
      color: '#dc3545',
      marginBottom: 15,
      textAlign: 'center',
  },
  validationErrorText: { // Style for form validation errors
      fontSize: 12,
      color: '#dc3545',
      marginTop: 4,
      textAlign: 'center', // Center validation errors below OTP
      width: '100%',
      maxWidth: 250,
  },
  // --- Styles for react-native-confirmation-code-field ---
   codeFieldRoot: {marginTop: 20, width: '80%', maxWidth: 250, justifyContent: 'space-between'}, // Container for cells
   cell: {
     width: 40,
     height: 40,
     lineHeight: 38, // Center text vertically in cell
     fontSize: 24,
     borderWidth: 2,
     borderColor: '#00000030', // Default border color
     textAlign: 'center',
     borderRadius: 5,
     overflow: 'hidden', // Ensures border radius applies correctly
     backgroundColor: '#f0f0f0', // Slightly grey background for cells
   },
   focusCell: {
     borderColor: '#007bff', // Highlight color when focused
     backgroundColor: '#e0e0e0', // Slightly lighter background when focused
   },
   cellError: { // Style for cells if there's a form validation error on 'pin'
      borderColor: '#dc3545',
   },
  // --- End CodeField Styles ---

  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    width: '100%',
    maxWidth: 250,
    marginTop: 20,
    flexDirection: 'row', // To center spinner and text
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendLink: { // Style for resend link
     fontSize: 14,
     color: '#007bff',
     textDecorationLine: 'underline',
     marginTop: 15,
  },
  // --- Styles for 'Return to sign in' button ---
   returnButton: {
      marginTop: 15,
      paddingVertical: 10,
   },
   returnButtonText: {
      fontSize: 14,
      color: '#666',
      textDecorationLine: 'underline',
      textAlign: 'center', // Center the return link text
   }
});

export default MfaVerificationScreen;