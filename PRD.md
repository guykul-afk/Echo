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
| **מבנה הפרויקט** | **Monorepo (Turborepo / npm workspaces)** | שיתוף טיפוסים (`packages/shared`) למניעת אי-התאמות. |
| **Frontend Mobile** | **React 18 + Vite (Mobile-First Web App / PWA)** | אפליקציית Web מותאמת מובייל (עם מעטפת מוקאפ יוקרתית בדסקטופ), ריצה מהירה ב-Vite, התקנת PWA. |
| **אנימציה וגרפיקה** | **HTML5 Canvas 2D Engine (`EchoOrb`)** | רינדור מתמטי חלק של כדור ההד (32 פרוסות, 140 נקודות לטבעת, הטיה ופעימות תדרי קול). |
| **עיצוב וממשק** | **Luxury Minimalist Theme (`DESIGN_SYSTEM.md`)** | פלטת 3 צבעים בלבד (Void, Pearl White, Sacred Gold), טיפוגרפיית Frank Ruhl Libre ו-Assistant, כיווניות RTL מלאה. |
| **Backend & Cloud** | **Firebase Cloud Functions v2 & Direct AI Engine** | ארכיטקטורה היברידית: שירותי Backend ב-TypeScript ופנייה ישירה מבוקרת ל-Gemini Flash ו-Firestore REST מהלקוח. |
| **מסד נתונים** | **Firebase Firestore & Local Cache** | תמיכה ב-Offline ו-Realtime, סנכרון רב-שכבתי (SDK + REST + קובץ גיבוי מקומי `DECISION_CYCLES.json`). |
| **AI Provider** | **Google Gemini (2.5 / 1.5 Flash) & Strategy Pattern** | ניתוח אפיסטמי מהיר, חילוץ סכמת OKF, זיהוי מתח מרכזי ושאלת הארה חדה. |

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
  
  # The 5 Human Dimensions & First 20 Seconds Focus
  - dim_consideration: String (הדילמה: מה עומד על הפרק)
  - central_tension: String (המתח המרכזי: מה עומד מול מה ברמת הערכים והמחירים)
  - key_hinge: String (ציר ההכרעה: נראה שההכרעה תלויה בעיקר ב...)
  - dim_goals_prices: String (מטרות ומחירים: מה להשיג ועל מה לשמור)
  - dim_facts: String (עובדות קשיחות: נתונים מאומתים שהתרחשו בפועל)
  - dim_assumptions: String (הנחות ופרשנויות: 1 עד 3 השערות וציפיות)
  - dim_missing_info: String (מידע חסר להחלטה: פער המידע המרכזי)
  
  # Insights & Interventions
  - ai_intervention_used: String (איזו שאלת הארה חדה הופעלה, אם בכלל)
  - historical_intervention_used: String (שאלת עבר מותנית בעת זיהוי תקדים דומה)
  - past_echo_match: Object (תקדים עבר מתוך קטלוג 38 המקרים עם ציון דמיון ולקח)
  - next_step: String (הצעד הנבחר)
  - proposed_steps: Array[String] (1-2 צעדים קונקרטיים מוצעים לבירור מוקדם)
  - refined_insight: String (תצוגת התחדדות לפני/אחרי)
  
  # OKF Horizon 2 Deep Mechanisms
  - operating_principles: Array[String] (כללי אצבע ועקרונות שיקול דעת)
  - tradeoffs: Array[{protectedValue, sacrificedValue}] (ויתורים מודעים בין ערכים)
  - boundary_conditions: Array[String] (תנאי סף וסייגים לקיום ההנחות)
  
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
  
  # User Reflection (3-Axis Reflection + Quick Status)
  - what_happened: String (מה קרה בפועל)
  - assumption_clarification: String (מה התברר לגבי ההנחה שלך)
  - process_reflection: String (מה היית משנה בדיעבד בדרך בחינת ההחלטה)
  - quick_status: Enum [succeeded_as_expected, failed_due_to_assumption, lucky_unexpected, still_unfolding, clarified, not_yet, irrelevant]
```

---

## 4. פיצ'רים מרכזיים וזרימת משתמש (Core Features)

### 4.1. לכידה ופירוק סמוי (Quick Capture)
המשתמש מקליט (Web Audio API) או מקליד את הדילמה (Zero Friction). כדור ההד המרכזי (`EchoOrb`) פועם על גבי קנבס HTML5 Canvas בהתאם לתדרי הקול. ברקע, ה-AI מנתח 9 ממדים אפיסטמיים ומתרגם אותם לשיקוף מיידי.

### 4.2. מיקוד 20 השניות הראשונות והמראה המתפתחת (The First 20 Seconds & Editable Mirror)
בכניסה לחדר ההחלטה (`DecisionRoomScreen`), המשתמש רואה מיד:
- **המתח המרכזי וציר ההכרעה:** הדגשה מיידית של מה עומד מול מה ואיזה נתון יכריע את הכף.
- **המראה האנושית לעריכה (Editable Mirror):** "אתה שוקל", "חשוב לך להשיג/לשמור", "עובדות קשיחות", "ההנחות שלך" ו-"מידע חסר". המשתמש יכול לתקן כל שדה ישירות.

### 4.3. שליפת הדים מהעבר (Historical Echo Precedent)
אם מזוהה מקרה עבר בעל דמיון גבוה ($\ge 0.85$) מתוך מאגר 38 מחזורי ההכרעה המאומתים (`DECISION_CYCLES.json`), מופיע כרטיס זהב ייעודי (`EchoPastCard`) המציג את הדילמה ההיסטורית, מה נלמד אז, ושאלה מותנית המונעת חזרה על שגיאות עבר.

### 4.4. בחירת התערבות דינמית (Adaptive Intervention & Smart Silence)
מנוע ה-AI בוחר שאלת הארה אחת בלבד (או שותק אם התיאור שלם):
- זיהוי שתי מטרות מתחרות / דיסוננס.
- הנחה משמעותית ללא בסיס מפורש.
- כפתור "מספיק לי לעכשיו" המאפשר דילוג מיידי לסגירה.

### 4.5. תצוגת חיווי התחדדות (Before/After Insight)
מיד לאחר מענה לשאלה או בחירת צעד, מוצג השינוי בחשיבה:
- קודם חשבת: ...
- כעת התחדד: ...
- הצעד שבחרת: ... (עם אפשרות לבחור מתוך 1-2 צעדים מוצעים או להזין צעד חופשי).

### 4.6. יומן החלטות ופרופיל כיול (Decision Journal & Calibration)
- **יומן החלטות (`DecisionJournalScreen`):** תיעוד כל המקרים שנחתמו, סינון לפי סטטוסים ותגיות, וצפייה בהתפתחות שיקול הדעת לאורך זמן.
- **פרופיל וכיול (`DecisionProfileScreen`):** מעקב אחר כמות הלכידות, אחוז סגירת המעגלים, ודיוק ההנחות.

---

## 5. ממשקים וארכיטקטורת נתונים היברידית

המערכת פועלת בארכיטקטורה היברידית המשלבת קליינט רספונסיבי עם שירותי ענן:
- **פנייה ישירה מבוקרת ל-Gemini Flash (`aiService.ts`):** מאפשרת ניתוח אפיסטמי מיידי (Latency נמוך) ללא תלות ב-Cold Starts של Functions.
- **שירותי Backend בענן (`packages/backend`):** Cloud Functions v2 (`createDecisionCase`, `submitDeliberationAnswer`, `recordOutcome`, `retrievePrecedents`) עבור תהליכים מורכבים ואיחוד אפיסטמי.
- **סנכרון רב-שכבתי ל-Firestore (`firestoreSync.ts`):** 
  1. קריאה/כתיבה ב-Firestore SDK.
  2. Fallback שקוף ל-Firestore REST API (עוקף חסימות רשת ומאפשר תאימות מלאה).
  3. Fallback מקומי לקובץ `DECISION_CYCLES.json` להבטחת עבודה רציפה במצב לא מקוון.

---

## 6. ריבוי סוכנים (Multi-Agent Orchestration)

המערכת מתוחזקת באמצעות מודולריות המותאמת לסוכני AI מקביליים:
1. **Shared Contracts Agent:** מתחזק את חוזי ה-TypeScript ב-`packages/shared` (ללא שגיאות טיפוסים).
2. **AI & Prompts Agent:** מכייל פרומפטים ב-`packages/backend/src/prompts` וב-`apps/mobile/src/services/aiService.ts` לחילוץ אפיסטמי נקי ללא הזיות.
3. **Frontend UI Agent:** מפתח ומתחזק את ממשק ה-React 18 / Vite ב-`apps/mobile`, תוך ציות קפדני ל-`DESIGN_SYSTEM.md`.
4. **Data & Security Agent:** אמון על חוקי ה-Firestore (`firestore.rules`) ובידוד המשתמשים ב-Multi-Tenancy.

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
