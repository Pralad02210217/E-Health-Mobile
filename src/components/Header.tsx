import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { useAuthContext } from '../context/auth-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const formatDate = (dateString: any) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date string for formatting:', dateString);
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-GB');
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Error';
  }
};

interface HeaderProps {
  title?: string;
  navigation: NavigationProp<ParamListBase>; // Type navigation broadly or specifically
  route: RouteProp<ParamListBase>; // Type route broadly or specifically
  back?: { title?: string; href?: string } | null;
}

const Header: React.FC<HeaderProps> = ({ title, back }) => {
  const { user, logout } = useAuthContext();
  const navigation = useNavigation<NavigationProp<any>>();

  const userType = user?.userType;
  const available = user?.is_available;
  const isOnLeave = user?.is_onLeave;
  const HAContactNumber = user?.HA_Contact_Number || '17980451';

  const showRightIcon = true;

  const availabilityTextColor = available ? '#155724' : '#721c24';
  const availabilityBackgroundColor = available ? '#d4edda' : '#f8d7da';

  return (
    <View style={styles.headerContainer}>
      {back ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ): (
        <View style={styles.leftSection}>
        {/* <Text style={styles.headerTitle}>{title || ''}</Text> */}
      </View>

      )}
     
      <View style={styles.centerSection}></View>

      <View style={styles.rightSection}>
        {userType && (
          <View
            style={[
              styles.badge,
              { backgroundColor: availabilityBackgroundColor },
            ]}
          >
            {isOnLeave ? (
              <Text style={[styles.badgeText, { color: availabilityTextColor }]}>
                On Leave from {formatDate(user?.start_date)} to {formatDate(user?.end_date)}
              </Text>
            ) : (
              <Text style={[styles.badgeText, { color: availabilityTextColor }]}>
                {available ? 'HA Available 🟢 ' : 'HA Briefly Unavailable 🔴 '}
                {user?.HA_Contact_Number!== '' ? user?.HA_Contact_Number : "17980451"}
              </Text>
            )}
          </View>
        )}

        {showRightIcon && (
          <Menu>
            <MenuTrigger>
              <MaterialCommunityIcons
                name="account-circle" // for profile settings
                size={26}
                color="#333"
                style={styles.icon}
              />
            </MenuTrigger>
            <MenuOptions>
              <MenuOption onSelect={() => {
                  console.log('Profile menu option selected, navigating to Profile');
                  navigation.navigate('Profile'); 
              }}>
                <Text style={styles.menuItem}>Profile</Text>
              </MenuOption>
              <MenuOption onSelect={logout}>
                <Text style={styles.menuItem}>Logout</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {},
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItem: {
    padding: 10,
    color: "#000",
    fontSize: 16,
  },
  iconContainer: { // Wrapper for icons to add consistent padding/margin
    padding: 5, // Make touchable area larger
  },
  backButton: {
    paddingVertical: 5, // Add some vertical padding
    paddingHorizontal: 10, // Add horizontal padding
    marginLeft: -5, // Adjust margin if needed to align with padding
    justifyContent: 'center', // Center text vertically if button has height
    alignItems: 'center', // Center text horizontally
  },
  backText: {
      fontSize: 16, // Font size for the text
      color: '#007bff', // A common color for interactive text/buttons
      // fontWeight: 'bold', // Optional: make text bold
  },
});

export default Header;
