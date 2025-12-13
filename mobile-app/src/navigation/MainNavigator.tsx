import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { UserRole } from '@/types';

// Worker Screens
import WorkerHomeScreen from '../screens/Worker/HomeScreen';
import MyJobsScreen from '../screens/Worker/MyJobsScreen';
import WorkerProfileScreen from '../screens/Worker/ProfileScreen';
import JobDetailScreen from '../screens/Worker/JobDetailScreen';
import ChatsScreen from '../screens/Worker/ChatsScreen';
import WorkerEconomicsScreen from '../screens/Worker/EconomicsScreen';

// Company Screens
import CompanyHomeScreen from '../screens/Company/CompanyHomeScreen';
import MyAdsScreen from '../screens/Company/MyAdsScreen';
import CreateJobScreen from '../screens/Company/CreateJobScreen';
import SubscriptionsScreen from '../screens/Company/SubscriptionsScreen';
import EconomicsScreen from '../screens/Company/EconomicsScreen';
import CompanyProfileScreen from '../screens/Company/CompanyProfileScreen';
import CandidatesScreen from '../screens/Company/CandidatesScreen';

// Chat Screen
import ChatScreen from '../screens/Chat/ChatScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminProfileScreen from '../screens/Admin/AdminProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  MyJobs: undefined;
  Chats: undefined;
  MyAds: undefined;
  Candidates: undefined;
  Subscriptions: undefined;
  Economics: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  JobDetail: { jobId: string };
  Chat: { jobId: string; otherUserId: string; otherUserName: string };
};

export type MyJobsStackParamList = {
  MyJobsList: undefined;
  Chat: { jobId: string; otherUserId: string; otherUserName: string };
};

export type MyAdsStackParamList = {
  MyAdsList: undefined;
  CreateJob: undefined;
};

export type CandidatesStackParamList = {
  CandidatesList: undefined;
  Chat: { jobId: string; otherUserId: string; otherUserName: string };
};

export type ChatsStackParamList = {
  ChatsList: undefined;
  Chat: { jobId: string; otherUserId: string; otherUserName: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MyJobsStack = createNativeStackNavigator<MyJobsStackParamList>();
const MyAdsStack = createNativeStackNavigator<MyAdsStackParamList>();
const CandidatesStack = createNativeStackNavigator<CandidatesStackParamList>();
const ChatsStack = createNativeStackNavigator<ChatsStackParamList>();

// Worker Home Stack with Job Detail and Chat
function WorkerHomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeList" 
        component={WorkerHomeScreen}
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
      <HomeStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

// Worker MyJobs Stack with Chat
function MyJobsStackNavigator() {
  return (
    <MyJobsStack.Navigator>
      <MyJobsStack.Screen 
        name="MyJobsList" 
        component={MyJobsScreen}
        options={{ headerShown: false }}
      />
      <MyJobsStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </MyJobsStack.Navigator>
  );
}

// Candidates Stack with Chat
function CandidatesStackNavigator() {
  return (
    <CandidatesStack.Navigator>
      <CandidatesStack.Screen 
        name="CandidatesList" 
        component={CandidatesScreen}
        options={{ headerShown: false }}
      />
      <CandidatesStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </CandidatesStack.Navigator>
  );
}

// Chats Stack Navigator (for WORKER)
function ChatsStackNavigator() {
  return (
    <ChatsStack.Navigator>
      <ChatsStack.Screen 
        name="ChatsList" 
        component={ChatsScreen}
        options={{ headerShown: false }}
      />
      <ChatsStack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </ChatsStack.Navigator>
  );
}

// MyAds Stack Navigator (for COMPANY)
function MyAdsStackNavigator() {
  return (
    <MyAdsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MyAdsStack.Screen 
        name="MyAdsList" 
        component={MyAdsScreen}
        options={{ title: 'Mis Anuncios' }}
      />
      <MyAdsStack.Screen 
        name="CreateJob" 
        component={CreateJobScreen}
        options={{ title: 'Crear Anuncio' }}
      />
    </MyAdsStack.Navigator>
  );
}
// Worker Navigator
function WorkerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: 35,
          paddingTop: 8,
          height: 90,
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
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Economics') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={WorkerHomeStackNavigator}
        options={{ tabBarLabel: 'Trabajos' }}
      />
      <Tab.Screen 
        name="MyJobs" 
        component={MyJobsStackNavigator}
        options={{ tabBarLabel: 'Mis Ofertas' }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsStackNavigator}
        options={{ tabBarLabel: 'Chats' }}
      />
      <Tab.Screen 
        name="Economics" 
        component={WorkerEconomicsScreen}
        options={{ tabBarLabel: 'Económico' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={WorkerProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Company/Particular Navigator
function CompanyNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: 35,
          paddingTop: 8,
          height: 90,
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
          } else if (route.name === 'MyAds') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          } else if (route.name === 'Candidates') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Subscriptions') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Economics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={CompanyHomeScreen}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name="MyAds" 
        component={MyAdsStackNavigator}
        options={{ tabBarLabel: 'Anuncios' }}
      />
      <Tab.Screen 
        name="Candidates" 
        component={CandidatesStackNavigator}
        options={{ tabBarLabel: 'Candidatos' }}
      />
      <Tab.Screen 
        name="Subscriptions" 
        component={SubscriptionsScreen}
        options={{ tabBarLabel: 'Bonos' }}
      />
      <Tab.Screen 
        name="Economics" 
        component={EconomicsScreen}
        options={{ tabBarLabel: 'Datos' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={CompanyProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Admin Navigator
function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: 35,
          paddingTop: 8,
          height: 90,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'grid';

          if (route.name === 'Home') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={AdminProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Main Navigator - selects appropriate navigator based on user role
export default function MainNavigator({ userRole }: { userRole?: UserRole }) {
  if (userRole === 'ADMIN') {
    return <AdminNavigator />;
  } else if (userRole === 'COMPANY' || userRole === 'PARTICULAR') {
    return <CompanyNavigator />;
  } else {
    // Default to Worker navigator for HELPER role or undefined
    return <WorkerNavigator />;
  }
}
