const fs = require('fs');
const path = require('path');

const FIRESTORE_API_KEY = 'AIzaSyCjxLuDQ7EktomeXveVoXHaDe6vrfDDxMY';
const PROJECT_ID = 'echo-guy-2026';
const ROOT_DIR = path.resolve(__dirname, '..');
const MD_OUTPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.md');
const JSON_OUTPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.json');

function decodeFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const res = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  return val;
}

function decodeDoc(doc) {
  const res = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    res[k] = decodeFirestoreValue(v);
  }
  return res;
}

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function categorizeDecision(d) {
  const text = `${d.title || ''} ${d.rawVerbatim || ''} ${d.consideration || ''}`.toLowerCase();
  
  if (text.includes('איתן') || text.includes('טיפוס') || text.includes('הורית') || text.includes('ילדים') && text.includes('לימודים')) {
    return {
      categoryKey: 'family_parenting',
      categoryName: 'מעגל הורות וחינוך משפחתי',
      icon: '👨‍👧‍👦',
      description: 'הכרעות חינוכיות, התמודדות עם שחיקה, פיתוח חוסן וקבלת החלטות עבור הילדים'
    };
  }
  
  if (text.includes('קטרוני') || text.includes('בטון') || text.includes('קבלן') || text.includes('שלד') || text.includes('גמר') || text.includes('פינס') || text.includes('חפץ חיים') || text.includes('הנשיאים') || text.includes('מגרש') || text.includes('דירות')) {
    return {
      categoryKey: 'real_estate_projects',
      categoryName: 'מעגל נדל"ן, פרויקטים ובינוי',
      icon: '🏗️',
      description: 'החלטות עסקיות, תפעוליות ותכנוניות בפרויקטי בנייה, ניהול קבלנים, לוחות זמנים ורכש'
    };
  }
  
  if (text.includes('תפקיד') || text.includes('שכר') || text.includes('פרויקט צד') || text.includes('מנהל')) {
    return {
      categoryKey: 'career_endeavors',
      categoryName: 'מעגל קריירה, תעסוקה ומיזמים',
      icon: '💼',
      description: 'שינויים תעסוקתיים, תעדוף פרויקטים אישיים מול ארגוניים, ושמירה על איזון בית-עבודה'
    };
  }
  
  if (text.includes('מרתון') || text.includes('גב') || text.includes('רכב') || text.includes('חשמלי') || text.includes('אימון') || text.includes('פציעה')) {
    return {
      categoryKey: 'health_lifestyle',
      categoryName: 'מעגל בריאות, כושר ואורח חיים',
      icon: '🌿',
      description: 'ניהול פציעות וספורט, החלטות רכש אישיות, איכות חיים וקיימות אישית'
    };
  }

  return {
    categoryKey: 'system_onboarding',
    categoryName: 'מעגל בדיקות מערכת ופתיחה',
    icon: '⚙️',
    description: 'לכידות בדיקה, תקשורת ראשונית ואימות תקינות המערכת'
  };
}

async function fetchAllDecisionsFromFirestore(targetUser = 'guy_founder') {
  let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${targetUser}/decisions?key=${FIRESTORE_API_KEY}&pageSize=100`;
  const allDocs = [];

  try {
    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        break;
      }
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        allDocs.push(...data.documents.map(decodeDoc));
      }
      if (data.nextPageToken) {
        url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${targetUser}/decisions?key=${FIRESTORE_API_KEY}&pageSize=100&pageToken=${data.nextPageToken}`;
      } else {
        url = null;
      }
    }
  } catch (e) {
    console.warn('[Sync]: User-scoped fetch fallback:', e.message);
  }

  // Fallback to legacy root decisions if user collection was empty
  if (allDocs.length === 0) {
    let legacyUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/decisions?key=${FIRESTORE_API_KEY}&pageSize=100`;
    while (legacyUrl) {
      const res = await fetch(legacyUrl);
      if (!res.ok) break;
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        allDocs.push(...data.documents.map(decodeDoc));
      }
      if (data.nextPageToken) {
        legacyUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/decisions?key=${FIRESTORE_API_KEY}&pageSize=100&pageToken=${data.nextPageToken}`;
      } else {
        legacyUrl = null;
      }
    }
  }

  // Filter out invalid or empty docs, sort by timestamp
  return allDocs.filter(d => d.userId === targetUser || !d.userId).sort((a, b) => (a.frozenAt || 0) - (b.frozenAt || 0));
}

function generateMarkdown(decisions, lastUpdatedIso) {
  const user = decisions[0]?.userId || 'guy_founder';
  const totalDecisions = decisions.length;
  const sealedCount = decisions.filter(d => d.sealed).length;

  // Group by category
  const categoriesMap = new Map();

  decisions.forEach(d => {
    const cat = categorizeDecision(d);
    if (!categoriesMap.has(cat.categoryKey)) {
      categoriesMap.set(cat.categoryKey, {
        info: cat,
        items: []
      });
    }
    categoriesMap.get(cat.categoryKey).items.push(d);
  });

  let md = `# ספר מעגלי ההחלטה — הד | Echo
> **קובץ ידע מקיף ומתעדכן של כל מעגלי שיקול הדעת האנושי והבינה המלאכותית**  
> משתמש פעיל: **@${user}** | עודכן לאחרונה: **${new Date(lastUpdatedIso).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}**  
> סה"כ החלטות מתועדות: **${totalDecisions}** (נחתמו והוגדרו למעקב: **${sealedCount}**)

---

## 🧭 תוכן עניינים לפי מעגלי החלטה

`;

  // TOC
  let globalIndex = 1;
  for (const [key, group] of categoriesMap.entries()) {
    md += `### ${group.info.icon} ${group.info.categoryName} (${group.items.length} החלטות)\n`;
    md += `*${group.info.description}*\n\n`;
    group.items.forEach(item => {
      const dateStr = item.frozenAt ? new Date(item.frozenAt).toLocaleDateString('he-IL') : 'ללא תאריך';
      md += `- [${item.title || 'החלטה ללא כותרת'}](#החלטה-${item.id}) — \`${dateStr}\` ${item.sealed ? '🔒 *נחתם לביקורת*' : '⏳ *בתהליך*'}\n`;
    });
    md += '\n';
  }

  md += `---

## 📊 סקירה מרוכזת (Executive Summary)

| # | מעגל החלטה | כותרת ההחלטה | תאריך לכידה | סטטוס | סמן סומטי / סיכון | הצעד הנבחר |
| :- | :--- | :--- | :--- | :---: | :--- | :--- |
`;

  decisions.forEach((d, idx) => {
    const cat = categorizeDecision(d);
    const dateStr = d.frozenAt ? new Date(d.frozenAt).toLocaleDateString('he-IL') : '-';
    const status = d.sealed ? '🔒 נחתם' : '⏳ פתוח';
    const marker = [d.affectBadge, d.riskBadge].filter(Boolean).map(s => s.replace('סמן סומטי: ', '').replace('מחלקת סיכון: ', '')).join(', ') || '-';
    const step = d.insightChosenStep || d.refinedAction || d.actionAnswer || d.userAnswer || '-';
    const cleanStep = step.length > 55 ? step.slice(0, 52) + '...' : step;
    md += `| ${idx + 1} | ${cat.categoryName.replace('מעגל ', '')} | [${d.title || d.id}](#החלטה-${d.id}) | ${dateStr} | ${status} | ${marker} | ${cleanStep} |\n`;
  });

  md += `\n---\n\n## 🔍 פירוט מעגלי ההחלטה המלאים\n\n`;

  // Detailed view by category
  for (const [key, group] of categoriesMap.entries()) {
    md += `## ${group.info.icon} ${group.info.categoryName}\n`;
    md += `> **מהות המעגל:** ${group.info.description}\n\n`;

    group.items.forEach((d, itemIdx) => {
      const dateStr = d.frozenAt ? new Date(d.frozenAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }) : '-';
      const sealedDateStr = d.sealedAt ? new Date(d.sealedAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }) : null;
      const dueDateStr = d.dueDate ? new Date(d.dueDate).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' }) : null;

      md += `### <a id="החלטה-${d.id}"></a>📌 החלטה: ${d.title || d.id}\n\n`;
      md += `**מטא-דאטה ומזהים:**\n`;
      md += `- **מזהה ייחודי (ID):** \`${d.id}\`\n`;
      md += `- **משתמש:** \`@${d.userId || user}\`\n`;
      md += `- **מועד לכידה והקפאה מקורית:** \`${dateStr}\`\n`;
      md += `- **סטטוס חוזה:** ${d.sealed ? `🔒 **נחתם** (בתאריך ${sealedDateStr})` : '⏳ **בבירור / טרם נחתם**'}\n`;
      if (dueDateStr) {
        md += `- **מועד בדיקה ורפלקציה שנקבע:** \`${dueDateStr}\` (תקופה: ${d.selectedDays || '-'} ימים)\n`;
      }
      md += `\n`;

      // 1. RAW VERBATIM
      md += `#### 🎙️ 1. המלל הגולמי שנלכד (Raw Verbatim Freeze)\n`;
      md += `> "${cleanHtml(d.rawVerbatim) || 'לא הוזן מלל גולמי'}"\n\n`;

      // 2. MACHINE KNOWLEDGE & COGNITIVE ANALYSIS
      md += `#### 🧠 2. ידע המכונה שנכנס (Machine Cognitive Extraction)\n\n`;
      
      // Badges
      const badges = [];
      if (d.affectBadge) badges.push(`**סמן סומטי (רגשי/גופני):** ${d.affectBadge}`);
      if (d.locusBadge) badges.push(`**מיקוד שליטה:** ${d.locusBadge}`);
      if (d.riskBadge) badges.push(`**מחלקת סיכון (Taleb Framework):** ${d.riskBadge}`);
      if (badges.length > 0) {
        md += `* **סמנים אפיסטמיים:** ${badges.join(' | ')}\n\n`;
      }

      // 4/5 Human dimensions
      md += `##### 🪞 4 ממדי המראה האנושית שהמערכת חילצה:\n`;
      md += `1. **מה אתה שוקל (Consideration):**\n   ${cleanHtml(d.consideration) || cleanHtml(d.title) || '-'}\n`;
      md += `2. **מה חשוב לך להשיג ולשמור / מטרות ומחירים (Goals & Prices):**\n   ${cleanHtml(d.goalsPrices) || cleanHtml(d.goal) || '-'}\n`;
      
      const factsText = cleanHtml(d.facts) || cleanHtml(d.observations);
      const assumptionsText = cleanHtml(d.assumptions) || cleanHtml(d.reliance);
      md += `3. **על מה אתה נשען (עובדות קשיחות מול הנחות עבודה):**\n`;
      if (factsText) md += `   - **עובדות בשטח:** ${factsText}\n`;
      if (assumptionsText) md += `   - **הנחות עבודה:** ${assumptionsText}\n`;
      if (!factsText && !assumptionsText) md += `   - ${cleanHtml(d.reliance) || '-'}\n`;

      const unknownsText = cleanHtml(d.unknowns) || cleanHtml(d.missingInfo);
      md += `4. **מה עדיין לא ברור / מידע חסר להחלטה (Unknowns & Missing Info):**\n   ${unknownsText || '-'}\n\n`;

      // Illumination question
      if (d.question) {
        md += `##### 💡 שאלת ההארה האדפטיבית שנוסחה על ידי המכונה:\n`;
        md += `> ${cleanHtml(d.question)}\n\n`;
      }

      // Proposed criteria
      if (d.proposedCriteria && d.proposedCriteria.length > 0) {
        md += `##### 📋 קריטריוני מבחן שהוצעו על ידי המכונה:\n`;
        d.proposedCriteria.forEach((crit, cIdx) => {
          md += `- [${cIdx + 1}] ${cleanHtml(crit)}\n`;
        });
        md += `\n`;
      }

      // 3. RESULTS & OUTCOMES
      md += `#### 🎯 3. התוצאות, ההכרעה והתחדדות החשיבה (Outcomes & Refinements)\n\n`;
      
      const userResp = cleanHtml(d.userAnswer) || cleanHtml(d.actionAnswer);
      if (userResp) {
        md += `- **מענה המשתמש לשאלת ההארה:**\n  > "${userResp}"\n\n`;
      }

      if (d.insightBefore || d.insightNow || d.insightChosenStep || d.refinedAction || d.insightSummary) {
        md += `##### ⚡ הבזק התחדדות החשיבה (Before ➔ After):\n`;
        if (d.insightBefore) md += `- **קודם חשבת:** ${cleanHtml(d.insightBefore)}\n`;
        if (d.insightNow) md += `- **כעת התחדד לך:** ${cleanHtml(d.insightNow)}\n`;
        if (d.insightChosenStep || d.refinedAction) md += `- **הצעד המעשי שנבחר:** **${cleanHtml(d.insightChosenStep || d.refinedAction)}**\n`;
        if (d.insightSummary) md += `- **סיכום התחדדות כולל:** ${cleanHtml(d.insightSummary)}\n`;
        md += `\n`;
      }

      // Final Contract / Criterion
      const finalCrit = cleanHtml(d.selectedCriterion) || cleanHtml(d.customCriterion) || cleanHtml(d.contractCriterion);
      if (finalCrit) {
        md += `##### 📜 חוזה הערכה וקריטריון הכרעה:\n`;
        md += `- **הקריטריון שנחתם:** ${finalCrit}\n`;
        if (d.selectedDays) md += `- **מסגרת זמן למבחן:** ${d.selectedDays} ימים\n`;
        if (dueDateStr) md += `- **מועד ביקורת עתידי:** ${dueDateStr}\n`;
        md += `\n`;
      }

      // Follow ups
      if (d.followUps && d.followUps.length > 0) {
        md += `##### 🔄 מעקבים וסגירת מעגלים שנרשמו:\n`;
        d.followUps.forEach((fu, fIdx) => {
          const fuDate = fu.timestamp ? new Date(fu.timestamp).toLocaleDateString('he-IL') : '-';
          md += `- **מעקב ${fIdx + 1} (${fuDate}):** ${cleanHtml(fu.text || JSON.stringify(fu))}\n`;
        });
        md += `\n`;
      }

      md += `---\n\n`;
    });
  }

  md += `## 🔄 מנגנון עדכון אוטומטי
קובץ זה מיוצר ומסונכרן באופן אוטומטי:
1. בעת כל לכידה חדשה באפליקציית הד (Echo Mobile Web).
2. בעת מענה על שאלת הארה, עריכת המראה או חתימה על חוזה החלטה.
3. באמצעות פקודת הסנכרון הישירה: \`npm run sync-decisions\`.
`;

  return md;
}

async function syncDecisionCycles() {
  console.log('[ECHO Sync]: מוריד את כל החלטות המשתמש מ-Firebase Firestore...');
  const decisions = await fetchAllDecisionsFromFirestore();
  console.log(`[ECHO Sync]: נמצאו ${decisions.length} החלטות עבור משתמש.`);

  const nowIso = new Date().toISOString();

  // 1. Generate Markdown
  const markdownContent = generateMarkdown(decisions, nowIso);
  fs.writeFileSync(MD_OUTPUT_PATH, markdownContent, 'utf8');
  console.log(`[ECHO Sync]: קובץ Markdown עודכן בהצלחה בנתיב: ${MD_OUTPUT_PATH}`);

  // 2. Generate JSON data file
  const jsonContent = JSON.stringify({
    metadata: {
      generatedAt: nowIso,
      user: decisions[0]?.userId || 'guy_founder',
      totalDecisions: decisions.length,
      sealedDecisions: decisions.filter(d => d.sealed).length,
      projectId: PROJECT_ID
    },
    decisions: decisions
  }, null, 2);
  fs.writeFileSync(JSON_OUTPUT_PATH, jsonContent, 'utf8');
  console.log(`[ECHO Sync]: קובץ JSON עודכן בהצלחה בנתיב: ${JSON_OUTPUT_PATH}`);

  return {
    total: decisions.length,
    markdownPath: MD_OUTPUT_PATH,
    jsonPath: JSON_OUTPUT_PATH
  };
}

module.exports = {
  syncDecisionCycles,
  fetchAllDecisionsFromFirestore,
  generateMarkdown
};

if (require.main === module) {
  syncDecisionCycles()
    .then(res => {
      console.log(`\n✓ סנכרון הושלם בהצלחה! סה"כ ${res.total} החלטות תועדו.`);
    })
    .catch(err => {
      console.error('❌ שגיאה בסנכרון:', err);
      process.exitCode = 1;
    });
}
