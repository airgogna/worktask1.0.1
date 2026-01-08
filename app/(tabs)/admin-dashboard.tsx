import React, { useMemo } from 'react';
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
import { useData } from '@/contexts/DataContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { Clock, Users, FolderKanban, TrendingUp, LogOut } from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const { currentUser, logout, users } = useAuth();
  const { projects, timeLogs } = useData();
  const router = useRouter();

  const stats = useMemo(() => {
    const activeEmployees = users.filter(u => u.role === 'employee' && u.active).length;
    const activeProjects = projects.filter(p => p.active).length;
    
    const today = new Date().toDateString();
    const todayLogs = timeLogs.filter(
      log => new Date(log.clockIn).toDateString() === today && log.status === 'completed'
    );

    const todayHours = todayLogs.reduce((total, log) => {
      if (log.clockOut) {
        const hours = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    const thisMonth = new Date();
    const monthLogs = timeLogs.filter(log => {
      const logDate = new Date(log.clockIn);
      return (
        logDate.getMonth() === thisMonth.getMonth() &&
        logDate.getFullYear() === thisMonth.getFullYear() &&
        log.status === 'completed'
      );
    });

    const monthHours = monthLogs.reduce((total, log) => {
      if (log.clockOut) {
        const hours = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    const projectStats = projects.map(project => {
      const projectLogs = timeLogs.filter(
        log => log.projectId === project.id && log.status === 'completed'
      );
      const actualHours = projectLogs.reduce((total, log) => {
        if (log.clockOut) {
          const hours = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0);

      const uniqueUsers = new Set(projectLogs.map(log => log.userId)).size;

      return {
        ...project,
        actualHours,
        uniqueUsers,
        progress: project.estimatedHours > 0 ? (actualHours / project.estimatedHours) * 100 : 0,
      };
    });

    return {
      activeEmployees,
      activeProjects,
      todayHours,
      monthHours,
      projectStats: projectStats.sort((a, b) => b.actualHours - a.actualHours).slice(0, 5),
    };
  }, [users, projects, timeLogs]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.welcomeText}>Welcome back, {currentUser?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <View style={styles.statIcon}>
              <Clock size={24} color={colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.todayHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color={colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.monthHours.toFixed(0)}h</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <View style={styles.statIcon}>
              <Users size={24} color={colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.activeEmployees}</Text>
            <Text style={styles.statLabel}>Employees</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <View style={styles.statIcon}>
              <FolderKanban size={24} color={colors.white} />
            </View>
            <Text style={styles.statValue}>{stats.activeProjects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Projects</Text>
          {stats.projectStats.length > 0 ? (
            stats.projectStats.map(project => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                    <View style={styles.projectDetails}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <Text style={styles.projectMeta}>
                        {project.uniqueUsers} team members
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.projectStats}>
                  <View style={styles.projectStat}>
                    <Text style={styles.projectStatLabel}>Actual</Text>
                    <Text style={styles.projectStatValue}>{project.actualHours.toFixed(1)}h</Text>
                  </View>
                  <View style={styles.projectStat}>
                    <Text style={styles.projectStatLabel}>Estimated</Text>
                    <Text style={styles.projectStatValue}>{project.estimatedHours}h</Text>
                  </View>
                  <View style={styles.projectStat}>
                    <Text style={styles.projectStatLabel}>Progress</Text>
                    <Text style={[
                      styles.projectStatValue,
                      project.progress > 100 && { color: colors.danger }
                    ]}>
                      {project.progress.toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(project.progress, 100)}%`,
                        backgroundColor: project.progress > 100 ? colors.danger : project.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No project data yet</Text>
            </View>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.text,
  },
  welcomeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  statIcon: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.9,
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
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectColor: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  projectDetails: {
    flex: 1,
  },
  projectName: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  projectMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  projectStat: {
    alignItems: 'center',
  },
  projectStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  projectStatValue: {
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    color: colors.text,
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
  },
});
