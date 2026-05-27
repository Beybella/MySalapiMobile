import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { format } from 'date-fns';
import { sendGroupSingil } from '../lib/api';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const { data: groupData } = await supabase
      .from('group_expenses')
      .select('*, payer:payer_id(full_name, email)')
      .eq('id', id)
      .single();

    const { data: participantData } = await supabase
      .from('group_participants')
      .select('*, participant:participant_id(full_name, email)')
      .eq('group_expense_id', id)
      .order('created_at');

    setGroup(groupData);
    setParticipants(participantData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const isPayer = group?.payer_id === user?.id;

  const markPaid = async (participantId: string) => {
    await supabase
      .from('group_participants')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', participantId);

    // Check if all paid — auto-settle
    const updated = participants.map((p) =>
      p.id === participantId ? { ...p, is_paid: true } : p
    );
    const allPaid = updated.every((p) => p.is_paid);
    if (allPaid) {
      await supabase.from('group_expenses').update({ status: 'settled' }).eq('id', id);
    }
    loadData();
  };

  const handleSingil = async (participant: any) => {
    Alert.alert(
      'Send Singil',
      `Send collection email to ${participant.participant?.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send', onPress: async () => {
            const { data: payerProfile } = await supabase
              .from('users').select('full_name, email').eq('id', user!.id).single();

            const { data: notif } = await supabase.from('email_notifications').insert({
              recipient_email: participant.participant?.email,
              subject_email: `Group Expense Reminder: ₱${participant.share_amount} for ${group?.title}`,
              notification_type: 'group_singil',
              subject_cost_id: group?.id,
              status: 'pending',
            }).select().single();

            const result = await sendGroupSingil({
              recipient_email: participant.participant?.email,
              payer_name: payerProfile?.full_name || payerProfile?.email || 'Your friend',
              group_title: group?.title,
              share_amount: Number(participant.share_amount),
              notification_id: notif?.id,
            });

            Alert.alert(
              result.success ? 'Sent!' : 'Failed',
              result.success ? 'Singil email sent.' : (result.error ?? 'Could not send email.')
            );
          },
        },
      ]
    );
  };

  const formatCurrency = (n: number) =>
    `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const paidCount = participants.filter((p) => p.is_paid).length;
  const totalCollected = participants
    .filter((p) => p.is_paid)
    .reduce((s, p) => s + Number(p.share_amount), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, group?.status === 'settled' && { backgroundColor: Colors.success }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{group?.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(group?.total_amount)}</Text>
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: group?.status === 'settled' ? Colors.success + '20' : Colors.warning + '20'
            }]}>
              <Text style={[styles.statusText, {
                color: group?.status === 'settled' ? Colors.success : Colors.warning
              }]}>
                {group?.status === 'settled' ? 'Settled' : 'Active'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {[
              { label: 'Date', value: group?.expense_date ? format(new Date(group.expense_date), 'MMM d, yyyy') : '—' },
              { label: 'Category', value: group?.category },
              { label: 'Split', value: group?.split_method === 'equal' ? 'Equal' : 'Custom' },
              { label: 'Paid by', value: group?.payer?.full_name || group?.payer?.email },
            ].map((item) => (
              <View key={item.label} style={styles.metaItem}>
                <Text style={styles.metaLabel}>{item.label}</Text>
                <Text style={styles.metaValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Collection progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {paidCount}/{participants.length} paid
              </Text>
              <Text style={styles.progressAmount}>
                {formatCurrency(totalCollected)} collected
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: participants.length > 0
                  ? `${(paidCount / participants.length) * 100}%` as any
                  : '0%',
              }]} />
            </View>
          </View>
        </View>

        {/* Who Owes Whom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {participants.length === 0 ? (
            <Text style={styles.emptyText}>No participants added.</Text>
          ) : (
            participants.map((p) => (
              <View key={p.id} style={[styles.participantCard, p.is_paid && styles.participantPaid]}>
                <View style={styles.participantLeft}>
                  <View style={[styles.avatar, { backgroundColor: p.is_paid ? Colors.success + '20' : Colors.ambaganLedger + '20' }]}>
                    <Text style={[styles.avatarText, { color: p.is_paid ? Colors.success : Colors.ambaganLedger }]}>
                      {(p.participant?.full_name || p.participant?.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.participantName}>
                      {p.participant?.full_name || p.participant?.email}
                    </Text>
                    <Text style={styles.participantEmail}>{p.participant?.email}</Text>
                    {p.is_paid && p.paid_at && (
                      <Text style={styles.paidAt}>
                        Paid {format(new Date(p.paid_at), 'MMM d, yyyy')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.participantRight}>
                  <Text style={[styles.shareAmount, p.is_paid && { color: Colors.success }]}>
                    {formatCurrency(p.share_amount)}
                  </Text>
                  {p.is_paid ? (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.paidText}>Paid</Text>
                    </View>
                  ) : isPayer ? (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.markPaidBtn}
                        onPress={() => markPaid(p.id)}
                      >
                        <Text style={styles.markPaidText}>Mark Paid</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.singilBtn}
                        onPress={() => handleSingil(p)}
                      >
                        <Ionicons name="mail-outline" size={14} color={Colors.accent} />
                        <Text style={styles.singilText}>Singil</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },
  header: {
    backgroundColor: Colors.ambaganLedger, paddingTop: 56, paddingBottom: 16,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  summaryCard: { margin: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 20, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: Colors.ambaganLedger },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metaItem: { minWidth: '45%' },
  metaLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  progressSection: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressAmount: { fontSize: 13, fontWeight: '600', color: Colors.success },
  progressBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: Colors.success, borderRadius: 4 },
  section: { marginHorizontal: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  emptyText: { color: Colors.textLight, fontSize: 14, textAlign: 'center', padding: 16 },
  participantCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, elevation: 1,
  },
  participantPaid: { opacity: 0.75 },
  participantLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  participantName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  participantEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  paidAt: { fontSize: 11, color: Colors.success, marginTop: 2 },
  participantRight: { alignItems: 'flex-end', gap: 6 },
  shareAmount: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  pendingBadge: { backgroundColor: Colors.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingText: { fontSize: 11, color: Colors.warning, fontWeight: '600' },
  actionButtons: { gap: 4 },
  markPaidBtn: {
    backgroundColor: Colors.primary + '15', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 8,
  },
  markPaidText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  singilBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent + '15', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 8,
  },
  singilText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
});
