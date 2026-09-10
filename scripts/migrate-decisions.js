const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const jsonPath = path.join(projectRoot, 'DECISION_CYCLES.json');
const adrDir = path.join(projectRoot, 'docs', 'adr');

if (!fs.existsSync(adrDir)) {
    fs.mkdirSync(adrDir, { recursive: true });
}

// 1. Create ADR 0000
const adr0 = `# 0000. שימוש ברשומות החלטה (Decision Records)

תאריך: ${new Date().toISOString().split('T')[0]}

## סטטוס
מאושר

## הקשר (Context)
ניהול ההחלטות של המערכת (הד / Echo) נוהל עד כה בקובץ עצום ויחיד (\`DECISION_CYCLES.md\`). ככל שכמות ההחלטות גדלה (מעל 30 החלטות), הפך הקובץ לקשה לתחזוקה, קשה לחיפוש, וקשה לחיבור לקומיטים ולשינויי קוד/תהליך פרטניים. 
החלטנו לעבור לגישה מבוססת זמן בדומה ל-Architecture Decision Records (ADRs).

## החלטה
כל החלטה משמעותית עתידית שהמערכת מקבלת או מתעדת עבור המשתמש, תישמר כקובץ Markdown נפרד וממוספר בתיקיית \`docs/adr/\`.

## השלכות
* יצירת היסטוריה ברורה וקלה למעקב.
* אפשרות לקשר קומיטים להחלטות ספציפיות (\`fix: update xyz (ADR #12)\`).
* ביזור המידע והקלה על בקרת התצורה (Git).
`;
fs.writeFileSync(path.join(adrDir, '0000-use-adrs.md'), adr0, 'utf8');

// 2. Create Template
const template = `# [כותרת ההחלטה קצרה]

**מספר החלטה:** [מספר רציף]
**תאריך לכידה:** [תאריך]
**סטטוס:** [מוצע / נחתם / הוחלף]
**מזהה מקורי:** [ID אם קיים]

## הקשר (Context) / מה אתה שוקל
[תיאור הדילמה או ההחלטה המונחת על הפרק. עובדות בשטח מול הנחות עבודה.]

## מטרות ומחירים (Goals & Prices)
[מה חשוב להשיג ועל מה מוכנים לוותר]

## החלטה / הצעד הנבחר
[ההכרעה המעשית שהתקבלה]

## השלכות (Consequences)
[מה התוצאות של ההחלטה זו, חיוביות ושליליות]
`;
fs.writeFileSync(path.join(adrDir, 'template.md'), template, 'utf8');

// 3. Migrate old decisions
try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const decisions = data.decisions || [];
    
    // Sort chronologically
    decisions.sort((a, b) => (a.frozenAt || 0) - (b.frozenAt || 0));

    decisions.forEach((dec, index) => {
        const num = String(index + 1).padStart(4, '0');
        const safeTitle = (dec.title || 'untitled').replace(/[^a-zA-Z0-9\u0590-\u05FF]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 30);
        const fileName = `${num}-${safeTitle}.md`;
        
        const dateStr = dec.frozenAt ? new Date(dec.frozenAt).toISOString().split('T')[0] : 'Unknown';
        
        const md = `# ${num}. ${dec.title || 'ללא כותרת'}

**תאריך לכידה:** ${dateStr}
**מזהה מקורי:** \`${dec.id || 'N/A'}\`
**משתמש:** \`${dec.userId || 'N/A'}\`
**סמנים:** ${dec.riskBadge || ''} | ${dec.affectBadge || ''}

## המלל הגולמי שנלכד
> ${dec.rawVerbatim || ''}

## מטרות / מה אתה שוקל
${dec.goal || ''}
${dec.question ? `\n**שאלת ההארה:**\n> ${dec.question}` : ''}

## תצפיות (Observations)
${dec.observations || ''}

## הנחות עבודה (Assumptions)
${dec.assumptions || ''}

## קריטריון הכרעה / חוזה (Contract Criterion)
${dec.contractCriterion || ''}
`;
        fs.writeFileSync(path.join(adrDir, fileName), md, 'utf8');
    });
    
    console.log(`Successfully migrated ${decisions.length} decisions to ${adrDir}`);
    
    // Rename old file so it's not confusing, but keep it for safety
    const mdPath = path.join(projectRoot, 'DECISION_CYCLES.md');
    if (fs.existsSync(mdPath)) {
        fs.renameSync(mdPath, path.join(projectRoot, 'DECISION_CYCLES_ARCHIVED.md'));
        console.log('Renamed DECISION_CYCLES.md to DECISION_CYCLES_ARCHIVED.md');
    }
} catch (e) {
    console.error('Error migrating JSON:', e);
}
