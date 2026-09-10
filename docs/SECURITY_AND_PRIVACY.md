# מפרט אבטחת מידע, פרטיות ובידוד נתונים (Security & Privacy) — הד | Echo
**גרסה:** 1.0.0 | **תאריך:** ספטמבר 2026 | **סיווג:** מדיניות אבטחת מידע ובידוד נתונים (Zero-Trust)

---

## 1. מבוא ומודל האיומים (Threat Model & Context)

מערכת **"הד" (Echo)** משמשת כשותף לחשיבה (Thinking Partner) ברגעי הכרעה ואי-ודאות. המידע הנלכד במערכת כולל את הדילמות הרגישות והאינטימיות ביותר של מנהלים, יזמים ומשקיעים: משאים ומתנים סודיים, פיטורים וגיוסי בכירים, סכסוכי שותפים, מצוקות תזרים מזומנים והתלבטויות אישיות.

**עקרון העל של אבטחת המידע ב"הד":**
> **"פרטיות מוחלטת ובידוד נתונים הרמטי (Zero-Trust Data Isolation) — שום משתמש אינו יכול לראות, לנחש או לשלוף מידע או אנלוגיות של משתמש אחר, גם לא במקרה של תקלת תוכנה."**

---

## 2. מודל בידוד נתונים בענן (Path-Based Multi-Tenancy)

המערכת מיישמת ארכיטקטורת אבטחה ברמת הרשומה (Row-Level Security) באמצעות חוקי Firebase אטומיים:

### א. חוקי Firestore ([firebase/firestore.rules](file:///c:/Users/guyku/costs/ECHO/firebase/firestore.rules))
כל מסמכי המערכת נשמרים בהיררכיה פרטית תחת ה-Path של ה-`userId`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. חסימת כל גישה גלובלית כברירת מחדל
    match /{document=**} {
      allow read, write: if false;
    }
    
    // 2. בידוד הרמטי של נתיב המשתמש
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 3. תאימות למסמכי שורש היסטוריים (קריאה/כתיבה לבעלים בלבד)
    match /decisions/{decisionId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.user_id == request.auth.uid || resource.data.userId == request.auth.uid);
    }
  }
}
```

### מאפייני האכיפה:
* **אימות ברמת הפלטפורמה:** שום קריאה אינה מסתמכת על פרמטר שנשלח בגוף הבקשה (Body). הזיהוי נקבע אך ורק מתוך אסימון ה-JWT המאומת של Firebase Authentication (`request.auth.uid`).
* **חסימת שאילתות רוחביות (Collection Group Queries):** משתמש אינו יכול לבצע חיפוש רוחבי על קולקשן `decisions` של משתמשים אחרים.

---

### ב. חוקי Cloud Storage ([firebase/storage.rules](file:///c:/Users/guyku/costs/ECHO/firebase/storage.rules))
הקלטות קול וקבצי מדיה נשמרים בנתיב ייעודי ומבודד:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recordings/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. ניהול זהויות ואימות משתמשים (Identity & Auth)

1. **ספקי אימות נתמכים ([firebaseAuth.ts](file:///c:/Users/guyku/costs/ECHO/apps/mobile/src/services/firebaseAuth.ts)):**
   * **Google Social Sign-In:** אימות מהיר מבוסס OAuth 2.0 (תמיכה במעבר חלון וב-Redirect Mode).
   * **אימות דוא"ל וסיסמה:** למשתמשים המעדיפים הפרדה מחשבונות Google.
   * **User Switcher מנוטר:** ממשק פנימי המאפשר החלפת פרופילים מבוקרת (עבור מייסדי המערכת) תוך שמירת הפרדה מלאה ב-`localStorage`.
2. **ניהול Token ורענון:**
   * ה-SDK של Firebase מנהל רענון שקט של אסימוני JWT כל 60 דקות ללא צורך בהתערבות המשתמש.

---

## 4. מדיניות AI ואי-אימון מודלים (Zero Data Retention)

החשש המרכזי של מנהלים בעבודה מול מודלי AI הוא שמידע עסקי רגיש ישמש לאימון מודלי העתיד של ספקי ה-AI.

### התחייבויות האבטחה מול ספקי ה-AI:
1. **Google Gemini API (Enterprise / Commercial Tier):**
   * המערכת פונה ל-API המסחרי של Google Cloud (Vertex AI / Google AI Studio API).
   * לפי תנאי השירות המסחריים של Google, **שום מידע שנשלח ב-API (Prompts או Completions) אינו נשמר לצורכי אימון או שיפור של מודלי הבסיס**.
2. **אנונימיזציה ברמת המודל:**
   * הפרומפטים נשלחים כטקסט בלבד ללא שיוך למזהה המשתמש או כתובת הדוא"ל שלו.
3. **בידוד שאילתות וקטוריות:**
   * כל שאילתת חיפוש דמיון סמנטי או מבני מוגבלת באמצעות Pre-Filter קשיח המחייב `userId == request.auth.uid`. אין אפשרות לשליפת אנלוגיה של משתמש זר.

---

## 5. אבטחת מפתחות צד לקוח (Client-Side Key Hardening)

כיוון שהאפליקציה פועלת בארכיטקטורה היברידית ומבצעת קריאות מהירות מתוך הלקוח:
1. **הגבלת מפתחות ב-Google Cloud Console (API Restrictions):**
   * הגבלת המפתח ל-API של **Generative Language API** בלבד.
   * הגבלת מקורות HTTP (Application Restrictions) לדומיין הייצור המורשה ול-`localhost` לצורכי פיתוח בלבד.
2. **הפרדת מפתחות:** מפתח ה-Gemini של צד הלקוח מוגבל ב-Rate Limits ו-Daily Quotas למניעת ניצול לרעה.

---

## 6. זכויות המשתמש ומחיקת מידע (Right to Erasure & Export)

בהתאם לעקרונות GDPR ותקנות הגנת הפרטיות:
* **יצוא נתונים מלא (Data Portability):** המשתמש יכול לייצא בכל עת את כלל מחזורי ההחלטה שלו כקובץ JSON מלא מתוך ממשק ה-TopDrawer.
* **מחיקה הרמטית (Right to be Forgotten):** מחיקת מקרה החלטה מוחקת את הרשומה ב-Firestore, את ההקלטה ב-Storage, ואת המפתחות המקומיים ב-`localStorage`.
