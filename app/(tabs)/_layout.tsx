import { Tabs, Redirect } from "expo-router";
import { Clock, LayoutDashboard, FolderKanban, Users, FileText } from "lucide-react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";

export default function TabLayout() {
  const { currentUser, isInitialized } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href="/login" />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.white,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
      }}
    >
      {isAdmin ? (
        <>
          <Tabs.Screen
            name="admin-dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="projects"
            options={{
              title: "Projects",
              tabBarIcon: ({ color }) => <FolderKanban size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              title: "Users",
              tabBarIcon: ({ color }) => <Users size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="admin-logs"
            options={{
              title: "Logs",
              tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
            }}
          />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="home"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="time-logs"
            options={{
              title: "Time Logs",
              tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) => <Users size={24} color={color} />,
            }}
          />
        </>
      )}
      
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="admin-logs"
        options={{
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: !isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="time-logs"
        options={{
          href: !isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: !isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
