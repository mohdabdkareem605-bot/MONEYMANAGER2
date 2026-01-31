import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { LayoutDashboard, Users, Plus, Receipt, User } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../src/constants/theme';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : COLORS.white,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          ...SHADOWS.soft,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -5,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
             <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
          ) : null
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                ...SHADOWS.medium,
                transform: [{ translateY: -10 }],
              }}
            >
              <Plus size={32} color={COLORS.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Receipt size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
