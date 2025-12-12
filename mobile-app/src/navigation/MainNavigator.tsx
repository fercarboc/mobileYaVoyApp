import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

// Screens
import HomeScreen from '../screens/Worker/HomeScreen';
import MyJobsScreen from '../screens/Worker/MyJobsScreen';
import ProfileScreen from '../screens/Worker/ProfileScreen';
import JobDetailScreen from '../screens/Worker/JobDetailScreen';

export type MainTabParamList = {
  Home: undefined;
  MyJobs: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  JobDetail: { jobId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// Home Stack with Job Detail
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeList" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={{ 
          headerShown: true,
          headerTitle: 'Detalle del Trabajo',
          headerBackTitle: 'Volver',
          headerTintColor: COLORS.primary,
        }}
      />
    </HomeStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyJobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Trabajos' }}
      />
      <Tab.Screen 
        name="MyJobs" 
        component={MyJobsScreen}
        options={{ tabBarLabel: 'Mis Ofertas' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
