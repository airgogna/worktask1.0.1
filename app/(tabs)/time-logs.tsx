import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { Calendar, Clock } from 'lucide-react-native';
import type { TimeLog } from '@/types';

type Period = 'week' | 'month' | 'all';

export default function TimeLogsScreen() {
  const { currentUser } = useAuth();
  const { projects, timeLogs } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  const filteredLogs = useMemo(() => {
    if (!currentUser) return [];

    const userLogs = timeLogs.filter(log => log.userId === currentUser.id && log.status === 'completed');

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (selectedPeriod === 'week') {
      return userLogs.filter(log => new Date(log.clockIn) >= startOfWeek);
    } else if (selectedPeriod === 'month') {
      return userLogs.filter(log => new Date(log.clockIn) >= startOfMonth);
    }

    return userLogs;
  }, [timeLogs, currentUser, selectedPeriod]);

  const totalHours = useMemo(() => {
    return filteredLogs.reduce((total, log) => {
      if (log.clockOut) {
        const hours = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  }, [filteredLogs]);

  const projectBreakdown = useMemo(() => {
    const breakdown = new Map<string, { hours: number; sessions: number; project: typeof projects[0] | undefined }>();

    filteredLogs.forEach(log => {
      if (!log.clockOut) return;

      const hours = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / (1000 * 60 * 60);
      const existing = breakdown.get(log.projectId);
      const project = projects.find(p => p.id === log.projectId);

      if (existing) {
        existing.hours += hours;
        existing.sessions += 1;
      } else {
        breakdown.set(log.projectId, { hours, sessions: 1, project });
      }
    });

    return Array.from(breakdown.values()).sort((a, b) => b.hours - a.hours);
  }, [filteredLogs, projects]);

  const groupedLogs = useMemo(() => {
    const groups = new Map<string, TimeLog[]>();

    filteredLogs.forEach(log => {
      const dateStr = new Date(log.clockIn).toDateString();
      if (groups.has(dateStr)) {
        groups.get(dateStr)!.push(log);
      } else {
        groups.set(dateStr, [log]);
      }
    });

    return Array.from(groups.entries()).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredLogs]);

  const formatDuration = (log: TimeLog) => {
    if (!log.clockOut) return '0h 0m';
    const start = new Date(log.clockIn).getTime();
    const end = new Date(log.clockOut).getTime();
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Logs</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'all' && styles.periodButtonTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Clock size={32} color={colors.primary} />
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>Total Hours</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Calendar size={32} color={colors.success} />
            <Text style={styles.summaryValue}>{filteredLogs.length}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
        </View>

        {projectBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Breakdown</Text>
            {projectBreakdown.map((item, index) => (
              <View key={index} style={styles.projectBreakdownCard}>
                <View style={styles.projectBreakdownHeader}>
                  <View style={styles.projectBreakdownInfo}>
                    <View style={[styles.projectColor, { backgroundColor: item.project?.color || colors.primary }]} />
                    <View style={styles.projectBreakdownDetails}>
                      <Text style={styles.projectBreakdownName}>{item.project?.name || 'Unknown Project'}</Text>
                      <Text style={styles.projectBreakdownMeta}>{item.sessions} sessions</Text>
                    </View>
                  </View>
                  <Text style={styles.projectBreakdownHours}>{item.hours.toFixed(1)}h</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(item.hours / totalHours) * 100}%`,
                        backgroundColor: item.project?.color || colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {groupedLogs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Logs</Text>
            {groupedLogs.map(([date, logs]) => (
              <View key={date} style={styles.dayGroup}>
                <Text style={styles.dayGroupDate}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                {logs.map(log => {
                  const project = projects.find(p => p.id === log.projectId);
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <View style={styles.logProject}>
                          <View style={[styles.projectColorSmall, { backgroundColor: project?.color || colors.primary }]} />
                          <Text style={styles.logProjectName}>{project?.name}</Text>
                        </View>
                        <Text style={styles.logDuration}>{formatDuration(log)}</Text>
                      </View>
                      <Text style={styles.logTime}>
                        {new Date(log.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {log.clockOut ? new Date(log.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                      </Text>
                      {log.notes && (
                        <Text style={styles.logNotes}>{log.notes}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Clock size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No time logs for this period</Text>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  summaryValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  projectBreakdownCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  projectBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  projectBreakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectColor: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  projectBreakdownDetails: {
    flex: 1,
  },
  projectBreakdownName: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  projectBreakdownMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  projectBreakdownHours: {
    fontSize: fontSize.lg,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  dayGroup: {
    marginBottom: spacing.lg,
  },
  dayGroupDate: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.sm,
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
  logProject: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectColorSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  logProjectName: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
  },
  logDuration: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  logTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logNotes: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic' as const,
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
