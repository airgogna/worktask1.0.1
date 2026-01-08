import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { User, LogOut, Calendar } from 'lucide-react-native';

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={48} color={colors.white} />
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vacation Balance</Text>
          <View style={styles.vacationCard}>
            <View style={styles.vacationItem}>
              <Calendar size={32} color={colors.primary} />
              <View style={styles.vacationDetails}>
                <Text style={styles.vacationValue}>
                  {currentUser.vacationDaysTotal - currentUser.vacationDaysUsed}
                </Text>
                <Text style={styles.vacationLabel}>Days Remaining</Text>
              </View>
            </View>
            <View style={styles.vacationDivider} />
            <View style={styles.vacationItem}>
              <Calendar size={32} color={colors.success} />
              <View style={styles.vacationDetails}>
                <Text style={styles.vacationValue}>{currentUser.vacationDaysTotal}</Text>
                <Text style={styles.vacationLabel}>Total Days</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.white} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  vacationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    ...shadows.md,
  },
  vacationItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vacationDetails: {
    marginLeft: spacing.sm,
  },
  vacationValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.text,
  },
  vacationLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  vacationDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    marginLeft: spacing.sm,
  },
});
