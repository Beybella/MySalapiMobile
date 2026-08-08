import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          height: 75,
          paddingBottom: 12,
          paddingTop: 10,
          position: 'absolute',
          bottom: 16,
          left: '8%',
          right: '8%',
          borderRadius: 50,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      {/* Center button for quick spending entry */}
      <Tabs.Screen
        name="quick-add"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity 
              style={{
                top: -28,
                justifyContent: 'center',
                alignItems: 'center',
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
              }}
              onPress={() => router.push('/(tabs)/quick-add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={44} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budgeting',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      
      {/* Hidden legacy tabs - kept for backwards compatibility but not shown in navigation */}
      <Tabs.Screen
        name="personal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pautang"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ambagan"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
