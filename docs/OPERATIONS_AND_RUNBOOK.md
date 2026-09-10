# מדריך תפעול, סביבות והרצה שוטפת (Operations & Runbook) — הד | Echo
**גרסה:** 1.0.0 | **תאריך:** ספטמבר 2026 | **סיווג:** נוהל תפעול והנדסה (DevOps & Operations)

---

## 1. מבוא וסקירת סביבת העבודה (Overview)

מערכת **"הד" (Echo)** בנויה כ-Monorepo מודולרי מבוסס `npm workspaces` ו-Turborepo. המערכת כוללת אפליקציית לקוח מתקדמת (Mobile-First Web App / PWA), ספריית טיפוסים משותפת (Single Source of Truth), שירותי שרת ומנוע AI היברידי, ותשתיות ענן ב-Firebase.

מדריך זה מרכז את כלל הפקודות, נהלי ההרצה המקומית, ניהול הסודות, תהליכי הפריסה (Deployment) ופתרון תקלות תפעוליות בזמן אמת.

---

## 2. דרישות קדם והתקנה ראשונית (Prerequisites & Setup)

### דרישות תוכנה:
* **Node.js:** גרסה 20.x ומעלה (LTS מומלצת).
* **npm:** גרסה 10.x ומעלה.
* **Firebase CLI:** מותקן גלובלית לצורך בדיקות ענן ופריסה:
  ```bash
  npm install -g firebase-tools
  ```

### התקנת סביבת העבודה:
1. שכפול המאגר והתקנת כל התלויות בשורש ה-Monorepo:
   ```bash
   git clone <repository_url>
   cd ECHO
   npm install
   ```
2. קימפול חבילת הטיפוסים המשותפת (`@echo/shared`):
   ```bash
   npm run build --workspace=@echo/shared
   ```
   *(שלב זה קריטי! אפליקציית המובייל ושירותי השרת תלויים ב-artifacts של `packages/shared/dist`).*

---

## 3. הרצה מקומית של רכיבי המערכת (Local Development)

### א. הרצת אפליקציית הלקוח (Mobile-First PWA)
האפליקציה פועלת באמצעות **Vite** ומספקת חוויית פיתוח מהירה ב-Hot Module Replacement (HMR):
```bash
# משורש הפרויקט
npm run dev --workspace=@echo/mobile

# או ישירות מתוך תיקיית האפליקציה
cd apps/mobile
npm run dev
```
* **כתובת מקומית:** `http://localhost:5173`
* האפליקציה מותאמת הן לתצוגת מובייל מלאה בסמארטפון והן לתצוגת Desktop הממוסגרת במוקאפ מובייל יוקרתי.

### ב. הרצת שירותי השרת ומדמי ה-Firebase (Local Emulators)
לבדיקת פונקציות ענן וחוקי אבטחה מקומית ללא חיוב ענן:
```bash
firebase emulators:start --only functions,firestore,storage
```
* **Firestore Emulator UI:** `http://localhost:4000/firestore`
* **Functions Emulator:** `http://localhost:5001/<project-id>/us-central1/`

---

## 4. ניהול קונפיגורציה, מפתחות וסודות (Configuration & Secrets)

המערכת פועלת בארכיטקטורה היברידית הדורשת הגדרות סביבה עבור הלקוח והשרת:

### א. קובץ קונפיגורציה ללקוח (`apps/mobile/env-config.js`)
האפליקציה טוענת קונפיגורציה גלובלית בזמן טעינת ה-HTML:
```javascript
window.ENV_CONFIG = {
  GEMINI_API_KEY: "AIzaSy...", // מפתח Google Gemini API
  FIREBASE_CONFIG: {
    apiKey: "AIzaSy...",
    authDomain: "echo-project.firebaseapp.com",
    projectId: "echo-project",
    storageBucket: "echo-project.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  }
};
```
* **Fallback למפתח AI:** אם לא הוגדר מפתח ב-`ENV_CONFIG`, המערכת תבדוק את `localStorage.getItem('GEMINI_API_KEY')` או תשתמש במפתח הגיבוי המקודד ב-[aiService.ts](file:///c:/Users/guyku/costs/ECHO/apps/mobile/src/services/aiService.ts).

### ב. קובץ סביבה לשירותי השרת (`packages/backend/.env`)
```bash
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-..."       # אופציונלי (במידה ומשתמשים ב-OpenAiProvider)
AI_PROVIDER="gemini"          # ערכים: gemini | openai | local
FIRESTORE_EMULATOR_HOST=""   # להשאיר ריק בסביבת ייצור
```

---

## 5. תהליך הבנייה והפריסה (Build & Deployment Pipeline)

### שלב 1: אימות טיפוסים ובדיקות (Pre-deploy Verification)
לפני כל פריסה יש לוודא שאין שגיאות טיפוסים ב-Monorepo:
```bash
# קימפול החבילה המשותפת
npm run build --workspace=@echo/shared

# בדיקת טיפוסים ובניית ה-Frontend
npm run build --workspace=@echo/mobile

# בדיקת קימפול ה-Backend
npm run build --workspace=@echo/backend
```

### שלב 2: פריסת אפליקציית ה-Frontend (Hosting)
האפליקציה נבנית לתיקיית `apps/mobile/dist` ונפרסת ל-Firebase Hosting:
```bash
cd apps/mobile
npm run build
cd ../..
firebase deploy --only hosting
```

### שלב 3: פריסת שירותי הענן (Cloud Functions v2)
פריסת כל הפונקציות ה-Callable והטריגרים האסינכרוניים:
```bash
firebase deploy --only functions
```

### שלב 4: פריסת חוקי אבטחה ואינדקסים (Security Rules & Indexes)
עדכון חוקי ה-Firestore, ה-Storage והאינדקסים המורכבים:
```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

---

## 6. תפעול תקלות ושחזור (Troubleshooting & Disaster Recovery)

| תסמין / תקלה | סיבת שורש אפשרית | נוהל פתרון מיידי |
| :--- | :--- | :--- |
| **הודעת "תקלת תקשורת עם מנוע ה-AI"** | חריגת Quota במפתח ה-Gemini או שגיאת רשת | 1. האפליקציה מציגה כפתור "נסה שוב עם אותה הלכידה".<br>2. ניתן לעדכן מפתח ידנית דרך ה-Console: `localStorage.setItem('GEMINI_API_KEY', 'NEW_KEY')`.<br>3. לוודא זמינות שירותי Google Cloud. |
| **החלטות לא נטענות ביומן (Journal ריק)** | חסימת Web SDK ע"י חוסם פרסומות / חומת אש | המערכת עוברת אוטומטית ל-Tier 2 (Firestore REST API) ול-Tier 3 (`DECISION_CYCLES.json`). יש לוודא שהקובץ הסטטי מוגש בנתיב הראשי. |
| **שגיאת טיפוסים בייבוא מ-`@echo/shared`** | חבילת ה-shared לא קומפלה לאחר שינוי | יש להריץ `npm run build --workspace=@echo/shared` ולרענן את ה-Vite dev server. |
| **חריגת הרשאה ב-Firestore (Permission Denied)** | אי-התאמה בין `request.auth.uid` למזהה המסמך | לוודא שהמשתמש מחובר דרך `firebaseAuth.ts` ושהמסמך נשמר תחת `/users/{UID}/decisions/*`. |

---

## 7. גיבוי ויצוא נתונים (Data Backup & Export)

* **גיבוי מקומי מהדפדפן:**
  כל ההחלטות של המשתמש הפעיל מגובות אוטומטית ב-`localStorage` תחת המפתח `echo_decisions_<username>`.
* **סנכרון ויצוא מקובץ JSON:**
  מאגר 38 מחזורי ההחלטה המאומתים שמור בקובץ [DECISION_CYCLES.json](file:///c:/Users/guyku/costs/ECHO/DECISION_CYCLES.json). בכל הוספת מקרה חדש ביומן, הוא נשמר הן בענן והן בזיכרון המקומי. ניתן לייצא את כלל הרשומות באמצעות פקודת יצוא ייעודית במסך ה-TopDrawer או דרך ה-Firestore Console.
