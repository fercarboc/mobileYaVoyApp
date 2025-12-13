import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/services/supabase';
import { AuthService } from './src/services/api';
import { User } from './src/types';

// Screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import CompleteProfileScreen from './src/screens/Worker/CompleteProfileScreen';
import MainNavigator from './src/navigation/MainNavigator';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  CompleteProfile: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        
        // Check if worker needs to complete profile
        if (currentUser && currentUser.role === 'WORKER') {
          const { data: profile } = await supabase
            .from('VoyUsers')
            .select('phone, document_number, document_photo_url, selfie_photo_url')
            .eq('auth_user_id', session?.user?.id)
            .single();
          
          console.log('[App] Profile data after login:', profile);
          const isIncomplete = !profile?.phone || !profile?.document_number || 
                              !profile?.document_photo_url || !profile?.selfie_photo_url;
          console.log('[App] Profile incomplete after login:', isIncomplete);
          setNeedsProfileCompletion(isIncomplete);
        } else {
          setNeedsProfileCompletion(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setNeedsProfileCompletion(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      console.log('[App] Initial auth check:', currentUser?.email || 'Not logged in');
      setUser(currentUser);
      
      // Check if worker needs to complete profile
      if (currentUser && currentUser.role === 'WORKER') {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('VoyUsers')
            .select('phone, document_number, document_photo_url, selfie_photo_url')
            .eq('auth_user_id', authUser.id)
            .single();
          
          console.log('[App] Profile data:', profile);
          const isIncomplete = !profile?.phone || !profile?.document_number || 
                              !profile?.document_photo_url || !profile?.selfie_photo_url;
          console.log('[App] Profile incomplete:', isIncomplete);
          setNeedsProfileCompletion(isIncomplete);
        }
      } else {
        setNeedsProfileCompletion(false);
      }
    } catch (error) {
      console.error('[App] Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // TODO: Add splash screen
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {user ? (
            needsProfileCompletion ? (
              <Stack.Screen 
                name="CompleteProfile"
                component={CompleteProfileScreen}
              />
            ) : (
              <Stack.Screen 
                name="Main"
              >
                {() => <MainNavigator userRole={user.role} />}
              </Stack.Screen>
            )
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
