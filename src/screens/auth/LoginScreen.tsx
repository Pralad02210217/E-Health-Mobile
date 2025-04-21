// src/screens/LoginScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
// Import necessary hooks and libraries for form handling and validation
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Import your AuthContext hook

// Import useNavigation for navigation links
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuthContext } from '../../context/auth-context';
import Logo from '../../components/Logo';
import { RootStackParamList } from '../../navigation/AppNavigation';
// Define your RootStackParamList if you haven't already in your navigator types file
// import { RootStackParamList } from '../navigation/AppNavigator'; // Assuming you have this


// Define the Zod schema for validation (matches your web schema)
const loginFormSchema = z.object({
  email: z.string().trim().email("Invalid email address").min(1, "Email is required").max(255).regex(/^[a-zA-Z0-9._%+-]+@rub\.edu\.bt$/,
    { message: "Email must be from cst.@rub.edu.bt domain" }), // Adjust regex if needed
  password: z.string().trim().min(6, {
    message: "Minimum Password length is 6",
  }),
});

// Define type for the form data
type LoginFormValues = z.infer<typeof loginFormSchema>;

// Define type for navigation prop (adjust if using a different navigator structure)
// type LoginScreenNavigationProp = NavigationProp<RootStackParamList, 'Login'>; // Assuming 'Login' is the route name


const LoginScreen = () => {
  // Get login, isLoading, isAuthenticated, and error from AuthContext
  const { login, isLoading, isAuthenticated, error } = useAuthContext();
  // Get navigation prop for navigating to other screens
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); 


  // Initialize react-hook-form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema), // Use Zod resolver
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Destructure form methods
  const { control, handleSubmit, formState, getValues } = form;
  const { errors } = formState; // Get validation errors

  // State for displaying API error message (will be controlled by AuthContext error)
  // const [localError, setLocalError] = useState<string | null>(null); // No longer need local error state, use context error

  // Effect to display API error from AuthContext
  useEffect(() => {
    if (error) {

      console.error('LoginScreen: API Error from AuthContext', error);
     
    } else {
    }
  }, [error]); // Depend on AuthContext error state


// In LoginScreen.tsx
const onSubmit = async (values: LoginFormValues) => {
  try {
    await login(values);
  } catch (err: any) {
    if (err.message.includes('MFA_REQUIRED')) {
      navigation.navigate('MfaVerification', { email: values.email });
    } else {
      // Handle other errors
      console.log('Standard login error:', err);
    }
  }
};

  // --- Add logic for "Verify Email First" and Resend if needed ---
  // (We'll add this in a later step, requires a new mutation hook and state)
  // const [showResendOption, setShowResendOption] = useState(false);
  // const { mutate: resendVerification, isPending: isResending } = useMutation(...)
  // useEffect(() => { // Effect to check AuthContext error for resend message
  //   if (error?.message?.includes("Verify your email first")) {
  //     setShowResendOption(true);
  //   } else {
  //     setShowResendOption(false);
  //   }
  // }, [error]);


  return (
    // SafeAreaView helps content avoid status bar/notches
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Your Logo Component here */}
        <Logo />
        <Text style={styles.title}>Log in to E-Health CST</Text>
        <Text style={styles.subtitle}>
          Don't have an account?{" "}
          {/* Add Sign Up Link */}
          <Text
            style={styles.link}
            // onPress={() => navigation.navigate('SignUp')} // Assuming 'SignUp' route exists
          >
            Sign up
          </Text>
          .
        </Text>

        {/* Display API Error Message from AuthContext */}
        {error && ( // Only render if there's an error in AuthContext
          <Text style={styles.apiErrorText}>
            {error.message || 'An unexpected error occurred.'}
          </Text>
        )}


        {/* Use form.handleSubmit to integrate with react-hook-form validation */}
        <View style={styles.form}>
          {/* Email Field */}
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]} // Apply error styling
                placeholder="subscribeto@channel.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {/* Display Validation Error Message */}
          {errors.email && <Text style={styles.validationErrorText}>{errors.email.message}</Text>}

          {/* Password Field */}
           <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]} // Apply error styling
                placeholder="••••••••••••"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry // Hide password
              />
            )}
          />
           {/* Display Validation Error Message */}
          {errors.password && <Text style={styles.validationErrorText}>{errors.password.message}</Text>}


          {/* Forgot Password / Resend Verification Section */}
          {/* We'll add the conditional rendering for 'Resend' later */}
           <View style={styles.forgotPasswordContainer}>
             {/* Add Forgot Password Link */}
             {/* <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword', { email: getValues('email') })}> 
               <Text style={styles.forgotPasswordLink}>Forgot your password?</Text>
             </TouchableOpacity> */}
           </View>
           {/* Placeholder for Resend Verification button */}
           {/* {showResendOption && (
             <TouchableOpacity onPress={() => resendVerification({ email: getValues('email') })} disabled={isResending}>
               <Text style={styles.resendLink}>{isResending ? "Resending..." : "Resend Verification Link?"}</Text>
             </TouchableOpacity>
           )} */}


          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)} // Use handleSubmit to trigger validation before onSubmit
            disabled={isLoading} // Disable button while loading (from AuthContext)
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" /> // Show spinner while loading
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
          
        </View>
        <View>
          
        </View>

        {/* Terms of Service/Privacy Policy Text */}
         <Text style={styles.termsText}>
            By signing in, you agree to our{" "}
            <Text style={styles.link} onPress={() => {/* Navigate to Terms */}}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={styles.link} onPress={() => {/* Navigate to Privacy */}}>
              Privacy Policy
            </Text>.
          </Text>


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24, // Slightly smaller title for mobile
    fontWeight: 'bold',
    marginBottom: 8, // Less margin than web
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20, // Add some space below subtitle
    textAlign: 'center',
  },
  link: {
    color: '#007bff', // Standard link color
    fontWeight: 'bold', // Make links stand out
  },
  apiErrorText: {
    color: '#dc3545', // Red for errors
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  form: {
    width: '100%', // Form takes full width
    maxWidth: 350, // Max width like web version
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
    marginTop: 10, // Space above label
  },
  input: {
    height: 40, // Standard input height
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#dc3545', // Red border for error
  },
  validationErrorText: {
    fontSize: 12,
    color: '#dc3545', // Red for validation errors
    marginTop: 4,
  },
   forgotPasswordContainer: {
     width: '100%',
     alignItems: 'flex-end', // Align link to the right
     marginTop: 5,
     marginBottom: 15, // Space below link
   },
  forgotPasswordLink: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline', // Underline link
  },
   resendLink: { // Style for resend link if implemented later
     fontSize: 14,
     color: '#007bff',
     textDecorationLine: 'underline',
     marginTop: 5,
     textAlign: 'center',
     width: '100%',
   },
  button: {
    backgroundColor: '#007bff', // Blue button color
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center', // Center text
    justifyContent: 'center', // Center spinner
    height: 45, // Button height
    flexDirection: 'row', // Arrange spinner and text inline
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0', // Grey color when disabled
  },
  buttonText: {
    color: '#fff', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
   termsText: {
     fontSize: 12,
     color: '#666',
     marginTop: 20,
     textAlign: 'center',
   }
});

export default LoginScreen;