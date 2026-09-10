import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors';

export interface EchoPastCardProps {
  title: string;
  reason: string;
  score?: number;
}

export const EchoPastCard: React.FC<EchoPastCardProps> = ({ title, reason, score }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.8}>
        <View style={styles.headerRow}>
          <Text style={styles.badgeText}>✨ הד מהעבר</Text>
          {score !== undefined && (
            <Text style={styles.scoreText}>התאמה: {Math.round(score * 100)}%</Text>
          )}
        </View>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.expandHint}>
          {expanded ? '▲ הקטן' : '▼ הרחב פרטים'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <Text style={styles.reasonLabel}>הקשר רלוונטי:</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    marginVertical: 12,
    overflow: 'hidden'
  },
  header: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  badgeText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  scoreText: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11
  },
  titleText: {
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8
  },
  expandHint: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    textAlign: 'right'
  },
  content: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.1)',
  },
  reasonLabel: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'right',
    fontWeight: '500'
  },
  reasonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20
  }
});
