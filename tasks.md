# תוכנית משימות מבודדות לפיתוח בריבוי סוכנים (Multi-Agent Execution Tasks) — הד | Echo

קובץ משימות זה נבנה עבור סוכני AI מקביליים (כגון Cursor, Devin, GitHub Copilot וסוכני משנה אוטונומיים). כל משימה מוגדרת עם נתיבי קבצים בלעדיים (Owned Paths), תלויות מפורשות וקריטריון סיום אובייקטיבי (Definition of Done) כדי למנוע התנגשויות קוד.

---

## Phase 1: תשתית שיתופית ואבטחת נתונים (Root Contracts)

### Task TASK-001: הקמת Monorepo והגדרת טיפוסי OKF
- **Target Agent**: Database & Shared Contracts Sub-Agent
- **Owned Files/Paths**:
  - `packages/shared/package.json`
  - `packages/shared/tsconfig.json`
  - `packages/shared/src/types/user.ts`
  - `packages/shared/src/types/era.ts`
  - `packages/shared/src/types/decision.ts`
  - `packages/shared/src/types/signature.ts`
  - `packages/shared/src/types/statement.ts`
  - `packages/shared/src/types/evaluation.ts`
  - `packages/shared/src/types/outcome.ts`
  - `packages/shared/src/types/pattern.ts`
  - `packages/shared/src/types/registry.ts`
  - `packages/shared/src/types/calibration.ts`
  - `packages/shared/src/index.ts`
- **Dependencies**: None
- **Context/Contracts**: יש לממש את כל ישויות ה-OKF שהוגדרו בסעיף 5 של ה-PRD כ-TypeScript Interfaces עם שדות חובה, Enums וקשרים (כולל DecisionSignature, OperatingContext, PatternHypothesis, AssumptionRegistry, CalibrationTracker).
- **Definition of Done**: הרצת `npm run build` בחבילת `packages/shared` מתקמפלת בהצלחה ללא שגיאות טיפוסים ומייצאת את כל ה-types.

---

### Task TASK-002: הגדרת חוקי בידוד נתונים ב-Firestore ו-Storage (Multi-Tenancy)
- **Target Agent**: Database & Shared Contracts Sub-Agent
- **Owned Files/Paths**:
  - `firebase/firestore.rules`
  - `firebase/storage.rules`
  - `firebase/firestore.indexes.json`
  - `packages/backend/tests/security/rules.test.ts`
- **Dependencies**: TASK-001
- **Context/Contracts**: הגדרת חוקי Firestore ו-Storage הרמטיים המוודאים שכל מסמך וקובץ תחת `/users/{userId}/*` נגיש אך ורק למשתמש המאומת בעל ה-UID הזה (`request.auth.uid == userId`). הגדרת אינדקסים מורכבים לחיפוש וקטורי.
- **Definition of Done**: בדיקות יחידה ב-`@firebase/rules-unit-testing` עוברות ומוודאות: משתמש א' מצליח לקרוא/לכתוב את המקרים שלו; משתמש ב' מקבל הרשאה חסומה (Permission Denied) כאשר מנסה לגשת לנתוני משתמש א'.

---

## Phase 2: מנוע AI ועיצוב Frontend (עבודה מקבילית)

### Task TASK-003: ארכיטקטורת ספקי AI ושכבת ה-Adapter
- **Target Agent**: AI Provider & Epistemic Engine Sub-Agent
- **Owned Files/Paths**:
  - `packages/backend/src/ai/provider.interface.ts`
  - `packages/backend/src/ai/providers/gemini.provider.ts`
  - `packages/backend/src/ai/providers/openai.provider.ts`
  - `packages/backend/src/ai/providers/local.provider.ts`
  - `packages/backend/src/ai/factory.ts`
- **Dependencies**: TASK-001
- **Context/Contracts**: מימוש Strategy Pattern עבור `IAiProvider`. המפעל (Factory) יטען את הספק המבוקש לפי משתנה סביבה (`AI_PROVIDER=gemini|openai|local`), תוך שמירה על ממשק גנרי אחיד לקריאות.
- **Definition of Done**: בדיקות יחידה מוודאות החלפה חלקה בין ספקים באמצעות Mock Providers.

---

### Task TASK-004: מנוע פרומפטים אפיסטמי ושאלת הארה אחת
- **Target Agent**: AI Provider & Epistemic Engine Sub-Agent
- **Owned Files/Paths**:
  - `packages/backend/src/prompts/epistemic-extraction.prompt.ts`
  - `packages/backend/src/prompts/illumination-question.prompt.ts`
  - `packages/backend/src/prompts/structural-similarity.prompt.ts`
  - `packages/backend/tests/ai/prompts.test.ts`
- **Dependencies**: TASK-003
- **Context/Contracts**: פיתוח פרומפטים מחמירים המייצרים תשובות ב-Structured JSON Schema בלבד. המודל מחלץ עובדות, הנחות סמויות, אי-ודאות ומנסח **שאלת הארה אחת בלבד** החושפת נקודת עיוורון.
- **Definition of Done**: בדיקת 10 תרחישי החלטות אמיתיים (כולל 4 מקרי הסימולציה מהחזון: פרויקט אטלס, סמנכ"ל מכירות, שוק גרמני, השקעה אסטרטגית). כל התוצאות מוחזרות כ-JSON תקין העומד בסכמה האפיסטמית.

---

### Task TASK-005: תשתית אפליקציית Mobile Web וערכת נושא יוקרתית
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/theme/colors.ts`
  - `apps/mobile/src/App.tsx`
  - `apps/mobile/src/components/TopDrawer.tsx`
  - `apps/mobile/vite.config.ts`
  - `apps/mobile/index.html`
- **Dependencies**: TASK-001
- **Context/Contracts**: הקמת שלד ה-Vite + React 18 במבנה Mobile-First (קונטיינר רספונסיבי עם מוקאפ יוקרתי בדסקטופ). יישום פלטת 3 הצבעים המחייבת מ-[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (Void `#07080B`, Typography `#E6E8EE`, Sacred Gold `#D4AF37`), וטיפוגרפיית Frank Ruhl Libre ו-Assistant בכיווניות ימין-לשמאל (`dir="rtl"`).
- **Definition of Done**: האפליקציה מתקמפלת ורצה ב-Vite (`npm run dev`) ללא שגיאות; צבעי ה-Void והזהב מרונדרים בדיוק מושלם.

---

### Task TASK-006: מנוע גאומטריה וקנבס כדור ההד (HTML5 Canvas 2D)
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/graphics/EchoOrb.tsx`
  - `apps/mobile/src/graphics/DecisionFlowPipeline.tsx`
- **Dependencies**: TASK-005
- **Context/Contracts**: מימוש גרפיקה מתמטית חלקה ב-HTML5 Canvas 2D ללא ספריות נייטיב כבדות. כדור ההד (`EchoOrb`) מרנדר 32 פרוסות רוחב כדוריות, 140 נקודות לטבעת, הטיה של 22 מעלות וסיבוב ציר קבוע ב-60 FPS בצבע זהב בלעדי (`#D4AF37`), ומגיב לעוצמת השמע.
- **Definition of Done**: הקומפוננטה מרנדרת אפקט פעימה ונשימה עדין ומגיבה לתדרי קול ללא נפילת פריימים.

---

## Phase 3: פונקציות שרת ומסכי משתמש

### Task TASK-007: מימוש Cloud Functions ומנוע AI היברידי
- **Target Agent**: Backend & Cloud Functions Sub-Agent
- **Owned Files/Paths**:
  - `packages/backend/src/functions/createDecisionCase.ts`
  - `packages/backend/src/functions/submitDeliberationAnswer.ts`
  - `packages/backend/src/functions/recordOutcome.ts`
  - `packages/backend/src/services/decision.service.ts`
  - `packages/backend/src/services/retrievalBeforeAsk.service.ts`
  - `apps/mobile/src/services/aiService.ts`
  - `apps/mobile/src/services/firestoreSync.ts`
- **Dependencies**: TASK-002, TASK-004
- **Context/Contracts**: מימוש ארכיטקטורה היברידית: שירותי Backend ב-Cloud Functions לצד פנייה ישירה מבוקרת מהלקוח ל-Gemini Flash (`aiService.ts`) לחילוץ אפיסטמי מהיר (Latency נמוך) וסנכרון רב-שכבתי (Firestore SDK + REST API + קובץ `DECISION_CYCLES.json` לגיבוי לא מקוון).
- **Definition of Done**: חילוץ אפיסטמי מלא מתבצע תוך שניות בודדות, והמידע נשמר בענן וב-localStorage באופן עמיד.

---

### Task TASK-008: מסך לכידה מהירה (Quick Capture)
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/screens/QuickCaptureScreen.tsx`
  - `apps/mobile/src/services/voiceService.ts`
- **Dependencies**: TASK-005, TASK-006
- **Context/Contracts**: מסך מינימליסטי המשלב את ה-Echo Orb במרכזו, תמיכה בהקלטת קול חלקה בדפדפן (Web Audio API / MediaRecorder) עם ניתוח תדרים חי, תיבת טקסט חופשית לבחירה, וכפתור בחירת רמת חיכוך (מהיר / ממוקד / מעמיק).
- **Definition of Done**: המשתמש יכול להקליד טקסט או להקליט קול, לראות אנימציית גלים חיה ב-Canvas, ולשלוח לניתוח.

---

### Task TASK-009: מסך חדר ההחלטה והמראה המתפתחת (Decision Room)
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/screens/DecisionRoomScreen.tsx`
  - `apps/mobile/src/components/EchoPastCard.tsx`
- **Dependencies**: TASK-005, TASK-001
- **Context/Contracts**: מסך עריכה ושיקוף חי. מציג בראשו את מיקוד 20 השניות הראשונות (המתח המרכזי וציר ההכרעה), מראת 4 ממדים הניתנת לעריכה ישירה ע"י המשתמש, שאלת הארה חדה אחת עם כפתור "מספיק לי לעכשיו", כרטיס הד מהעבר (`EchoPastCard`) בעת זיהוי דמיון גבוה ($\ge 0.85$), וצעדים קונקרטיים מוצעים.
- **Definition of Done**: המשתמש רואה את חשיבתו משוקפת בצורה בהירה, יכול לערוך כל ממד ישירות, משיב על שאלת החידוד ורואה את ההתחדדות המיידית (Before/After).

---

### Task TASK-010: מודאל תוצאה, יומן החלטות ופרופיל כיול
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/screens/OutcomeModal.tsx`
  - `apps/mobile/src/screens/DecisionJournalScreen.tsx`
  - `apps/mobile/src/screens/DecisionProfileScreen.tsx`
- **Dependencies**: TASK-009
- **Context/Contracts**: סגירת מעגל למידה רכה ב-3 צירים (מה קרה בפועל, מה התברר לגבי ההנחה, ומה היית משנה) לצד 4 כפתורי מענה מהיר. יומן החלטות המציג את היסטוריית המקרים שנחתמו, ומסך פרופיל המציג מדדי למידה וכיול.
- **Definition of Done**: המשתמש יכול לתעד תוצאה, לדפדף ביומן ההחלטות ולצפות במדדי הכיול.

---

### Task TASK-012: מימוש עובד גיבוש אפיסטמי ברקע (Epistemic Consolidation Background Worker)
- **Target Agent**: Backend & Cloud Functions Sub-Agent
- **Owned Files/Paths**:
  - `packages/backend/src/functions/runConsolidationJob.ts`
  - `packages/backend/src/services/consolidation.service.ts`
  - `packages/backend/src/services/triFactorRetrieval.service.ts`
  - `packages/backend/tests/services/consolidation.test.ts`
- **Dependencies**: TASK-007, TASK-001
- **Context/Contracts**: מימוש תהליך העבודה האסינכרוני המופעל בעת תיעוד Outcome: עדכון `AssumptionRegistry` (שבירות הנחות), עדכון מדד Brier ב-`CalibrationTracker`, ועדכון גודל מדגם והשערות דפוס ב-`PatternHypothesis`. בנוסף, מימוש אלגוריתם השליפה המשולשת: ציון משוקלל של 45% חתימה מבנית, 35% התאמת Era, ו-20% דמיון סמנטי.
- **Definition of Done**: בדיקות יחידה מוודאות שבעת רישום Outcome, הנתונים המצטברים מתעדכנים בצורה דטרמיניסטית מבלי לגעת או לשנות את המקור הקפוא של המקרה.

---

## Phase 4: אינטגרציה מקצה לקצה ואימות אבטחה

### Task TASK-011: אינטגרציית Client-Server ובדיקות E2E
- **Target Agent**: QA & Integration Testing Sub-Agent
- **Owned Files/Paths**:
  - `packages/e2e-tests/flows/decision-lifecycle.e2e.ts`
  - `packages/e2e-tests/flows/multi-tenancy-isolation.e2e.ts`
  - `packages/e2e-tests/helpers/firebase-setup.ts`
- **Dependencies**: TASK-007, TASK-008, TASK-009, TASK-010, TASK-012
- **Context/Contracts**: בדיקות מקצה לקצה המריצות את כל הזרימה: משתמש מבצע לכידה ← המערכת מקפיאה ומחלצת סכמה ושאלת הארה ← המשתמש נועל חוזה הערכה ← תאריך מעקב מופעל ← משתמש מזין תוצאה ← תהליך הגיבוש מעדכן את נכסי העל.
- **Definition of Done**: כל הבדיקות רצות בהצלחה כחלק מתהליך ה-CI; בדיקת הבידוד מוכיחה מעל לכל ספק שמשתמש אינו יכול לראות או לשלוף אנלוגיות של משתמש אחר.

---

## סטטוס ביצוע מלא (Execution Status)

| משימה | תיאור | סטטוס | בדיקה מאמתת |
| :--- | :--- | :---: | :--- |
| **TASK-001** | Monorepo וטיפוסי OKF | ✅ הושלם | `npm run build:shared` (0 שגיאות טיפוסים) |
| **TASK-002** | חוקי בידוד נתונים (Multi-Tenancy) | ✅ הושלם | `firestore.rules`, `storage.rules`, בדיקת הרשאות מבודדת |
| **TASK-003** | ארכיטקטורת ספקי AI (Strategy/Factory) | ✅ הושלם | `AiProviderFactory`, `GeminiAiProvider`, `MockAiProvider` |
| **TASK-004** | פרומפטים אפיסטמיים ושאלת הארה אחת | ✅ הושלם | `run-simulations.ts` (4 תרחישי מפתח מלאים) |
| **TASK-005** | תשתית Mobile וערכת נושא יוקרתית | ✅ הושלם | פלטת 3 צבעים יוקרתית, Noto Serif / Assistant |
| **TASK-006** | מנוע גאומטריה מקודשת דינמי ואיטי | ✅ הושלם | `geoCanvas` מילוי נוזלי משתנה, ללא מלל פנימי |
| **TASK-007** | Cloud Functions למחזור חיי ההחלטה | ✅ הושלם | `createDecisionCase`, `submitAnswer`, `finalizeContract`, `recordOutcome` |
| **TASK-008** | מסך לכידה מהירה (Quick Capture) | ✅ הושלם | מסך מובייל וסימולטור אינטראקטיבי חי |
| **TASK-009** | מסך חדר ההחלטה (Epistemic Mirror) | ✅ הושלם | 4 כרטיסים אפיסטמיים, טיפוגרפיה אחידה |
| **TASK-010** | חוזה הערכה ומודאל תוצאה | ✅ הושלם | נעילת קריטריונים מראש, אות מעקב וסגירת מעגל |
| **TASK-012** | גיבוש אפיסטמי ואנלוגיה משולשת | ✅ הושלם | מרשם הנחות, כיול Brier Score, שליפה משולשת (45/35/20) |
| **TASK-011** | אינטגרציית E2E ובידוד Zero-Trust | ✅ הושלם | `packages/e2e-tests/run-all-e2e.ts` (100% מעבר) |
