import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';

interface DecisionProfileScreenProps {
  onBack: () => void;
}

export const DecisionProfileScreen: React.FC<DecisionProfileScreenProps> = ({ onBack }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>→ חזרה</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>פרופיל שיקול דעת</Text>
          <Text style={styles.screenSubtitle}>זיכרון אפיסטמי מצטבר וכיול אישי</Text>
        </View>
      </View>

      {/* 1. מדד כיול הסתברותי (Brier Calibration) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>שכבה 8 • כיול הסתברותי</Text>
          </View>
          <Text style={styles.cardTitle}>ציון כיול (Brier Score)</Text>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreValue}>0.14</Text>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreStatus}>רמת כיול גבוהה ומדויקת</Text>
            <Text style={styles.scoreExplanation}>
              הפער הממוצע בין מידת הביטחון שלך לבין תוצאות המציאות בפועל (0 = מושלם, 1 = שגיאה מלאה).
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '86%' }]} />
        </View>
      </View>

      {/* 2. מרשם שבירות הנחות (Assumption Fragility Registry) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Text style={[styles.badgeText, { color: '#EF4444' }]}>מרשם הנחות שבירות</Text>
          </View>
          <Text style={styles.cardTitle}>שבירות לפי קטגוריות</Text>
        </View>
        <Text style={styles.cardDesc}>
          היכן הנחות העבודה שלך נטו להתברר כשגויות או כפגיעות ביותר בדיעבד:
        </Text>

        {/* פריט 1: זמני ביצוע ורכש */}
        <View style={styles.fragilityItem}>
          <View style={styles.fragilityHeader}>
            <Text style={styles.fragilityPercent}>64% שבירות</Text>
            <Text style={styles.fragilityCategory}>זמני ביצוע, רכש ולוגיסטיקה</Text>
          </View>
          <Text style={styles.fragilityInsight}>
            פקטור תת-הערכה אופייני: משימות נמשכו בפועל פי 2.4 מהצפוי.
          </Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '64%', backgroundColor: '#EF4444' }]} />
          </View>
        </View>

        {/* פריט 2: תלות בקבלנים וספקים */}
        <View style={styles.fragilityItem}>
          <View style={styles.fragilityHeader}>
            <Text style={styles.fragilityPercent}>42% שבירות</Text>
            <Text style={styles.fragilityCategory}>יישור קו ותלות בגורמי חוץ</Text>
          </View>
          <Text style={styles.fragilityInsight}>
            הנחה על עבודה עם ספק יחיד יצרה חיכוך תפעולי ב-3 מתוך 7 מקרים.
          </Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '42%', backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        {/* פריט 3: המרה ותגובת לקוחות */}
        <View style={styles.fragilityItem}>
          <View style={styles.fragilityHeader}>
            <Text style={styles.fragilityPercent}>21% שבירות</Text>
            <Text style={styles.fragilityCategory}>ביקוש לקוחות ומוכנות לשלם</Text>
          </View>
          <Text style={styles.fragilityInsight}>
            רמת דיוק גבוהה — בדיקות מקדימות בשבועיים אימתו את הביקוש ביעילות.
          </Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '21%', backgroundColor: LuxuryTheme.accent.emeraldSuccess }]} />
          </View>
        </View>
      </View>

      {/* 3. מדדי מבנה ההחלטה (Decision Architecture & Portfolio) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>חתימת החלטות</Text>
          </View>
          <Text style={styles.cardTitle}>מבנה תיק ההחלטות</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>26</Text>
            <Text style={styles.statLabel}>החלטות מתועדות</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>13</Text>
            <Text style={styles.statLabel}>מעגלים שנחתמו</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>72%</Text>
            <Text style={styles.statLabel}>הפיכות חלקית/מלאה</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0.71</Text>
            <Text style={styles.statLabel}>שיפוע התחייבות ממוצע</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8
  },
  titleContainer: {
    alignItems: 'flex-end'
  },
  screenTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right'
  },
  screenSubtitle: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2
  },
  backBtn: {
    backgroundColor: LuxuryTheme.background.elevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  backBtnText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    fontWeight: '600'
  },
  card: {
    backgroundColor: LuxuryTheme.background.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    marginBottom: 18
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right'
  },
  cardDesc: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 14,
    lineHeight: 18
  },
  badge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeText: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 11,
    fontWeight: '700'
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14
  },
  scoreValue: {
    color: LuxuryTheme.accent.emeraldSuccess,
    fontSize: 38,
    fontWeight: '800'
  },
  scoreMeta: {
    flex: 1,
    alignItems: 'flex-end'
  },
  scoreStatus: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  scoreExplanation: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right'
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6
  },
  progressBar: {
    height: '100%',
    backgroundColor: LuxuryTheme.accent.emeraldSuccess,
    borderRadius: 3
  },
  fragilityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  fragilityHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  fragilityCategory: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  fragilityPercent: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '700'
  },
  fragilityInsight: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
    marginBottom: 6
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  statNumber: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4
  },
  statLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'center'
  }
});
