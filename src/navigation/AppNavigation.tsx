// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuthContext } from '../context/auth-context'; // Import useAuthContext

import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/users/HomeScreen';
import FeedsScreen from '../screens/users/FeedsScreen';
import MfaVerificationScreen from '../screens/auth/MfaVerificationScreen';
import Header from '../components/Header'; // Import your custom Header component
import VerifyLeavesScreen from '../screens/users/VerifyLeavesScreen';

// Import the new screen component for the conditional tab
// <-- Import the new screen


// Import vector icons if you plan to use them for tab icons
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


// Define your RootStackParamList for the main Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined; // Add if you have a SignUp screen
  ForgotPassword: { email?: string }; // Add if you have a Forgot Password screen
  MfaVerification: { email: string };
  // The AuthenticatedFlow stack is a screen in the main stack
  AuthenticatedFlow: undefined; // The AuthenticatedFlow component takes no params
};


// Define a type for the screens within the AuthenticatedFlow Stack Navigator
export type AuthenticatedFlowStackParamList = {
    MainTabs: undefined; // The screen that renders the Tab Navigator
    // Add screens here that are navigated TO from tabs and appear above them
    // Example: Settings screen, Profile Detail screen
    // Settings: undefined;
    // ProfileDetail: { userId: string };
};


// Define a type for the screens that will be in the bottom tabs
export type AuthenticatedTabParamList = {
  HomeTab: undefined; // Name of the Home tab route (maps to HomeScreen component)
  FeedsTab: undefined; // Name of the Feeds tab route (maps to FeedsScreen component)
  VerifyLeavesTab?: undefined; // <-- Add this. Make it optional (?) because it's conditionally rendered.
  // Add other tabs here later (e.g., ProfileTab, SettingsTab)
  // ProfileTab: undefined;
};


const MainStack = createNativeStackNavigator<RootStackParamList>(); // Main stack: auth flow vs authenticated flow stack
const AuthenticatedFlowStack = createNativeStackNavigator<AuthenticatedFlowStackParamList>(); // New stack for authenticated part: manages header
const Tab = createBottomTabNavigator<AuthenticatedTabParamList>(); // Tab navigator: manages bottom tabs


// Component that defines the Tab Navigator (Bottom Tabs)
function AuthenticatedTabs() {
  // Access the authenticated user data here to conditionally render tabs
  const { user } = useAuthContext(); // <-- Get user data

  // Determine if the 'Verify Leaves' tab should be shown based on userType
  const showVerifyLeavesTab = user?.userType !== "STUDENT"; // <-- Conditional logic


  return (
    // Define the Tab Navigator itself
    <Tab.Navigator
        screenOptions={{
            headerShown: false, // Hide headers defined by the Tab navigator itself
            // Optional: Customize the tab bar style here
            // tabBarActiveTintColor: 'blue',
            // tabBarInactiveTintColor: 'gray',
            // tabBarStyle: { backgroundColor: '#f0f0f0' },
        }}
    >
      {/* Define each screen that will be a tab */}
      <Tab.Screen
        name="HomeTab" // Name of this route in the Tab Navigator
        component={HomeScreen} // The component to render for this tab
        options={{
          title: 'Home', // Title shown in the tab bar
          // Add icon here using 'tabBarIcon'. Requires vector icons library.
           // tabBarIcon: ({ color, size }) => (
           //   <Ionicons name="home-outline" color={color} size={size} /> // Example using Ionicons
           // ),
        }}
      />
      <Tab.Screen
        name="FeedsTab" // Name of this route
        component={FeedsScreen} // Component for this tab
        options={{
          title: 'Feeds', // Title shown in the tab bar
           // tabBarIcon: ({ color, size }) => (
           //   <MaterialIcons name="dynamic-feed" color={color} size={size} /> // Example using MaterialIcons
           // ),
        }}
      />
      {/* --- Conditionally render the 'Verify Leaves' tab --- */}
      {/* Render the Tab.Screen only if showVerifyLeavesTab is true */}
      {showVerifyLeavesTab && (
        <Tab.Screen
          name="VerifyLeavesTab" // Name for this tab route
          component={VerifyLeavesScreen} // The component for this tab
          options={{
            title: 'Verify Leaves', // Title shown in the tab bar
             // Add icon here using 'tabBarIcon'. Requires vector icons library.
             // tabBarIcon: ({ color, size }) => (
             //   <MaterialIcons name="check-circle-outline" color={color} size={size} /> // Example check icon
             // ),
          }}
        />
      )}
      {/* --- End Conditional Tab --- */}

      {/* Add other static Tab.Screen definitions here if any */}
      {/* <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', /* icon * / }} /> */}
    </Tab.Navigator>
  );
}

// Component that defines the Stack Navigator for the authenticated part (with Header)
function AuthenticatedFlow() {
  return (
    // Define the Stack Navigator that wraps the tabs for the header
    <AuthenticatedFlowStack.Navigator
       screenOptions={{
         headerShown: true,

         // --- Use your custom Header component ---
         header: ({ navigation, route, options, back }) => (
             // Render your Header component here
             <Header
               title={options.title} // Pass the screen title (e.g., 'Dashboard')
               // You can pass navigation or other props if your Header component uses them
               // navigation={navigation}
               // route={route}
               // options={options}
               // back={back}
             />
         ),
         // Optional: Define common header styles here if not using a fully custom 'header' component
         // headerStyle: { backgroundColor: '#007bff' },
         // headerTintColor: '#fff',
         // headerTitleStyle: { fontWeight: 'bold' },
       }}
    >
      {/* The AuthenticatedTabs component is the first (and often only) screen in this stack */}
      {/* Its header is defined by the AuthenticatedFlowStack screenOptions or its own options */}
      <AuthenticatedFlowStack.Screen
        name="MainTabs" // Name for the screen that holds the tabs in this stack
        component={AuthenticatedTabs} // Use the component that contains the Tab Navigator
        options={{
          // Options specifically for the 'MainTabs' screen
          title: 'Dashboard', // This title is passed to the Header component
          headerShown: true, // Ensure header is shown for this screen (overrides screenOptions if set to false)

          // If you want a COMPLETELY custom header just for this screen (replacing the one in screenOptions)
          // You would uncomment and use the 'header' prop here instead:
          // header: ({ navigation, route, options, back }) => <YourCustomHeaderComponent {...} />,
        }}
      />
      {/* Add other screens here that are part of the authenticated flow
          but should appear ABOVE the tabs in the stack history (e.g., Settings, Profile Details) */}
      {/* <AuthenticatedFlowStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerShown: true }} /> */}

    </AuthenticatedFlowStack.Navigator>
  );
}


// Main App Navigator function
function AppNavigator() {
  // Get the authentication state from your AuthContext
  const { isAuthenticated, isLoading } = useAuthContext();

  // While the app is checking for a stored session, show a loading indicator
  // This check should happen quickly on app start
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render the main Stack Navigator based on authentication state
  return (
    <NavigationContainer>
      {/* The main Stack Navigator handles switching between auth flow and authenticated tabs */}
      {/* screenOptions here apply to all screens in THIS stack (MainStack) */}
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // User is authenticated
          <MainStack.Screen
            name="AuthenticatedFlow"
            component={AuthenticatedFlow}
            options={{ headerShown: false }}
          />
        ) : (
          // User is NOT authenticated
          <React.Fragment>
            <MainStack.Screen name="Login" component={LoginScreen} />
            <MainStack.Screen name="MfaVerification" component={MfaVerificationScreen}/>
            {/* Add other auth screens like Sign Up, Forgot Password here */}
          </React.Fragment>
        )}
      </MainStack.Navigator>
    </NavigationContainer>
  );
}

// Add styles for the placeholder header and loading view (kept for safety, though Header component manages its own styles)
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles below are for the OLD placeholder header, the Header component has its own styles now
  // headerContainer: {
  //   height: 60,
  //   backgroundColor: '#f0f0f0',
  //   justifyContent: 'center',
  //   paddingHorizontal: 15,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#ccc',
  // },
  // headerTitle: {
  //   fontWeight: 'bold',
  //   fontSize: 18,
  //   color: '#333',
  // },
});


export default AppNavigator;