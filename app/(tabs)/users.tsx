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
import { colors, spacing, borderRadius, fontSize, shadows } from '@/constants/theme';
import { Plus, X, UserPlus, UserX, Edit2, Shield, User as UserIcon } from 'lucide-react-native';
import type { User } from '@/types';

export default function UsersScreen() {
  const { users, createUser, updateUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [vacationDays, setVacationDays] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setVacationDays('20');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setVacationDays(user.vacationDaysTotal.toString());
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (!editingUser && !password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (!vacationDays || isNaN(Number(vacationDays)) || Number(vacationDays) < 0) {
      Alert.alert('Error', 'Please enter valid vacation days');
      return;
    }

    setIsSubmitting(true);

    if (editingUser) {
      const updates: Partial<User> = {
        name: name.trim(),
        email: email.trim(),
        role,
        vacationDaysTotal: Number(vacationDays),
      };
      
      if (password) {
        updates.password = password;
      }

      updateUser(
        { userId: editingUser.id, updates },
        {
          onSuccess: () => {
            setShowModal(false);
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
            Alert.alert('Error', 'Failed to update user');
          },
        }
      );
    } else {
      createUser(
        {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          active: true,
          vacationDaysTotal: Number(vacationDays),
          vacationDaysUsed: 0,
        },
        {
          onSuccess: () => {
            setShowModal(false);
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
            Alert.alert('Error', 'Failed to create user');
          },
        }
      );
    }
  };

  const toggleUserStatus = (user: User) => {
    const action = user.active ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => {
            updateUser({
              userId: user.id,
              updates: { active: !user.active },
            });
          },
        },
      ]
    );
  };

  const activeUsers = users.filter(u => u.active);
  const inactiveUsers = users.filter(u => !u.active);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Users ({activeUsers.length})</Text>
          {activeUsers.map(user => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.userAvatar, user.role === 'admin' ? styles.adminAvatar : styles.employeeAvatar]}>
                    {user.role === 'admin' ? (
                      <Shield size={24} color={colors.white} />
                    ) : (
                      <UserIcon size={24} color={colors.white} />
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userBadge}>
                      <Text style={[styles.userRole, user.role === 'admin' ? styles.adminRole : styles.employeeRole]}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => openEditModal(user)}>
                  <Edit2 size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <Text style={styles.userStatLabel}>Vacation Days</Text>
                  <Text style={styles.userStatValue}>
                    {user.vacationDaysTotal - user.vacationDaysUsed}/{user.vacationDaysTotal}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => toggleUserStatus(user)}
              >
                <UserX size={16} color={colors.textSecondary} />
                <Text style={styles.deactivateButtonText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          ))}

          {activeUsers.length === 0 && (
            <View style={styles.emptyState}>
              <UserIcon size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No active users</Text>
            </View>
          )}
        </View>

        {inactiveUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inactive Users ({inactiveUsers.length})</Text>
            {inactiveUsers.map(user => (
              <View key={user.id} style={[styles.userCard, styles.inactiveCard]}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <View style={[styles.userAvatar, styles.inactiveAvatar]}>
                      <UserIcon size={24} color={colors.white} />
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: colors.textSecondary }]}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={() => toggleUserStatus(user)}
                >
                  <UserPlus size={16} color={colors.white} />
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
                {editingUser ? 'Edit User' : 'New User'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="john@company.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>
                Password {editingUser && '(Leave empty to keep current)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={editingUser ? 'Leave empty to keep current' : 'Enter password'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleOption, role === 'employee' && styles.roleOptionSelected]}
                  onPress={() => setRole('employee')}
                >
                  <UserIcon size={20} color={role === 'employee' ? colors.white : colors.text} />
                  <Text style={[styles.roleOptionText, role === 'employee' && styles.roleOptionTextSelected]}>
                    Employee
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, role === 'admin' && styles.roleOptionSelected]}
                  onPress={() => setRole('admin')}
                >
                  <Shield size={20} color={role === 'admin' ? colors.white : colors.text} />
                  <Text style={[styles.roleOptionText, role === 'admin' && styles.roleOptionTextSelected]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Total Vacation Days</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                value={vacationDays}
                onChangeText={setVacationDays}
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingUser ? 'Update User' : 'Create User'}
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
  userCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  adminAvatar: {
    backgroundColor: colors.primary,
  },
  employeeAvatar: {
    backgroundColor: colors.success,
  },
  inactiveAvatar: {
    backgroundColor: colors.textSecondary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userBadge: {
    alignSelf: 'flex-start',
  },
  userRole: {
    fontSize: fontSize.xs,
    fontWeight: '600' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminRole: {
    backgroundColor: colors.primary + '15',
    color: colors.primary,
  },
  employeeRole: {
    backgroundColor: colors.success + '15',
    color: colors.success,
  },
  userStats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  userStat: {
    marginRight: spacing.lg,
  },
  userStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userStatValue: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
  },
  deactivateButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deactivateButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  activateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activateButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.white,
    marginLeft: spacing.xs,
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
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 56,
  },
  roleOptionSelected: {
    backgroundColor: colors.primary,
  },
  roleOptionText: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  roleOptionTextSelected: {
    color: colors.white,
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
