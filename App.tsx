import React from 'react';
import QueryProvider from './src/context/query-context';
import { AuthProvider } from './src/context/auth-context';
import AppNavigator from './src/navigation/AppNavigation';
import { MenuProvider } from 'react-native-popup-menu';

function App(): React.JSX.Element {
  return (
    <MenuProvider>
      <QueryProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </QueryProvider>
    </MenuProvider>
  );
}

export default App;
