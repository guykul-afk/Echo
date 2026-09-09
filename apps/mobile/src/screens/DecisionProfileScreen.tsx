import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';

interface DecisionProfileScreenProps {
  onBack: () => void;
  capturesCount?: number;
  closuresCount?: number;
}

export const DecisionProfileScreen: React.FC<DecisionProfileScreenProps> = ({
  onBack,
  capturesCount = 2,
  closuresCount = 1
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  };

  const nextUpdateEventsRemaining = Math.max(1, 3 - Math.max(capturesCount % 3, closuresCount % 3));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>→ חזרה</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>השתקפויות והדים</Text>
          <Text style={styles.screenSubtitle}>המראה ארוכת הטווח של שיקול הדעת</Text>
        </View>
      </View>

      {/* Hero Banner: חיווי עדכון מחזורי (טריגר כל 3 לכידות / סגירות) */}
      <View style={styles.syncCard}>
        <View style={styles.syncHeader}>
          <View style={styles.pulsingDot} />
          <Text style={styles.syncTitle}>סנכרון מחזור ההד הבא</Text>
        </View>
        <Text style={styles.syncDesc}>
          הפרופיל מתעדכן ומכייל את עצמו אוטומטית בכל 3 לכידות או 3 סגירות מעגל חדשות.
        </Text>
        <View style={styles.counterRow}>
          <View style={styles.counterBox}>
            <Text style={styles.counterNum}>{capturesCount % 3}/3</Text>
            <Text style={styles.counterLabel}>לכידות במחזור</Text>
          </View>
          <View style={styles.counterDivider} />
          <View style={styles.counterBox}>
            <Text style={styles.counterNum}>{closuresCount % 3}/3</Text>
            <Text style={styles.counterLabel}>סגירות מעגל</Text>
          </View>
        </View>
        <View style={styles.hintBadge}>
          <Text style={styles.hintBadgeText}>
            💡 עוד {nextUpdateEventsRemaining} פעולות לחישוב מחדש של ההד שלך
          </Text>
        </View>
      </View>

      {/* 1. כרטיסיית "הדרך השלישית" (The Binary Trap & Synthesis) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgeAmber}>
            <Text style={styles.badgeTextAmber}>דפוס קוגניטיבי מובהק</Text>
          </View>
          <Text style={styles.cardTitle}>מלכודת הדיכוטומיה והדרך השלישית</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricNumberAmber}>80%</Text>
            <Text style={styles.metricSub}>ניסוח "או-או" בינארי ראשוני</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={styles.metricNumberGreen}>75%</Text>
            <Text style={styles.metricSub}>חילוץ "דרך שלישית" בהכרעה</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          המוח שלך מציג דילמות כקונפליקט קוטבי ונוקשה. אולם לאחר שיקוף המראה, אתה מצטיין במציאת סינתזה יצירתית המפרקת את הקיטוב.
        </Text>

        <TouchableOpacity 
          style={styles.expandBtn} 
          onPress={() => toggleSection('binary_examples')}
        >
          <Text style={styles.expandBtnText}>
            {expandedSection === 'binary_examples' ? '▲ הסתר דוגמאות ממעגלי ההחלטה' : '▼ ראה דוגמאות מההיסטוריה שלך'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'binary_examples' && (
          <View style={styles.examplesContainer}>
            <View style={styles.exampleItem}>
              <Text style={styles.exampleTitle}>דילמת בית הספר (נווה):</Text>
              <Text style={styles.exampleText}>
                • דיכוטומיה ראשונית: רמה לימודית גבוהה בפרטי מול מענה חברתי באזורי.
              </Text>
              <Text style={styles.exampleSolution}>
                ← הדרך השלישית: הישארות בבית הספר הפרטי + רישום לצופים ולחוגים.
              </Text>
            </View>

            <View style={styles.exampleItem}>
              <Text style={styles.exampleTitle}>אימוני ספורט (איתן):</Text>
              <Text style={styles.exampleText}>
                • דיכוטומיה ראשונית: כפיית טיפוס מול פרישה מיידית שמרגילה לוותר.
              </Text>
              <Text style={styles.exampleSolution}>
                ← הדרך השלישית: פיילוט מותנה לשחייה עם התחייבות התמדה עד החגים.
              </Text>
            </View>

            <View style={styles.exampleItem}>
              <Text style={styles.exampleTitle}>תמחור דירות (קיטרוני וסלומון):</Text>
              <Text style={styles.exampleText}>
                • דיכוטומיה ראשונית: הורדה גורפת של 150 אלף ₪ מול אי-ודאות תזרימית.
              </Text>
              <Text style={styles.exampleSolution}>
                ← הדרך השלישית: מבצע מתוחם בזמן ל-2 דירות בלבד לשמירה על שאר הפרויקט.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 2. כרטיסיית "דיוק הנחות היסוד" (Assumption Calibration) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgePurple}>
            <Text style={styles.badgeTextPurple}>כיול הנחות עבודה</Text>
          </View>
          <Text style={styles.cardTitle}>התממשות הנחות מול המציאות</Text>
        </View>

        <Text style={styles.cardDesc}>
          שיעור הדיוק של הנחות היסוד שהקפאת בזמן קבלת ההחלטה, בפילוח לפי תחומי פעילות:
        </Text>

        {/* תחום 1: נדל"ן וביצוע */}
        <View style={styles.domainItem}>
          <View style={styles.domainHeader}>
            <Text style={styles.domainPercentGreen}>88% דיוק</Text>
            <Text style={styles.domainName}>הנדסה, עלויות ביצוע ולוחות זמנים</Text>
          </View>
          <Text style={styles.domainInsight}>
            הערכות מקצועיות יציבות ביותר; ספי הסיכון שקבעת (למשל מול קבלני שלד) מדויקים.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '88%', backgroundColor: LuxuryTheme.accent.emeraldSuccess }]} />
          </View>
        </View>

        {/* תחום 2: דינמיקה אנושית ויחסי עבודה */}
        <View style={styles.domainItem}>
          <View style={styles.domainHeader}>
            <Text style={styles.domainPercentOrange}>58% דיוק</Text>
            <Text style={styles.domainName}>גורם אנושי, יחסי עבודה ושותפים</Text>
          </View>
          <Text style={styles.domainInsight}>
            פער חוזר בהערכת תגובות רגשיות או נכונות דיירים ועובדים לשתף פעולה (למשל סביב כנרת ועורכי דין).
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '58%', backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        {/* תחום 3: תגובת שוק וביקושים */}
        <View style={styles.domainItem}>
          <View style={styles.domainHeader}>
            <Text style={styles.domainPercentBlue}>72% דיוק</Text>
            <Text style={styles.domainName}>סנטימנט שוק וקצב התאוששות</Text>
          </View>
          <Text style={styles.domainInsight}>
            נטייה זהירה המגדרת תרחישי קיצון בצורה אפקטיבית.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '72%', backgroundColor: '#60A5FA' }]} />
          </View>
        </View>
      </View>

      {/* 3. כרטיסיית "אסימטריית סיכון: ממון מול גוף" (Risk Asymmetry) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgeRed}>
            <Text style={styles.badgeTextRed}>פער סומטי מול פיננסי</Text>
          </View>
          <Text style={styles.cardTitle}>מאזן תעוזה ושמרנות</Text>
        </View>

        <Text style={styles.cardDesc}>
          המערכת מזהה פיצול חד בין האופן שבו אתה מנהל סיכוני כסף לעומת סיכוני בריאות וגוף:
        </Text>

        <View style={styles.asymmetryBox}>
          <View style={styles.asymmetrySide}>
            <Text style={styles.asymmetryTitle}>💼 החלטות ממון ועסקים</Text>
            <Text style={styles.asymmetryBadgeShield}>🛡️ שמרנות קיצונית</Text>
            <Text style={styles.asymmetryText}>
              • היצמדות קשיחה לדו"ח אפס{'\n'}
              • דאגה עמוקה לתזרים מזומנים{'\n'}
              • פיצול ספקים למניעת תלות יחידה{'\n'}
              • שנאת תרחישי קיצון (Extremistan)
            </Text>
          </View>

          <View style={styles.asymmetryDivider} />

          <View style={styles.asymmetrySide}>
            <Text style={styles.asymmetryTitle}>🏄‍♂️ גוף, ספורט ובריאות</Text>
            <Text style={styles.asymmetryBadgeDaring}>⚡ תעוזה ונטילת סיכון</Text>
            <Text style={styles.asymmetryText}>
              • גלישה בכנרת תחת אזהרת זיהום{'\n'}
              • חזרה לריצה מול פציעת גב פעילה{'\n'}
              • בחירת גלשן רמה מעל הרמה שלך{'\n'}
              • דחיית סמנים סומטיים של שחיקה
            </Text>
          </View>
        </View>
      </View>

      {/* 4. כרטיסיית "בריאות סגירת המעגלים" (Outcome Loops Discipline) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgePurple}>
            <Text style={styles.badgeTextPurple}>לולאת למידה</Text>
          </View>
          <Text style={styles.cardTitle}>בריאות סגירת המעגלים</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumberPurple}>35</Text>
            <Text style={styles.statLabel}>החלטות מתועדות</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumberAmber}>26</Text>
            <Text style={styles.statLabel}>חוזים שנחתמו</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumberGreen}>8</Text>
            <Text style={styles.statLabel}>מעגלים שנסגרו ונלמדו</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumberRed}>18</Text>
            <Text style={styles.statLabel}>ממתינים לרפלקציה</Text>
          </View>
        </View>

        <View style={styles.loopAlert}>
          <Text style={styles.loopAlertTitle}>⚠️ תובנה על חלונות הזמן שלך:</Text>
          <Text style={styles.loopAlertText}>
            קבעת חלונות ביקורת קצרים של 3–7 ימים גם עבור תהליכים מורכבים (כמו הסתגלות ילד בבית ספר או שינויי מחיר בנדל"ן). מומלץ להאריך את חלון הביקורת ל-30–60 יום כדי לקבל משוב אמיתי מהמציאות.
          </Text>
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
    paddingBottom: 50
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6
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
    backgroundColor: LuxuryTheme.background.surfaceElevated,
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

  // Sync Card
  syncCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 20
  },
  syncHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LuxuryTheme.accent.auraGlow
  },
  syncTitle: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right'
  },
  syncDesc: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 12
  },
  counterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10
  },
  counterBox: {
    alignItems: 'center'
  },
  counterNum: {
    color: LuxuryTheme.text.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  counterLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    marginTop: 2
  },
  counterDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  hintBadge: {
    alignItems: 'center',
    marginTop: 2
  },
  hintBadgeText: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11
  },

  // Cards
  card: {
    backgroundColor: LuxuryTheme.background.surface,
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
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right'
  },
  cardDesc: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 12
  },

  // Badges
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeTextAmber: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700'
  },
  badgePurple: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeTextPurple: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '700'
  },
  badgeRed: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeTextRed: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '700'
  },

  // Metric Rows
  metricRow: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  metricBox: {
    flex: 1,
    alignItems: 'center'
  },
  metricNumberAmber: {
    color: LuxuryTheme.text.primary,
    fontSize: 26,
    fontWeight: '800'
  },
  metricNumberGreen: {
    color: LuxuryTheme.accent.gold,
    fontSize: 26,
    fontWeight: '800'
  },
  metricSub: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },

  // Expand Button & Examples
  expandBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  expandBtnText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '600'
  },
  examplesContainer: {
    marginTop: 12,
    gap: 8
  },
  exampleItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  exampleTitle: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4
  },
  exampleText: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16
  },
  exampleSolution: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '600'
  },

  // Domains
  domainItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  domainHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  domainName: {
    color: LuxuryTheme.text.primary,
    fontSize: 12,
    fontWeight: '600'
  },
  domainPercentGreen: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '700'
  },
  domainPercentOrange: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '700'
  },
  domainPercentBlue: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '700'
  },
  domainInsight: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
    marginBottom: 6
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },

  // Asymmetry
  asymmetryBox: {
    flexDirection: 'column',
    gap: 12
  },
  asymmetrySide: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  asymmetryTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4
  },
  asymmetryBadgeShield: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6
  },
  asymmetryBadgeDaring: {
    color: LuxuryTheme.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6
  },
  asymmetryText: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 18
  },
  asymmetryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  statNumberPurple: {
    color: LuxuryTheme.accent.gold,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  statNumberAmber: {
    color: LuxuryTheme.text.secondary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  statNumberGreen: {
    color: LuxuryTheme.accent.gold,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  statNumberRed: {
    color: LuxuryTheme.text.secondary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  statLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 10,
    textAlign: 'center'
  },
  loopAlert: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  loopAlertTitle: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4
  },
  loopAlertText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16
  }
});
