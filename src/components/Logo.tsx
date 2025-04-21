// src/components/Logo.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
// Import useNavigation hook for navigation
import { useNavigation, NavigationProp } from '@react-navigation/native';
// Define your RootStackParamList if you haven't already in your navigator types file
// import { RootStackParamList } from '../navigation/AppNavigator'; // Assuming you have this


// Define prop types for the Logo component
interface LogoProps {
  // url will map to a route name in React Navigation, or null/undefined if not tappable
  routeName?: string | null;
  size?: number; // size will map to height in number (React Native units)
  fontSize?: number; // fontSize in number (React Native units)
  containerStyle?: ViewStyle; // Optional style for the outer View
  linkStyle?: ViewStyle; // Optional style for the TouchableOpacity
  textStyle?: TextStyle; // Optional style for the Text
}

// Define type for navigation prop (adjust if using a different navigator structure)
// type LogoNavigationProp = NavigationProp<RootStackParamList, any>; // 'any' or specify applicable screens


const Logo: React.FC<LogoProps> = (props) => {
  // Default values for props
  const { routeName = null, size = 40, fontSize = 24, containerStyle, linkStyle, textStyle } = props;

  // Get navigation prop
  const navigation = useNavigation(); // Type assertion might be needed depending on your setup

  // Handle press event - navigate if routeName is provided
  const handlePress = () => {
    // if (routeName) {
    //   // Use navigation.navigate to go to the specified route
    //   // You could also use navigation.replace if needed
    //   navigation.navigate(routeName); // Type assertion might be needed
    // }
  };

  return (
    // View replaces the outer div
    <View style={[styles.container, containerStyle]}>
      {/* TouchableOpacity replaces the Link, makes the area tappable */}
      {/* Disable the press effect if no routeName is provided */}
      <TouchableOpacity
        style={[styles.link, linkStyle, { height: size }]} // Apply default/passed styles, set height from size prop
        onPress={handlePress} // Call handlePress on press
        disabled={!routeName} // Disable if routeName is null or undefined
        activeOpacity={0.8} // Reduce opacity slightly on press
      >
        {/* Text replaces the span */}
        <Text style={[styles.text, textStyle, { fontSize: fontSize }]}> {/* Apply default/passed styles, set fontSize */}
          E-Health CST
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Equivalent to 'flex items-center justify-center sm:justify-start'
    flexDirection: 'row', // Arrange children in a row
    alignItems: 'center', // Center vertically
    justifyContent: 'center', // Center horizontally (can be overridden by containerStyle)
    // If you need sm:justify-start equivalent, you might need to pass a style prop
  },
  link: {
    // Styles for the tappable area (the "button" part of the logo)
    // Equivalent to 'rounded-lg flex items-center border-2 dark:border-gray-200 justify-center
    // bg-gradient-to-br from-blue-500 to-primary to-90%'
    borderRadius: 8, // Approximate rounded-lg
    // Border: You had border-2, can add a border style if desired
    // borderColor: 'gray', // Example border color
    // borderWidth: 2, // Example border width

    // Gradient: Gradients require a library (e.g., react-native-linear-gradient).
    // For simplicity, using a solid background color that approximates the gradient start.
    backgroundColor: '#3b82f6', // Equivalent to a shade of blue

    flexDirection: 'row', // Items inside are row
    alignItems: 'center', // Center text vertically inside the link
    justifyContent: 'center', // Center text horizontally inside the link

    width: 220, // Fixed width from web example
    // Height is set dynamically by the 'size' prop in the component
  },
  text: {
    // Styles for the text "E-Health CST"
    // Equivalent to 'font-bold text-gray-50'
    fontWeight: 'bold', // Make font bold
    color: '#f9fafb', // Equivalent to gray-50 (off-white)
    // FontSize is set dynamically by the 'fontSize' prop in the component
  },
});

export default Logo;