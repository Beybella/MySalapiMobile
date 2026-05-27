import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { format, getDaysInMonth, getYear, getMonth } from 'date-fns';

interface DateInputProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DateInput({ label, value, onChange, minDate }: DateInputProps) {
  const [open, setOpen] = useState(false);

  const parsed = value ? new Date(value + 'T00:00:00') : new Date();
  const [year, setYear]   = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth());
  const [day, setDay]     = useState(parsed.getDate());

  const daysInMonth = getDaysInMonth(new Date(year, month));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i - 1);

  const confirm = () => {
    const d = String(day).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    onChange(`${year}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = value
    ? format(new Date(value + 'T00:00:00'), 'MMMM d, yyyy')
    : 'Select date';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayValue}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>{label}</Text>

            {/* Year */}
            <Text style={styles.sectionLabel}>Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.chip, year === y && styles.chipActive]}
                  onPress={() => { setYear(y); setDay(Math.min(day, getDaysInMonth(new Date(y, month)))); }}
                >
                  <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month */}
            <Text style={styles.sectionLabel}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, month === i && styles.chipActive]}
                  onPress={() => { setMonth(i); setDay(Math.min(day, getDaysInMonth(new Date(year, i)))); }}
                >
                  <Text style={[styles.chipText, month === i && styles.chipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day */}
            <Text style={styles.sectionLabel}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, day === d && styles.chipActive]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.chipText, day === d && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: 14, backgroundColor: Colors.surface,
  },
  inputText: { fontSize: 14, color: Colors.textPrimary },
  placeholder: { color: Colors.textLight },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  picker: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, paddingBottom: 36,
  },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  row: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
    backgroundColor: Colors.background,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  confirmBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '700' },
});
