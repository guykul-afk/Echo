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

---

## 7. מונה עלות טוקנים ומעקב ביצועים (Token Cost & Performance Tracking)

כחלק מתשתית המערכת בסביבת ייצור (Production), יוטמע מנגנון למעקב מדויק אחר צריכת הטוקנים ועלויות ה-LLM לכל פעולה בודדת במערכת (למשל: `createDecisionCase`, `submitIntervention`). 
המטרה: שקיפות פיננסית, הבנת עלות ממוצעת למשתמש (Cost per User/Session), ואופטימיזציה של פרומפטים ומודלים.

### 7.1. מיקום בארכיטקטורה
המנגנון ימומש בשכבת ה-Backend (Firebase Cloud Functions). כל קריאה לספק ה-AI (Gemini/OpenAI) תעבור דרך מעטפת (Wrapper / Interceptor) שתנהל את המדידה. הנתונים יישמרו לקולקשן ייעודי ב-Firestore בשם `TokenUsageLogs` (באופן אסינכרוני כדי לא לעכב את התגובה ללקוח).

### 7.2. הערכה (Estimation) מול בפועל (Actual)
לכל קריאת מודל, המערכת תבצע שני שלבי מדידה:

1. **שלב ההערכה מראש (Pre-flight Estimation):**
   - **קלט (Input):** המערכת תשתמש ב-API המקומי של המודל (כגון פונקציית `countTokens` ב-Gemini SDK) על ה-Prompt המלא לפני שליחתו. נתון זה הינו **מדויק לחלוטין**.
   - **פלט (Output):** כיוון שלא ידוע כמה טוקנים המודל ייצר, הפלט יוערך על בסיס ממוצע היסטורי של אותה פעולה (למשל, 150 טוקנים לחילוץ ממדים), או לחלופין לפי הגבלת ה-`max_output_tokens` שהוגדרה בקריאה כחסם עליון משוער.
   - **עלות משוערת:** חישוב עלות הקלט (מדויק) + פלט (משוער) לפי מחירון המודל העדכני.

2. **שלב המדידה בפועל (Post-flight Actuals):**
   - **חילוץ נתוני אמת:** לאחר חזרת התשובה מה-API, המערכת תקרא את אובייקט ה-`usageMetadata` (המכיל `promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`).
   - **עלות בפועל:** חישוב העלות הכוללת והמדויקת בדולרים (USD) עבור הקריאה הספציפית.
   - **זמן ריצה (Latency):** חישוב זמן התגובה (ms) מרגע השליחה ועד קבלת התשובה המלאה.

### 7.3. סכמת נתונים (Data Model: TokenUsageLog)

```yaml
Entity: TokenUsageLog
Metadata:
  type: telemetry_record
Schema Fields:
  - id: String (PK, Auto-generated)
  - user_id: String (FK)
  - case_id: String (FK)
  - action_name: String (e.g., "extract_5_dimensions", "generate_insight")
  - model_name: String (e.g., "gemini-1.5-pro")
  
  # מודדים והערכות
  - estimated_input_tokens: Number
  - estimated_output_tokens: Number
  - estimated_total_cost_usd: Number
  
  # נתוני אמת לאחר ריצה
  - actual_input_tokens: Number
  - actual_output_tokens: Number
  - actual_total_cost_usd: Number
  - latency_ms: Number
  
  - timestamp: Timestamp
```

### 7.4. ניצול המידע ואנליטיקה
- **פער הערכה/אמת (Delta):** ניטור קבוע של הפער בין ה-`estimated_output` ל-`actual_output` כדי לכוונן את הממוצעים בקריאות הבאות.
- **הגבלת משאבים (Quotas):** מנגנון הגנה ברמת משתמש למניעת חריגות חיוב (לדוגמה, חסימה של משתמש שביצע יותר מ-X קריאות ביום).
- **ניתוב מודלים חכם (Model Routing):** במידה והעלות לפעולה חורגת, המערכת יכולה להוריד (Fallback) באופן זמני למודל חסכוני יותר (כגון `gemini-1.5-flash`) עבור פעולות פשוטות.

### 7.5. פירוט מנגנוני ה-AI והערכת עלויות פרטנית
המעקב יבדיל ויתעד באופן נפרד כל מנגנון תפעולי (Feature) העובד מול המודל כדי לאפשר אופטימיזציה פרטנית:

1. **מנגנון חילוץ ממדים ושאלת התערבות (`createDecisionCase`)**
   - **אפיון פעולה:** עיבוד טקסט גולמי וארוך (דיבור של המשתמש), בניית מבנה JSON של 5 ממדים ושאלת התערבות אחת.
   - **הערכת עלות אופיינית:**
     - **קלט (Input):** גבוה/משתנה בהתאם לאורך ההקלטה (כ-500 עד 2000 טוקנים).
     - **פלט (Output):** בינוני וקבוע יחסית (כ-250 טוקנים ליצירת ה-JSON).
   - **בקרת עלות:** זהו המנגנון היקר ביותר. במידה והקלט ארוך מאוד, ניתן לשקול ניתוב למודל ביניים, או ביצוע Chunking.

2. **מנגנון חיווי התחדדות - לפני ואחרי (`submitIntervention`)**
   - **אפיון פעולה:** המודל מקבל את תשובת המשתמש לשאלת ההארה ואת הממדים הקיימים, ומזקק את התובנה לשני משפטים (קודם חשבת / כעת התחדד).
   - **הערכת עלות אופיינית:**
     - **קלט (Input):** בינוני (היסטוריית הדילמה + תשובה קצרה, כ-400 טוקנים).
     - **פלט (Output):** נמוך מאוד וממוקד (כ-50-100 טוקנים).
   - **בקרת עלות:** מנגנון זול יחסית, אך דורש יכולת הסקה (Reasoning) גבוהה. מעקב יוודא שהמודל לא מייצר "הזיות" או טקסט עודף.

3. **מנגנון זיקוק וסגירת מעגל למידה (`updateOutcomeLoop`)**
   - **אפיון פעולה:** לאחר זמן, המשתמש מזין תוצאות בפועל. ה-AI עשוי להתבקש למצות את הפער בין ההנחה המקורית למציאות לתוך "זיכרון" תמציתי.
   - **הערכת עלות אופיינית:**
     - **קלט (Input):** נמוך-בינוני.
     - **פלט (Output):** נמוך (כ-100 טוקנים).
   - **בקרת עלות:** פעולת רקע שאינה רגישה לזמן תגובה (Low Latency requirement), ולכן ניתן לנתב אותה תמיד למודלים קטנים וזולים יותר (`Flash`), מה שיוזיל משמעותית את עלות תשתית הזיכרון.

### 7.6. מנגנון התרעה ודיווח על סטיות תחזית (Prediction Drift & Anomaly Alerting)
כדי למנוע "עיוורון עלויות" ולשמור על מודל חיזוי מדויק, יוטמע מנגנון בקרת איכות סטטיסטי מבוסס חלון נע:

1. **הגדרת מדד החריגה (Drift Metric):**
   - עבור כל מנגנון/פעולה (`action_name`), המערכת מחשבת עבור כל הרצה את אחוז הסטייה:
     $$\text{Gap Ratio} = \frac{|\text{actual\_total\_cost} - \text{estimated\_total\_cost}|}{\text{estimated\_total\_cost}}$$
   - המערכת מנהלת חלון נע של **10 ההרצות האחרונות** (Sliding Window of 10 Runs) עבור כל סוג פעולה בנפרד.

2. **תנאי להפעלת התרעה (Alert Trigger):**
   - כאשר ממוצע הסטיות ב-10 ההרצות האחרונות עולה על **50%** ($\overline{\text{Gap Ratio}}_{10} > 0.50$):
     - מופק אירוע אנומליה מסוג `PREDICTION_DRIFT_ALERT`.

3. **ערוצי דיווח ופעולות תגובה:**
   - **ערוץ לוגים והתרעות פיתוח (DevOps & Telemetry):**
     - שליחת הודעה מידית לערוץ Slack ייעודי של צוות הפיתוח / Webhook.
     - כתיבת לוג `WARN/CRITICAL` ב-Google Cloud Logging / Firebase Functions עם תיוג ייעודי.
   - **תוכן הדיווח:**
     - שם המנגנון והמודל (`action_name`, `model_name`).
     - ממוצע טוקנים משוער מול ממוצע בפועל ב-10 ההרצות.
     - אחוז החריגה המדויק (למשל: "פער ממוצע של 64% ב-10 הרצות אחרונות").
     - פירוט ה-IDs של ההרצות החריגות לבחינה מהירה.
   - **כיול אוטומטי (Auto-Calibration Flag):**
     - המערכת תסמן את מקדמי ההערכה של הפעולה כדורשים כיול מחדש (Re-baseline), ובמידת הצורך תעדכן את ברירת המחדל של ה-`estimated_output_tokens` על בסיס החציון (Median) של ההרצות האחרונות.
