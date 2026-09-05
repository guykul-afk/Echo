# מסמך אפיון ודרישות מוצר (PRD) — הד | Echo
**תשתית לזיכרון הלומד של שיקול הדעת האנושי**
גרסה: 2.0.0 | תאריך: ספטמבר 2026 | סטטוס: מוכן לפיתוח מבוזר (Multi-Agent)

---

## 1. מבט על וחזון המוצר (Overview & Product Vision)

### 1.1 תקציר המוצר
**הד (Echo)** היא תשתית לזיכרון הלומד של שיקול הדעת האנושי: מערכת Mobile-First המלווה את האדם ברגע קבלת החלטה משמעותית תחת אי-ודאות. המערכת משמשת כ"מראה מתפתחת" לדילמות אנושיות, מציגה 4 ממדים פשוטים הניתנים לעריכה, מתאימה את רמת ההתערבות שלה לדילמה עצמה ומראה באופן מיידי כיצד התחדדה חשיבתו של האדם. המטרה היא עזרה קוגניטיבית עם מינימום חיכוך.

### 1.2 מהות ורוח הרעיון
שיקול דעת אנושי נשען על ניסיון, ערכים, אינטואיציה ואחריות — אלמנטים שמודלים כלליים אינם יכולים להחליף. 
עקרון היסוד של "הד":
- **האדם במרכז:** ה-AI אינו שופט, אינו נותן "ציונים" (כגון Decision Quality Score) ואינו מחליט.
- **התאמת החיכוך (Adaptive Friction):** מהחלטה מהירה ועד בחינה מעמיקה, למשתמש שמורה הזכות להגיד "מספיק לי לעכשיו".
- **ענווה אפיסטמית:** המערכת פועלת בשפה רכה ("הבנתי שחשוב לך..." במקום "זו המטרה שלך").

---

## 2. טכנולוגיות וארכיטקטורה (Tech Stack)

| שכבה | טכנולוגיה | רציונל והתאמה |
| :--- | :--- | :--- |
| **מבנה הפרויקט** | **Monorepo (Turborepo)** | שיתוף טיפוסים (`packages/shared`) למניעת אי-התאמות. |
| **Frontend Mobile** | **React Native (Expo 51+) עם TypeScript** | תמיכה ב-iOS ו-Android מקוד יחיד. |
| **אנימציה וגרפיקה** | **Shopify React Native Skia** | 120 FPS בחומרה, רינדור גלי "הד". |
| **עיצוב וממשק** | **NativeWind (Tailwind)** | Dark Mode, אפקטי Glassmorphism. |
| **Backend & Cloud** | **Firebase Cloud Functions v2** | Serverless עם תמיכה ב-TypeScript. |
| **מסד נתונים** | **Firebase Firestore** | תמיכה ב-Offline ו-Realtime. |
| **AI Provider** | **AI Strategy Pattern** | תמיכה ב-Gemini / OpenAI / Anthropic. |

---

## 3. מודל נתונים (Data Model / DB Schema)

המודל נבנה לתמיכה בלמידה מתמשכת, מבלי לכפות תוצאות בינאריות נוקשות.

### 3.1 הגדרת הישויות (Entities)

```yaml
Entity: User
Metadata:
  type: actor
Schema Fields:
  - id: String (PK, Firebase Auth)
  - email: String
  - created_at: Timestamp

---

Entity: DecisionCase
Metadata:
  type: core_record
Schema Fields:
  - id: String (PK, UUID)
  - user_id: String (FK)
  - raw_capture_text: String
  - friction_level: Enum [quick, focused, deep]
  - status: Enum [captured, deliberating, monitoring, closed, irrelevant]
  
  # The 5 Human Dimensions (Editable)
  - dim_consideration: String (הדילמה)
  - dim_goals_prices: String (מטרות ומחירים)
  - dim_facts: String (עובדות קשיחות)
  - dim_assumptions: String (הנחות ופרשנויות)
  - dim_missing_info: String (מידע חסר להחלטה)
  
  # Insights & Interventions
  - ai_intervention_used: String (איזו שאלת הארה הופעלה, אם בכלל)
  - next_step: String (הצעד הנבחר)
  - refined_insight: String (תצוגת לפני/אחרי)
  
  - created_at: Timestamp
  - updated_at: Timestamp

---

Entity: OutcomeLoop
Metadata:
  type: continuous_reflection
  description: סגירת מעגל רכה המחליפה את חוזה ההצלחה/כישלון הנוקשה
Schema Fields:
  - id: String (PK)
  - case_id: String (FK)
  - review_date: Timestamp
  - loop_status: Enum [pending, updated, irrelevant]
  
  # User Reflection (Multi-axis)
  - what_happened: String (מה קרה בפועל)
  - assumption_clarification: String (מה התברר לגבי ההנחה שלך)
  - process_reflection: String (מה היית משנה בדיעבד בתהליך)
```

---

## 4. פיצ'רים מרכזיים וזרימת משתמש (Core Features)

### 4.1. לכידה ופירוק סמוי
המשתמש מקליט את הדילמה. ברקע, ה-AI מנתח 9 ממדים אפיסטמיים (כולל רמות ביטחון ודיסוננס), אך מתרגם אותם ל-4 שאלות נגישות למראה.

### 4.2. המראה המתפתחת (Editable Mirror)
ה-UI אינו Read-Only. המערכת מציגה:
- "אתה שוקל X"
- "הבנתי שחשוב לך Y"
- "זה משקף אותך?" -> עריכה חיה.

### 4.3. בחירת התערבות דינמית (Adaptive Intervention)
מנוע ה-AI בוחר אחת מהתערבויות מבוססות הקשר (או בוחר שלא להתערב כלל אם הטקסט שלם):
- שתי מטרות מתחרות.
- התחייבות קשה לביטול (אל-חזור).
- אם המשתמש לוחץ "מספיק לי לעכשיו", המסלול מסתיים ללא חפירות נוספות.

### 4.4. תצוגת חיווי התחדדות (Before/After)
לאחר סיום הסשן, מוצג מיד השינוי בחשיבה:
- קודם חשבת: ...
- כעת התחדד: ...
- הצעד שבחרת: ...

### 4.5. לולאת למידה מתמשכת (Outcome Loop)
פינג עדין מזכיר למשתמש לבחון את הנושא. במקום לבחור הצלחה/כישלון, המשתמש מזין טקסט חופשי קצר על מה שקרה למעשה, מה הוא למד על ההנחה, ומה היה משנה.

---

## 5. ממשקים ו-APIs

### `createDecisionCase` (Callable)
- מקבל: `rawText`
- מחזיר: ה-5 ממדים המחולצים (`dim_consideration`, וכו') ושאלת התערבות ממוקדת (`intervention_question`).

### `updateMirror` (Callable)
- מקבל: תיקוני המשתמש לסכמה.

### `submitIntervention` (Callable)
- מקבל: תשובה להתערבות.
- מחזיר: אובייקט חיווי התחדדות (`refined_insight`).

### `updateOutcomeLoop` (Callable)
- מקבל: תשובות ל-3 צירי הלמידה (מה קרה, הנחות, שינוי).

---

## 6. ריבוי סוכנים (Multi-Agent Orchestration)

המערכת תפותח באמצעות מספר סוכני AI (Sub-Agents):
1. **Database Agent:** מגדיר את ה-Firestore Schema (ללא `CalibrationTracker` הישן).
2. **AI Provider Agent:** מקנפג פרומפטים דינמיים המחלצים 4 ממדים, שאלת התערבות וטקסט ההתחדדות.
3. **Backend Agent:** מקודד את פונקציות ה-API.
4. **Mobile UI Agent:** כותב את React Native (מסך עריכה, Before/After).
