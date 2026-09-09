# משימות שדרוג אבטחה לריבוי משתמשים (Multi-Agent Execution Tasks)

## Task TASK-001: שדרוג מסד הנתונים ואבטחה
- **Target Agent**: Backend & Security Agent
- **Owned Files/Paths**: `firebase/firestore.rules`, `firebase/firebase.json`
- **Dependencies**: None
- **Context/Contracts**: עליך ליצור חוקים שמאפשרים קריאה וכתיבה ל-`DecisionCase` ולפרופיל המשתמש אך ורק אם המשתמש מאומת ו-`request.auth.uid` זהה לשדה `user_id` ברשומה.
- **Definition of Done**: בדיקות באמולטור מוכיחות גישה חסומה עבור בקשות לא מזוהות או ממשתמשים זרים.

---

## Task TASK-002: עדכון פונקציות הענן ויצירת הגירה
- **Target Agent**: Backend & Security Agent
- **Owned Files/Paths**: `firebase/functions/src/index.ts`, `firebase/functions/src/controllers/*`
- **Dependencies**: TASK-001
- **Context/Contracts**: 
  1. שדרוג פונקציות קיימות לקרוא מתוך ה-Token במקום לקבל `user_id` חשוף כפרמטר.
  2. בניית פונקציית `migrateLegacyData` שמקבלת `old_id` (למשל Local UUID) ומשנה ב-Firestore את שדות ה-`user_id` של כל המסמכים הקיימים לאלו של ה-UID החדש `request.auth.uid`.
- **Definition of Done**: פונקציות מגיבות 401 עבור כשל אימות. פונקציית ההגירה עובדת בצורה תקינה.

---

## Task TASK-003: הוספת ממשק התחברות ל-Mobile
- **Target Agent**: Frontend UI & Auth Agent
- **Owned Files/Paths**: `apps/expo/src/screens/LoginScreen.tsx`, `apps/expo/src/hooks/useAuth.ts`, `apps/expo/App.tsx` (or Navigation root)
- **Dependencies**: None
- **Context/Contracts**: הוספת Google Sign-In ו-Apple Sign-In, יצירת מסך יפה שחוסם גישה למערכת. שמירת ה-Auth State ברמת האפליקציה ב-Context.
- **Definition of Done**: ניתן להתחבר והאפליקציה אינה עבירה למשתמש לא מאומת.

---

## Task TASK-004: אינטגרציה של מנגנון ההגירה ב-Frontend
- **Target Agent**: Frontend UI & Auth Agent
- **Owned Files/Paths**: `apps/expo/src/hooks/useAuth.ts`, `apps/expo/src/screens/LoginScreen.tsx`
- **Dependencies**: TASK-002, TASK-003
- **Context/Contracts**: לאחר התחברות ראשונית, עליך לבדוק אם קיים במכשיר מזהה מקומי (Local Storage). במידה וכן, לקרוא לפונקציית הענן `migrateLegacyData` שנכתבה ע"י ה-Backend Agent ולהציג מסך טעינה שקוף בזמן ההעברה.
- **Definition of Done**: משתמש קיים נכנס דרך גוגל ומיד לאחר מכן רואה את רשימת הדילמות ההיסטוריות שלו.
