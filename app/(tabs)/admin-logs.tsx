import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { FileText } from 'lucide-react-native';

export default function AdminLogsScreen() {
  const { auditLogs, users } = useAuth();

  const sortedLogs = useMemo(() => {
    return [...auditLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [auditLogs]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Logged In',
      logout: 'Logged Out',
      create_user: 'Created User',
      update_user: 'Updated User',
      create_project: 'Created Project',
      update_project: 'Updated Project',
    };
    return labels[action] || action;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Logs</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {sortedLogs.length > 0 ? (
          sortedLogs.map(log => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logAction}>{getActionLabel(log.action)}</Text>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
              <Text style={styles.logUser}>{getUserName(log.userId)}</Text>
              <Text style={styles.logDate}>
                {new Date(log.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No audit logs yet</Text>
          </View>
        )}
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
  logCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logAction: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
  },
  logTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logUser: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  logDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
