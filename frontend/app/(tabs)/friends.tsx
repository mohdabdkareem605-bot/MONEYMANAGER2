import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, X } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';
import { useDataStore } from '../../src/store/dataStore';

import FriendsHeader from '../../src/components/friends/FriendsHeader';
import ScopeToggle from '../../src/components/friends/ScopeToggle';
import FriendCard from '../../src/components/friends/FriendCard';

export default function FriendsScreen() {
  const [viewMode, setViewMode] = useState<'Friends' | 'Groups'>('Friends');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    contacts,
    contactBalances,
    fetchContacts,
    fetchContactBalances,
    createContact,
    deleteContact,
  } = useDataStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchContacts();
      await fetchContactBalances();
    } catch (error) {
      console.error('Load contacts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddContact = async () => {
    if (!newContactName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setSubmitting(true);
    try {
      const contact = await createContact({
        name: newContactName.trim(),
        phone_number: newContactPhone.trim() || undefined,
        email: newContactEmail.trim() || undefined,
      });

      if (contact) {
        setShowAddModal(false);
        setNewContactName('');
        setNewContactPhone('');
        setNewContactEmail('');
        await fetchContactBalances();
      }
    } catch (error: any) {
      console.error('Add contact failed:', error);
      Alert.alert('Error', error.message || 'Failed to add contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = (id: string, name: string) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteContact(id);
            await fetchContactBalances();
          },
        },
      ]
    );
  };

  // Map contacts with their multi-currency balances
  const friendsData = contacts.map(contact => {
    const balance = contactBalances.find(b => b.contact_id === contact.id);

    return {
      id: contact.id,
      name: contact.name,
      description: contact.phone_number || contact.email || 'No contact info',
      balances: balance?.balances || [],
      totalInPrimary: balance?.total_in_primary || 0,
    };
  });

  // Groups data (placeholder for now)
  const groupsData: any[] = [];

  const currentData = viewMode === 'Friends' ? friendsData : groupsData;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky Header Section */}
      <View style={styles.headerContainer}>
        <FriendsHeader />
        <ScopeToggle mode={viewMode} setMode={setViewMode} />
      </View>

      {/* Main List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendCard
            item={item as any}
            isGroup={viewMode === 'Groups'}
            onLongPress={() => handleDeleteContact(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {viewMode === 'Friends' ? 'No friends yet' : 'No groups yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {viewMode === 'Friends'
                ? 'Add friends to start splitting expenses'
                : 'Create a group to share expenses'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowAddModal(true)}
      >
        <UserPlus size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor={COLORS.textSecondary}
                value={newContactName}
                onChangeText={setNewContactName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor={COLORS.textSecondary}
                value={newContactEmail}
                onChangeText={setNewContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textSecondary}
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                keyboardType="phone-pad"
              />
              <Text style={styles.inputHint}>
                Add email or phone to link with their account
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleAddContact}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Add Friend</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: RADIUS.circle,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.l,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: SPACING.m,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.l,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.m,
    ...SHADOWS.medium,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
