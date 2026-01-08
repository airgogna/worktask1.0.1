import React, { useState } from 'react';
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
import { Plus, X, FolderKanban, Edit2 } from 'lucide-react-native';
import type { Project } from '@/types';

const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#6366f1', '#84cc16', '#f97316',
];

export default function ProjectsScreen() {
  const { currentUser } = useAuth();
  const { projects, createProject, updateProject } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [estimatedManpower, setEstimatedManpower] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setEstimatedHours('');
    setEstimatedManpower('');
    setSelectedColor(PROJECT_COLORS[0]);
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setEstimatedHours(project.estimatedHours.toString());
    setEstimatedManpower(project.estimatedManpower.toString());
    setSelectedColor(project.color);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (!estimatedHours || isNaN(Number(estimatedHours)) || Number(estimatedHours) <= 0) {
      Alert.alert('Error', 'Please enter valid estimated hours');
      return;
    }

    if (!estimatedManpower || isNaN(Number(estimatedManpower)) || Number(estimatedManpower) <= 0) {
      Alert.alert('Error', 'Please enter valid estimated manpower');
      return;
    }

    setIsSubmitting(true);

    if (editingProject) {
      updateProject(
        {
          id: editingProject.id,
          updates: {
            name: name.trim(),
            description: description.trim() || undefined,
            estimatedHours: Number(estimatedHours),
            estimatedManpower: Number(estimatedManpower),
            color: selectedColor,
          },
        },
        {
          onSuccess: () => {
            setShowModal(false);
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
            Alert.alert('Error', 'Failed to update project');
          },
        }
      );
    } else {
      createProject(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          estimatedHours: Number(estimatedHours),
          estimatedManpower: Number(estimatedManpower),
          color: selectedColor,
          active: true,
          createdBy: currentUser!.id,
        },
        {
          onSuccess: () => {
            setShowModal(false);
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
            Alert.alert('Error', 'Failed to create project');
          },
        }
      );
    }
  };

  const toggleProjectStatus = (project: Project) => {
    const action = project.active ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Project`,
      `Are you sure you want to ${action} this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => {
            updateProject({
              id: project.id,
              updates: { active: !project.active },
            });
          },
        },
      ]
    );
  };

  const activeProjects = projects.filter(p => p.active);
  const inactiveProjects = projects.filter(p => !p.active);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Projects ({activeProjects.length})</Text>
          {activeProjects.map(project => (
            <View key={project.id} style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                  <View style={styles.projectDetails}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    {project.description && (
                      <Text style={styles.projectDescription}>{project.description}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => openEditModal(project)}>
                  <Edit2 size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.projectStats}>
                <View style={styles.projectStat}>
                  <Text style={styles.projectStatLabel}>Est. Hours</Text>
                  <Text style={styles.projectStatValue}>{project.estimatedHours}h</Text>
                </View>
                <View style={styles.projectStat}>
                  <Text style={styles.projectStatLabel}>Est. Team</Text>
                  <Text style={styles.projectStatValue}>{project.estimatedManpower}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => toggleProjectStatus(project)}
              >
                <Text style={styles.deactivateButtonText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          ))}

          {activeProjects.length === 0 && (
            <View style={styles.emptyState}>
              <FolderKanban size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No active projects</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {inactiveProjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inactive Projects ({inactiveProjects.length})</Text>
            {inactiveProjects.map(project => (
              <View key={project.id} style={[styles.projectCard, styles.inactiveCard]}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <View style={[styles.projectColor, { backgroundColor: project.color, opacity: 0.5 }]} />
                    <View style={styles.projectDetails}>
                      <Text style={[styles.projectName, { color: colors.textSecondary }]}>
                        {project.name}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={() => toggleProjectStatus(project)}
                >
                  <Text style={styles.activateButtonText}>Activate</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Edit Project' : 'New Project'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Project Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter project name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Project description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>Estimated Hours</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 160"
                value={estimatedHours}
                onChangeText={setEstimatedHours}
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>Estimated Team Size</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4"
                value={estimatedManpower}
                onChangeText={setEstimatedManpower}
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>Project Color</Text>
              <View style={styles.colorPicker}>
                {PROJECT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </Text>
                )}
              </TouchableOpacity>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
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
  inactiveCard: {
    opacity: 0.7,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  projectInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.sm,
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
  projectDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  projectStats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  projectStat: {
    marginRight: spacing.lg,
  },
  projectStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  projectStatValue: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
  },
  deactivateButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  deactivateButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  activateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  activateButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.white,
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
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  emptyButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.white,
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
    maxHeight: '90%',
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    height: 56,
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
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
  },
});
