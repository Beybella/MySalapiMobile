import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  userName: string;
  onSignOut: () => void;
}

export default function HomeHeader({ userName, onSignOut }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.modernHeader}>
      <View style={styles.modernHeaderTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.currentDate}>{format(new Date(), 'EEEE, d MMMM, yyyy')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onSignOut} style={styles.logoutIconBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  modernHeader: {
    backgroundColor: colors.primary,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  currentDate: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
});
