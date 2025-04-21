import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useAuthContext } from '../context/auth-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
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
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuthContext();
  const navigation = useNavigation();

  const userType = user?.userType;
  const available = user?.is_available;
  const isOnLeave = user?.is_onLeave;
  const HAContactNumber = user?.HA_Contact_Number || '17980451';

  const showRightIcon = true;

  const availabilityTextColor = available ? '#155724' : '#721c24';
  const availabilityBackgroundColor = available ? '#d4edda' : '#f8d7da';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
          <Text style={styles.headerTitle}>{title || 'Dashboard'}</Text>
      </View>

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
              <MenuOption onSelect={() => {}}>
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
    fontSize: 16,
  },
});

export default Header;
