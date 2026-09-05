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

### Task TASK-005: תשתית אפליקציית Mobile וערכת נושא יוקרתית
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/theme/*`
  - `apps/mobile/src/navigation/RootNavigator.tsx`
  - `apps/mobile/src/components/common/ScreenContainer.tsx`
  - `apps/mobile/src/components/common/Typography.tsx`
  - `apps/mobile/tailwind.config.js`
- **Dependencies**: TASK-001
- **Context/Contracts**: הקמת שלד ה-Expo, תצורת NativeWind ו-TypeScript. יישום פלטת צבעי Luxury Dark Mode (גרפיט עמוק `#0D0E12`, טקסט פנינה `#F4F4F5`, הדגשות ענבר `#F59E0B`), תמיכה ב-SafeArea ו-Navigation Stack.
- **Definition of Done**: האפליקציה רצה ב-Expo ללא אזהרות; מסך בסיס מציג את הטיפוגרפיה והצבעים המוגדרים בצורה מדויקת.

---

### Task TASK-006: מנוע גלים ואפקט הד ב-Shopify React Native Skia
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/graphics/EchoOrb.tsx`
  - `apps/mobile/src/graphics/RippleShaders.ts`
  - `apps/mobile/src/graphics/PulsingAura.tsx`
- **Dependencies**: TASK-005
- **Context/Contracts**: מימוש גרפיקה דינמית מואצת חומרה ב-Skia. כדור ההד (Echo Orb) מגיב למצב הקלטה (פועם ומתרחב לפי עוצמת הקול / אנימציית נשימה חלקה ב-60–120 FPS).
- **Definition of Done**: הקומפוננטה מרנדרת אפקט תאורה עדין ומגיבה לפרמטרים דינמיים ללא נפילת פריימים במכשיר/סימולטור.

---

## Phase 3: פונקציות שרת ומסכי משתמש

### Task TASK-007: מימוש Cloud Functions עבור מחזור חיי ההחלטה
- **Target Agent**: Backend & Cloud Functions Sub-Agent
- **Owned Files/Paths**:
  - `packages/backend/src/functions/createDecisionCase.ts`
  - `packages/backend/src/functions/submitDeliberationAnswer.ts`
  - `packages/backend/src/functions/finalizeEvaluationContract.ts`
  - `packages/backend/src/functions/recordOutcome.ts`
  - `packages/backend/src/services/vectorSearch.service.ts`
  - `packages/backend/src/index.ts`
- **Dependencies**: TASK-002, TASK-004
- **Context/Contracts**: מימוש הפונקציות ה-Callable ב-Firebase Functions v2. ביצוע הקפאה מקורית של הטקסט, חילוץ סכמה, יצירת וקטור דמיון מבני, שמירה ב-Firestore, וחיפוש KNN מבודד למשתמש הנוכחי בלבד.
- **Definition of Done**: הפונקציות רצות מקומית ב-Firebase Emulator; קריאות בדיקה עם Bearer Token מבודד שומרות את המידע ומחזירות סכמה אפיסטמית תקינה.

---

### Task TASK-008: מסך לכידה מהירה (Quick Capture)
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/screens/QuickCaptureScreen.tsx`
  - `apps/mobile/src/components/capture/AudioRecorderButton.tsx`
  - `apps/mobile/src/components/capture/TextInputBox.tsx`
  - `apps/mobile/src/hooks/useAudioRecording.ts`
- **Dependencies**: TASK-005, TASK-006
- **Context/Contracts**: מסך מינימליסטי המשלב את ה-Echo Orb במרכזו, תמיכה בהקלטת קול (Expo AV) עם חיווי ויזואלי, ושדה טקסט חופשי. כפתור "הקפא והאר" מעביר נתונים הלאה.
- **Definition of Done**: המשתמש יכול להקליד טקסט או להקליט קול, לראות אנימציית גלים חלקה, וללחוץ על שליחה המפעילה מעבר למסך חדר ההחלטה.

---

### Task TASK-009: מסך חדר ההחלטה ומראת החשיבה (Decision Room)
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/screens/DecisionRoomScreen.tsx`
  - `apps/mobile/src/components/deliberation/FrozenOriginalCard.tsx`
  - `apps/mobile/src/components/deliberation/EpistemicSchemaView.tsx`
  - `apps/mobile/src/components/deliberation/IlluminationCard.tsx`
  - `apps/mobile/src/components/deliberation/AnalogousCasesCarousel.tsx`
- **Dependencies**: TASK-005, TASK-001
- **Context/Contracts**: מסך לקריאה בלבד ללא עריכה. מציג כרטיס מקור נעול (`🔒 Frozen`), בלוקים נקיים של עובדות, הנחות ואי-ודאות, כרטיס בולט עם שאלת ההארה האחת ומקום להשיב עליה, וקרוסלת מקרים דומים מתחת.
- **Definition of Done**: המסך מציג באופן קריא ואלגנטי את הסכמה מול Mock Data או מול שרת; שאלת ההארה מובילה להזנת תשובה ולמעבר לחוזה הערכה.

---

### Task TASK-010: מסך חוזה הערכה ומודאל תוצאה (Evaluation & Outcome)
- **Target Agent**: Frontend UI & Graphics Sub-Agent
- **Owned Files/Paths**:
  - `apps/mobile/src/screens/EvaluationContractScreen.tsx`
  - `apps/mobile/src/screens/OutcomeModal.tsx`
  - `apps/mobile/src/components/contract/CriteriaPicker.tsx`
- **Dependencies**: TASK-009
- **Context/Contracts**: מסך הגדרת קריטריון הצלחה מדויק מראש ומועד בדיקה. מודאל התוצאה מאפשר תיעוד קצר של מה קרה בפועל ובחינת תקיפות הקריטריון.
- **Definition of Done**: המשתמש יכול לנעול מקרה, להגדיר תאריך, ולצפות במודאל סגירת מעגל מתפקד.

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
