import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { Clock, PlayCircle, StopCircle, FileText, ChevronDown, X } from 'lucide-react-native';
import type { TimeLog } from '@/types';

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const { projects, timeLogs, clockIn, clockOut, isClockingIn, isClockingOut } = useData();
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const activeLog = useMemo(() => {
    return timeLogs.find(
      log => log.userId === currentUser?.id && log.status === 'active'
    );
  }, [timeLogs, currentUser]);

  const todayLogs = useMemo(() => {
    if (!currentUser) return [];
    const today = new Date().toDateString();
    return timeLogs.filter(
      log =>
        log.userId === currentUser.id &&
        new Date(log.clockIn).toDateString() === today &&
        log.status === 'completed'
    );
  }, [timeLogs, currentUser]);

  const todayHours = useMemo(() => {
    return todayLogs.reduce((total, log) => {
      if (log.clockOut) {
        const hours = (new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  }, [todayLogs]);

  const activeProject = useMemo(() => {
    if (!activeLog) return null;
    return projects.find(p => p.id === activeLog.projectId);
  }, [activeLog, projects]);

  const handleClockIn = () => {
    if (!selectedProjectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

    clockIn(
      {
        userId: currentUser!.id,
        projectId: selectedProjectId,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setShowClockInModal(false);
          setSelectedProjectId('');
          setNotes('');
        },
      }
    );
  };

  const handleClockOut = () => {
    if (!activeLog) return;

    Alert.alert('Clock Out', 'Are you sure you want to clock out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out',
        onPress: () => {
          clockOut({ logId: activeLog.id });
        },
      },
    ]);
  };

  const formatDuration = (log: TimeLog) => {
    const start = new Date(log.clockIn).getTime();
    const end = log.clockOut ? new Date(log.clockOut).getTime() : Date.now();
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const activeProjects = projects.filter(p => p.active);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {currentUser?.name || 'User'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today&apos;s Hours</Text>
            <Text style={styles.statValue}>{todayHours.toFixed(1)}h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statValue}>{todayLogs.length}</Text>
          </View>
        </View>

        {activeLog ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View style={styles.activeBadge}>
                <View style={styles.activePulse} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
              <Text style={styles.activeTime}>{formatDuration(activeLog)}</Text>
            </View>

            <View style={styles.projectInfo}>
              <View style={[styles.projectColor, { backgroundColor: activeProject?.color || colors.primary }]} />
              <View style={styles.projectDetails}>
                <Text style={styles.projectName}>{activeProject?.name}</Text>
                <Text style={styles.clockInTime}>
                  Started at {new Date(activeLog.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            {activeLog.notes && (
              <View style={styles.notesContainer}>
                <FileText size={16} color={colors.textSecondary} />
                <Text style={styles.notesText}>{activeLog.notes}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.clockOutButton}
              onPress={handleClockOut}
              disabled={isClockingOut}
            >
              {isClockingOut ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <StopCircle size={24} color={colors.white} />
                  <Text style={styles.clockOutButtonText}>Clock Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.clockInCard}
            onPress={() => setShowClockInModal(true)}
          >
            <View style={styles.clockInIcon}>
              <PlayCircle size={48} color={colors.primary} />
            </View>
            <Text style={styles.clockInTitle}>Clock In</Text>
            <Text style={styles.clockInSubtitle}>Start tracking your time</Text>
          </TouchableOpacity>
        )}

        {todayLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Activity</Text>
            {todayLogs.map(log => {
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
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={showClockInModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clock In</Text>
              <TouchableOpacity onPress={() => setShowClockInModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Project</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProjectPicker(true)}
            >
              <Text style={[styles.pickerButtonText, !selectedProject && styles.pickerPlaceholder]}>
                {selectedProject ? selectedProject.name : 'Choose a project'}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What are you working on?"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textLight}
            />

            <TouchableOpacity
              style={[styles.modalButton, !selectedProjectId && styles.modalButtonDisabled]}
              onPress={handleClockIn}
              disabled={!selectedProjectId || isClockingIn}
            >
              {isClockingIn ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Clock size={20} color={colors.white} />
                  <Text style={styles.modalButtonText}>Start Timer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showProjectPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {activeProjects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectOption}
                  onPress={() => {
                    setSelectedProjectId(project.id);
                    setShowProjectPicker(false);
                  }}
                >
                  <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                  <View style={styles.projectOptionInfo}>
                    <Text style={styles.projectOptionName}>{project.name}</Text>
                    {project.description && (
                      <Text style={styles.projectOptionDesc}>{project.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  activeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  activeBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.success,
  },
  activeTime: {
    fontSize: fontSize.xl,
    fontWeight: '700' as const,
    color: colors.text,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
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
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  clockInTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  notesText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  clockOutButton: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  clockOutButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    marginLeft: spacing.sm,
  },
  clockInCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  clockInIcon: {
    marginBottom: spacing.md,
  },
  clockInTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  clockInSubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700' as const,
    color: colors.text,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 56,
  },
  pickerButtonText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.textLight,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    height: 80,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    marginLeft: spacing.sm,
  },
  pickerModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  projectOptionInfo: {
    flex: 1,
  },
  projectOptionName: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  projectOptionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
