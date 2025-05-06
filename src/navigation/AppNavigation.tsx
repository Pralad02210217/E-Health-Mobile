// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native'; // Import TouchableOpacity
import { useAuthContext } from '../context/auth-context';

import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/users/HomeScreen';
import FeedsScreen from '../screens/users/FeedsScreen';
import MfaVerificationScreen from '../screens/auth/MfaVerificationScreen';
import Header from '../components/Header';
import VerifyLeavesScreen from '../screens/users/VerifyLeavesScreen';


// Import vector icons
import Ionicons from 'react-native-vector-icons/Ionicons'; // <-- Import Ionicons
import ProfileScreen from '../screens/users/ProfileScrenn';
import StudentHealthVisitsScreen from '../screens/users/StudentHealthVisitsScreen';


// Define your RootStackParamList for the main Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string };
  MfaVerification: { email: string };
  AuthenticatedFlow: undefined;
};


// Define a type for the screens within the AuthenticatedFlow Stack Navigator
export type AuthenticatedFlowStackParamList = {
    MainTabs: undefined;
    // Add screens here that are navigated TO from tabs and appear above them
    // Example: Settings screen, Profile Detail screen
    // Settings: undefined;
    // TreatmentDetail: { treatmentId: string };
    Profile: undefined; // Profile is in this stack
};


// Define a type for the screens that will be in the bottom tabs
export type AuthenticatedTabParamList = {
  HomeTab: undefined;
  FeedsTab: undefined;
  VerifyLeavesTab?: undefined;
  // Add other tabs here later
  // ProfileTab: undefined; // Profile is NOT a tab screen anymore
};


const MainStack = createNativeStackNavigator<RootStackParamList>();
const AuthenticatedFlowStack = createNativeStackNavigator<AuthenticatedFlowStackParamList>();
const Tab = createBottomTabNavigator<AuthenticatedTabParamList>();


// Component that defines the Tab Navigator (Bottom Tabs)
function AuthenticatedTabs() {
  const { user } = useAuthContext();
  const showVerifyLeavesTab = user?.userType !== "STUDENT";

  return (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            // Optional: Customize the tab bar style here
        }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
           // tabBarIcon: ({ color, size }) => ( /* ... */ ),
            tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: color }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>H</Text>
            </View>
            ),
          }}
          />
          <Tab.Screen
          name="FeedsTab"
          component={FeedsScreen}
          options={{
            title: 'Feeds',
            tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, borderRadius: 4, backgroundColor: color }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>F</Text>
            </View>
            ),
          }}
          />
          {showVerifyLeavesTab && (
          <Tab.Screen
            name="VerifyLeavesTab"
            component={StudentHealthVisitsScreen}
            options={{
            title: 'Verify Leaves',
            tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, borderRadius: 4, backgroundColor: color }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>V</Text>
            </View>
            ),
             // tabBarIcon: ({ color, size }) => ( /* ... */ ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Component that defines the Stack Navigator for the authenticated part (with Header)
function AuthenticatedFlow() {
  return (
    <AuthenticatedFlowStack.Navigator
       screenOptions={{
         headerShown: true,

         // --- Use your custom Header component ---
         header: ({ navigation, route, options, back }) => (
             // Render your Header component
             <Header
               title={options.title}
               navigation={navigation} // <-- Pass navigation
               route={route} // Optional: pass route if Header needs it
               back={back} // <-- Pass back prop
               // navigation available via hook in Header.tsx
             />
         ),
       }}
    >
      {/* MainTabs screen (renders the bottom tabs) */}
      <AuthenticatedFlowStack.Screen
        name="MainTabs"
        component={AuthenticatedTabs}
        options={{
          title: 'Dashboard', // Title for the header when on the tabs screen
          headerShown: true,
        }}
      />

      {/* --- Profile Screen Definition --- */}
      <AuthenticatedFlowStack.Screen
         name="Profile"
         component={ProfileScreen}
         options={({ navigation }) => ({ // Use a function to access navigation
            title: 'My Profile', // Title for the header when on the Profile screen
            headerShown: true,

         })}
       />


      {/* Add other screens here that are part of the authenticated flow */}
      {/* <AuthenticatedFlowStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerShown: true }} /> */}
       {/* <AuthenticatedFlowStack.Screen name="TreatmentDetail" component={TreatmentDetailScreen} options={{ title: 'Treatment Details', headerShown: true }} /> */}


    </AuthenticatedFlowStack.Navigator>
  );
}


// Main App Navigator function
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ... other styles ...
});


export default AppNavigator;