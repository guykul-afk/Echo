import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';

export interface PastEchoItem {
  title: string;
  reason: string;
  date?: string;
}

export interface DecisionFlowPipelineProps {
  dilemma: string;
  goalsPrices?: string;
  facts?: string;
  assumptions?: string;
  question?: string;
  pastEcho?: PastEchoItem | null;
  answer?: string;
  conclusion?: string;
  nextStep?: string;
  scrollable?: boolean;
  maxHeight?: number;
}

const splitIntoBullets = (text?: string): string[] => {
  if (!text) return [];
  if (text.includes('\n')) {
    return text.split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  if (text.includes(' | ')) {
    return text.split(' | ').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  if (text.includes('•')) {
    return text.split('•').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (sentences && sentences.length > 1) {
    return sentences.map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  return [text];
};

export const DecisionFlowPipeline: React.FC<DecisionFlowPipelineProps> = ({
  dilemma,
  goalsPrices,
  facts,
  assumptions,
  question,
  pastEcho,
  answer,
  conclusion,
  nextStep,
  scrollable = true,
  maxHeight = 440
}) => {
  const factBullets = splitIntoBullets(facts);
  const assumptionBullets = splitIntoBullets(assumptions);

  const content = (
    <View style={styles.flowContainer}>
      
      {/* 01. הדילמה (אתה שוקל) */}
      <View style={styles.nodeRow}>
        <View style={styles.badgeCol}>
          <View style={[styles.stepBadge, styles.stepBadgeGoldBorder]}>
            <Text style={styles.stepNumGold}>01</Text>
          </View>
          <View style={styles.verticalSpine} />
        </View>

        <View style={[styles.card, styles.cardGoldTint]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTagGold}>הדילמה שזוקקה</Text>
            <Text style={styles.cardHeaderSub}>המראה משקפת</Text>
          </View>
          <Text style={styles.dimLabel}>אתה שוקל:</Text>
          <Text style={styles.cardMainText}>{dilemma || 'טרם הוגדרה דילמה'}</Text>
        </View>
      </View>

      {/* 02. מטרות ומחירים */}
      {Boolean(goalsPrices) && (
        <View style={styles.nodeRow}>
          <View style={styles.badgeCol}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>02</Text>
            </View>
            <View style={styles.verticalSpine} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTag}>מטרות ומחירים (Trade-offs)</Text>
            </View>
            <Text style={styles.cardSecondaryText}>{goalsPrices}</Text>
          </View>
        </View>
      )}

      {/* 03. עובדות קשיחות */}
      {Boolean(facts) && (
        <View style={styles.nodeRow}>
          <View style={styles.badgeCol}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>03</Text>
            </View>
            <View style={styles.verticalSpine} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTag}>עובדות קשיחות</Text>
              <Text style={styles.cardHeaderSub}>ודאות</Text>
            </View>
            {factBullets.length > 1 ? (
              <View style={styles.bulletList}>
                {factBullets.map((b, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.cardSecondaryText}>{facts}</Text>
            )}
          </View>
        </View>
      )}

      {/* 04. הנחות ופרשנויות */}
      {Boolean(assumptions) && (
        <View style={styles.nodeRow}>
          <View style={styles.badgeCol}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>04</Text>
            </View>
            <View style={styles.verticalSpine} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTag}>הנחות ופרשנויות</Text>
              <Text style={styles.cardHeaderSub}>סובייקטיבי</Text>
            </View>
            {assumptionBullets.length > 1 ? (
              <View style={styles.bulletList}>
                {assumptionBullets.map((b, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletTextItalic}>"{b}"</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.cardItalicText}>"{assumptions}"</Text>
            )}
          </View>
        </View>
      )}

      {/* 05. שאלת חידוד (Intervention) */}
      {Boolean(question) && (
        <View style={styles.nodeRow}>
          <View style={styles.badgeCol}>
            <View style={[styles.stepBadge, styles.stepBadgeActive]}>
              <Text style={styles.stepIconActive}>✦</Text>
            </View>
            <View style={styles.verticalSpine} />
          </View>

          <View style={[styles.card, styles.cardElevated]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTagGold}>שאלת חידוד (נקודת מפנה)</Text>
              <Text style={styles.cardHeaderSub}>Intervention</Text>
            </View>
            <Text style={styles.cardHighlightText}>"{question}"</Text>
          </View>
        </View>
      )}

      {/* 06. הפניה מהעבר (הד מהעבר - מותנה) */}
      {pastEcho ? (
        <View style={styles.nodeRow}>
          <View style={styles.badgeCol}>
            <View style={[styles.stepBadge, styles.stepBadgeDashed]}>
              <Text style={styles.stepNumGold}>↺</Text>
            </View>
            <View style={styles.verticalSpine} />
          </View>

          <View style={[styles.card, styles.cardDashed]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTagGold}>הד מהעבר {pastEcho.date ? `• ${pastEcho.date}` : ''}</Text>
              <Text style={styles.cardHeaderSub}>תקדים דומה</Text>
            </View>
            <Text style={styles.pastTitle}>{pastEcho.title}:</Text>
            <Text style={styles.cardSecondaryText}>{pastEcho.reason}</Text>
          </View>
        </View>
      ) : null}

      {/* 07. תשובת הבהירות */}
      {Boolean(answer) && (
        <View style={styles.nodeRow}>
          <View style={styles.badgeCol}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>07</Text>
            </View>
            <View style={styles.verticalSpine} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTag}>התשובה שהובילה לבהירות</Text>
            </View>
            <Text style={styles.cardSecondaryText}>{answer}</Text>
          </View>
        </View>
      )}

      {/* 08. מסקנה והצעד הבא */}
      <View style={styles.nodeRow}>
        <View style={styles.badgeCol}>
          <View style={[styles.stepBadge, styles.stepBadgeDone]}>
            <Text style={styles.stepIconDone}>✓</Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardFinal]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTagGold}>מסקנה והצעד הנבחר</Text>
            <Text style={styles.doneBadge}>סגור לביצוע</Text>
          </View>
          <Text style={styles.cardConclusionTitle}>
            {conclusion || 'החלטה מיושרת שיקול דעת'}
          </Text>
          {Boolean(nextStep) && (
            <View style={styles.nextStepBox}>
              <Text style={styles.nextStepLabel}>הצעד הבא:</Text>
              <Text style={styles.nextStepVal}>{nextStep}</Text>
            </View>
          )}
        </View>
      </View>

    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scrollArea, { maxHeight }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  scrollArea: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    backgroundColor: 'rgba(7, 8, 11, 0.65)'
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 20
  },
  flowContainer: {
    gap: 12
  },
  nodeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10
  },
  badgeCol: {
    alignItems: 'center',
    width: 28
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  stepBadgeGoldBorder: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)'
  },
  stepBadgeActive: {
    backgroundColor: '#151c28',
    borderColor: LuxuryTheme.accent.gold,
    shadowColor: LuxuryTheme.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6
  },
  stepBadgeDashed: {
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.04)'
  },
  stepBadgeDone: {
    backgroundColor: LuxuryTheme.accent.gold,
    borderColor: LuxuryTheme.accent.gold
  },
  stepNum: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 10,
    fontWeight: '600'
  },
  stepNumGold: {
    color: LuxuryTheme.accent.gold,
    fontSize: 10,
    fontWeight: '700'
  },
  stepIconActive: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11
  },
  stepIconDone: {
    color: '#07080B',
    fontSize: 11,
    fontWeight: '900'
  },
  verticalSpine: {
    width: 1,
    flex: 1,
    minHeight: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginTop: 2,
    marginBottom: -8
  },

  // Cards
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    padding: 11
  },
  cardGoldTint: {
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  cardElevated: {
    backgroundColor: 'rgba(21, 28, 40, 0.85)',
    borderColor: 'rgba(212, 175, 55, 0.35)'
  },
  cardDashed: {
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.25)',
    backgroundColor: 'rgba(212, 175, 55, 0.02)'
  },
  cardFinal: {
    backgroundColor: 'rgba(21, 28, 40, 0.95)',
    borderColor: LuxuryTheme.accent.gold
  },

  // Card Content
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  cardHeaderTag: {
    color: LuxuryTheme.text.secondary,
    fontSize: 11,
    fontWeight: '600'
  },
  cardHeaderTagGold: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '700'
  },
  cardHeaderSub: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 9
  },
  dimLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'right'
  },
  cardMainText: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'right'
  },
  cardSecondaryText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right'
  },
  cardItalicText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'right'
  },
  cardHighlightText: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'right'
  },
  pastTitle: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2
  },
  cardConclusionTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6
  },
  doneBadge: {
    color: LuxuryTheme.accent.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  nextStepBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
    marginTop: 2,
    flexDirection: 'row-reverse',
    gap: 6
  },
  nextStepLabel: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '700'
  },
  nextStepVal: {
    color: LuxuryTheme.text.primary,
    fontSize: 11,
    flex: 1,
    textAlign: 'right'
  },
  bulletList: {
    gap: 6,
    marginTop: 3
  },
  bulletItem: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: LuxuryTheme.accent.gold,
    marginTop: 6,
    shadowColor: LuxuryTheme.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3
  },
  bulletText: {
    color: LuxuryTheme.text.primary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    textAlign: 'right'
  },
  bulletTextItalic: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right'
  }
});