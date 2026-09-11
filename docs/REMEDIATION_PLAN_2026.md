# תכנית הפעולה לתיקון עומק ארכיטקטוני — Echo (ספטמבר 2026)

> **סטטוס:** שמורה להפעלה.  
> **מועד מתוזמן לתחילת ביצוע:** יום ראשון, 13 בספטמבר 2026, 10:00 בבוקר.  
> **בסיס הדוח:** ביקורת עומק ארכיטקטונית מיום 10 בספטמבר 2026 בעקבות Commit `c2ce931`.

---

## 🛑 שלב 0: עצירת חשיפה וסגירת פרצות מיידית (Immediate Containment)

### פעולות טכניות לביצוע ע"י הסוכן:
1. **הסרת מפתחות וסודות גלויים (F-05):**
   - מחיקת מפתחות Base64 מתוך `apps/mobile/src/services/aiService.ts` ו-`voiceService.ts`.
   - החלפתם בזריקת שגיאה מסודרת הדורשת העברת טוקן מאובטח מהשרת, או קריאה ל-Firebase Functions.
   - ניקוי מפתחות `FIRESTORE_API_KEY` הגלויים בסקריפטים:
     - `scripts/migrate-founder-decisions.js`
     - `scripts/unseal-poisoned-decisions.js`
     - `scripts/sync-decisions.js`
2. **הסרת שרת ה-Legacy המסוכן (F-17):**
   - מחיקת `apps/mobile/serve.js` לחלוטין כדי למנוע משטח תקיפה של שרת לא-מאומת.
3. **הסרת מידע אישי וקבצים היסטוריים (F-06):**
   - מחיקת תיקיית `docs/adr/` (37 קבצי ADR אישיים).
   - מחיקת הקובץ `DECISION_CYCLES_ARCHIVED.md` (184KB של החלטות אישיות).
4. **נעילת קולקשן `/decision_cases` (F-03):**
   - עדכון `firebase/firestore.rules` כך ש-`/decision_cases` יהיה סגור לקריאה חופשית של כל משתמש מאומת, ויוגבל לבעלים בלבד עד להקמת מנגנון Anonymization ייעודי.
5. **פסילת אשליית ה-E2E הנוכחי (F-14):**
   - בידוד ה-mock ב-`packages/e2e-tests` ואי-הצגתו כבדיקת אבטחה אמיתית של שרת.

### פעולות באחריות המפתח (בקונסולות חיצוניות):
- [ ] **GitHub:** העברת ה-Repository ל-Private באופן מיידי.
- [ ] **Google Cloud / Firebase Console:** סיבוב (Rotate) וביטול מפתחות ה-API שנחשפו.
- [ ] **Git History:** הרצת `git filter-repo` להסרת הקבצים האישיים והסודות מההיסטוריה.

---

## 🔒 שלב 1: זהות ומודל נתונים קנוני (Canonical Identity & Data Model)

1. **ביטול Free-Text Username והתחזות (F-02):**
   - הסרת תיבת הטקסט החופשי ב-`UserAuthModal`.
   - חיוב התחברות אמיתית דרך Google / Apple.
   - ביסוס זיהוי המשתמש אך ורק על גבי `auth.currentUser.uid`.
2. **הטמעת Auth Gate ב-`App.tsx`:**
   - הוספת מאזין `onAuthStateChanged`.
   - חסימת כניסה למסכי ה-Capture וה-Journal ללא אימות מאומת.
3. **ייחוד סכמת הנתונים:**
   - מעבר לנתיב קנוני יחיד: `/users/{uid}/decisionCases/{caseId}`.
   - הפסקת הכתיבה המפוצלת ל-`/decisions` ול-`/users/{displayName}`.

---

## ⚡ שלבים 2-4 (בקצרה)
- **שלב 2:** בניית Firebase Functions v2 אמיתיות (`onCall`), העברת מנוע ה-Gemini לשרת (Secret Manager), ויצירת Repositories עמידים ב-Firestore ללא הסתמכות על זיכרון RAM.
- **שלב 3:** החזרת בחירת הצעד למשתמש (`chosenStep`), הפעלת Adaptive Friction אמיתית וחיבור ה-Outcome Loop.
- **שלב 4:** הגדרת CI מלא, הרצת Firebase Local Emulator, ובדיקות E2E אמינות.
