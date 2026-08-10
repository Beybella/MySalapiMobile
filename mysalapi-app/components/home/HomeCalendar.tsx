import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  markedDates: any;
  onDatePress: (day: { dateString: string }) => void;
}

export default function HomeCalendar({ markedDates, onDatePress }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const styles = makeStyles(colors);

  const todayStr = new Date().toISOString().split('T')[0];

  const getCurrentWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const weekDates = getCurrentWeekDates();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {!expanded ? (
        <>
          <View style={styles.weekCalendar}>
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const hasDues = markedDates[dateStr];
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.weekDayContainer}
                  onPress={() => onDatePress({ dateString: dateStr })}
                >
                  <Text style={styles.weekDayLabel}>{dayLabels[index]}</Text>
                  <View style={[styles.weekDayCircle, isToday && styles.weekDayCircleToday]}>
                    <Text style={[styles.weekDayNum, isToday && styles.weekDayNumToday]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  {hasDues && (
                    <View style={styles.weekDayDots}>
                      <View style={[styles.weekDayDot, { backgroundColor: hasDues.dotColor }]} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Legend onExpand={() => setExpanded(true)} expanded={false} colors={colors} styles={styles} />
        </>
      ) : (
        <>
          <Calendar
            markedDates={markedDates}
            markingType="simple"
            onDayPress={onDatePress}
            renderHeader={(date: any) => {
              const d = new Date(date);
              return (
                <Text style={styles.expandedCalendarHeader}>
                  {d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
                </Text>
              );
            }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ffffff',
              todayBackgroundColor: colors.primary,
              dayTextColor: colors.textPrimary,
              textDisabledColor: colors.textLight,
              monthTextColor: colors.textPrimary,
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12,
              arrowColor: colors.primary,
              dotColor: colors.primary,
              selectedDotColor: '#ffffff',
            }}
            style={{ marginBottom: 12 }}
          />
          <Legend onExpand={() => setExpanded(false)} expanded={true} colors={colors} styles={styles} />
        </>
      )}
    </View>
  );
}

function Legend({ onExpand, expanded, colors, styles }: any) {
  return (
    <View style={styles.compactLegend}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={styles.compactLegendItem}>
          <View style={[styles.compactLegendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.compactLegendText}>Bills</Text>
        </View>
        <View style={styles.compactLegendItem}>
          <View style={[styles.compactLegendDot, { backgroundColor: '#FF5252' }]} />
          <Text style={styles.compactLegendText}>Loans</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.expandButton} onPress={onExpand}>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        <Text style={styles.expandButtonText}>{expanded ? 'Collapse' : 'Expand'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekDayContainer: { flex: 1, alignItems: 'center', gap: 6 },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  weekDayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  weekDayCircleToday: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  weekDayNum: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  weekDayNumToday: { color: '#ffffff' },
  weekDayDots: { flexDirection: 'row', gap: 4 },
  weekDayDot: { width: 6, height: 6, borderRadius: 3 },
  compactLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compactLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactLegendDot: { width: 10, height: 10, borderRadius: 5 },
  compactLegendText: { fontSize: 13, color: colors.textPrimary, fontWeight: '700' },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
  },
  expandButtonText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  expandedCalendarHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
});
