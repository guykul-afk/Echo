---
name: echo
colors:
  surface: '#0c1420'
  surface-dim: '#07080b'
  surface-bright: '#323947'
  surface-container-lowest: '#050608'
  surface-container-low: '#0c1420'
  surface-container: '#151c28'
  surface-container-high: '#19202c'
  surface-container-highest: '#232a37'
  on-surface: '#e6e8ee'
  on-surface-variant: '#8e95a5'
  inverse-surface: '#e6e8ee'
  inverse-on-surface: '#07080b'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#d4af37'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#edbf70'
  on-secondary: '#422c00'
  secondary-container: '#6a4a01'
  on-secondary-container: '#e9bc6c'
  tertiary: '#cccdda'
  on-tertiary: '#2d303a'
  tertiary-container: '#b0b2bf'
  on-tertiary-container: '#42454f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffdea9'
  secondary-fixed-dim: '#edbf70'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#e0e2ef'
  tertiary-fixed-dim: '#c4c6d3'
  on-tertiary-fixed: '#181b25'
  on-tertiary-fixed-variant: '#444651'
  background: '#07080b'
  on-background: '#e6e8ee'
  surface-variant: '#2e3542'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  quote-italic:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 80px
---

# מסמך עיצוב ומערכת ממשק (Design System & UI/UX) — הד | Echo
**גרסה: 2.0.0 | תאימות מלאה: Google Stitch / StitchMCP | כיווניות: RTL (עברית) / LTR**

---

## 1. פילוסופיית העיצוב (Brand & Style Philosophy)

מערכת **"הד" (Echo)** היא תשתית לזיכרון הלומד של שיקול הדעת האנושי. המערכת איננה עוד לוח מחוונים עמוס (Dashboard), ואיננה טופס בירוקרטי או צ'אט בוט קופצני. היא סביבה דיגיטלית המיועדת ל**מחשבה עמוקה, רפלקציה שקטה ובהירות קוגניטיבית (Contemplative Computing)**.

### עקרונות הליבה של השפה החזותית:
1. **Atmos Dark (חושך אטמוספרי עמוק):** רקע שחור-אובסידיאן (`#07080B`) ללא זיהום אור, המפחית עומס קוגניטיבי ומאפשר עיבוד מחשבתי שקט.
2. **Hairline Gold Accents:** שימוש מאופק ומדויק בזהב אצילי (`#D4AF37` / `#F2CA50`) עבור מוקדי פוקוס, הדגשות עדינות וקווי מתאר בעובי 1px בלבד.
3. **ענווה אפיסטמית (Epistemic Humility):** הממשק אינו שופט, אינו מציג ציונים מלאכותיים (ללא Decision Quality Score), ואינו מדבר בסמכותיות. השפה מנוסחת ברכות: *"הבנתי שחשוב לך..."* במקום *"המטרה שנקבעה"*.
4. **המראה המתפתחת (The Editable Mirror):** כל תוכן שחולץ מוצג כטיוטה גמישה הניתנת לעריכה מיידית בלחיצת מגע (`זה משקף אותך? הקלק לעריכה`).
5. **חיכוך מותאם (Adaptive Friction):** מסלול מהיר ללא חפירות מיותרות; כפתור יציאה נגיש תמיד: *"מספיק לי לעכשיו — שמור והמשך"*.
6. **פיזיקה מואצת חומרה (Shopify Skia Engine):** כדור ההד המרכזי (`EchoOrb`) נושם ומגיב לעוצמת הקול (Audio RMS) בהילות אור רפלקטיביות.

---

## 2. פלטת צבעים וטוקנים (Colors & Tokens)

| שם הטוקן | קוד Hex | תפקיד בממשק |
| :--- | :--- | :--- |
| `background` | `#07080B` | קנבס החלל העמוק (The Void Canvas). שחור-אובסידיאן מוחלט. |
| `surface` | `#0C1420` | משטחי רקע לשכבות תוכן וכרטיסים בסיסיים. |
| `surface-container` | `#151C28` | כרטיסי Bento, תיבות קלט ומשטחי עבודה מוגבהים. |
| `surface-container-high`| `#19202C` | משטח מודגש עבור שאלת ההארה וקומפוננטות אקטיביות. |
| `primary` | `#F2CA50` | זהב חי — כפתורי פעולה ראשיים, קווי ספקטרום קולי, אייקון מיקרופון. |
| `primary-container` | `#D4AF37` | זהב אצילי מוצק לאלמנטי מיקוד, תגיות יוקרה וגבולות פעילים. |
| `secondary` | `#EDBF70` | ענבר חם — כותרות משנה, קווי הדגשה ומצבי ציפייה. |
| `on-surface` | `#E6E8EE` | טיפוגרפיה ראשית — לבן-פנינה יוקרתי ברמת ניגודיות גבוהה ונעימה. |
| `on-surface-variant` | `#8E95A5` | טיפוגרפיה משנית, תוויות מטה-דאטה והסברים נלווים. |
| `outline-variant` | `#4D4635` | גבולות זכוכית דקיקים (1px Hairline) המפרידים בין כרטיסים. |
| `surface-tint` | `#D4AF37` | הילה אטמוספרית (Glow) רכה בגב אלמנטים פעילים. |

### אפקט זכוכית (Glassmorphism):
* **משטח זכוכית כהה:** `background: rgba(21, 28, 40, 0.65)`, `backdrop-filter: blur(24px)`.
* **מסגרת זכוכית דקה (Hairline Border):** `border: 1px solid rgba(212, 175, 55, 0.20)`.
* **הילה סביבתית (Ambient Glow):** `box-shadow: 0 0 30px rgba(242, 202, 80, 0.08)`.

---

## 3. טיפוגרפיה וחוקי כיווניות (Typography & RTL Rules)

* **כותרות ומוקדי תצוגה (Headlines):** גופן סריפי **Noto Serif** (עברית ואנגלית). מעניק סמכות עריכתית, כבוד ועומק מחשבתי (Editorial Luxury).
* **טקסט רץ ותוויות (Body & Labels):** גופן סנס-סריפי מודרני **Plus Jakarta Sans** (עברית ואנגלית). חללים פתוחים לקריאה רהוטה ומהירה של מחשבות ונתונים.
* **חוקי RTL קפדניים:**
  - יישור טקסט ימינה כברירת מחדל (`dir="rtl"`).
  - נקודת הפוקוס העיקרית של כרטיסים היא בפינה הימנית-עליונה.
  - חצים ואינדיקטורי המשך פונים שמאלה (`arrow_back` / `arrow_left`).
  - שוליים פנימיים וחיצוניים מוזחים בהתאמה (Start = ימין, End = שמאל).

---

## 4. רכיבי ממשק מרכזיים (Core UI Component Library)

### 4.1. כדור ההד המרכזי (Sacred Echo Orb)
* **ייעוד:** לב החוויה הוויזואלית במסך הלכידה.
* **מבנה:**
  - טבעת חיצונית דקה המסתובבת באיטיות (`sacred-ring`, 20s).
  - טבעת אמצעית הפוכה בכיוון הסיבוב (`sacred-ring-reverse`, 25s).
  - ליבת אור פועמת (`sacred-orb`) עם מפל צבעי זהב-ענבר.
  - אייקון מיקרופון מרכזי בגודל 36px בצבע `primary`.
  - פעימת נשימה בזמן הקשבה (התרחבות והתכווצות חלקה 60–120 FPS).

### 4.2. פסי גלי קול מינימליסטיים (Waveform Bars)
* 8 פסי ספקטרום דקיקים (2px) בגבהים דינמיים שבין 4px ל-24px עם אנימציית קפיצה רכה (`wave-bounce`) לפי עוצמת הדיבור.

### 4.3. כרטיסי Bento של 5 הממדים האנושיים (The 5 Human Dimensions)
1. **אתה שוקל (The Consideration):** הדילמה המרכזית בניסוח חד ובהיר.
2. **מה חשוב לי / מטרות ומחירים (Goals & Prices):** ערכים ומתחים בין מטרות מתחרות.
3. **עובדות קשיחות (Hard Facts):** מה שכבר קרה ואומת בשטח.
4. **ההנחות שלי (Assumptions):** פרשנויות אישיות והשערות שטרם הוכחו.
5. **המידע החסר להחלטה (Missing Info / Unknowns):** שאלות פתוחות ונתונים קריטיים שיש לברר.
* **אינטראקטיביות:** כל כרטיס כולל כפתור עריכה מהיר ואינדיקטור: *"זה משקף אותך? הקלק לעריכה"*.

### 4.4. תיבת שאלת ההארה (Single Illumination Question Box)
* מסגרת בולטת עם הדגשת קצה ימני בצבע זהב מלא (`border-r-2 border-primary`).
* טקסט ציטוט נטוי בגודל `quote-italic` (20px).
* שדה מענה מינימליסטי עם קו תחתון דק וכפתור שליחה עגול.

### 4.5. תגית אנלוגיה מבנית (Structural Analogy Pill)
* מציגה התאמה למקרים דומים מהעבר: *"התאמה מבנית 89% למקרה קודם"*.
* לחיצה פותחת את הלקח שנלמד אז כדי להאיר את ההווה.

### 4.6. כרטיס חיווי ההתחדדות (Insight Flash Card)
* השוואת עמודות ברורה:
  - **קודם חשבת:** החשש המקורי והעמום.
  - **כעת התחדד:** התובנה המזוקקת וחידוד ההנחה.
  - **הצעד שבחרת:** פעולת הבירור הקונקרטית והממוקדת.

### 4.7. מודאל סגירת מעגל רכה (3-Axis Outcome Loop Modal)
* אינו שואל "הצלחת או נכשלת?", אלא פותח 3 צירי חשיבה:
  1. *מה קרה בפועל?*
  2. *מה התברר לגבי ההנחה שלך?*
  3. *מה היית משנה בדיעבד בתהליך?*
* כפתורי סטטוס מקוצרים: `ביררתי` | `עדיין לא` | `כבר לא רלוונטי`.

---

## 5. ארכיטקטורת מסכי המערכת (Screen Architecture & Wireframes)

```
+-------------------------------------------------------------------------+
|                              ECHO APP FLOW                              |
+--------------------+--------------------+-------------------------------+
|  1. QUICK CAPTURE  | 2. EDITABLE MIRROR | 3. INSIGHT FLASH & OUTCOME    |
|                    |                    |                               |
|   [ TopAppBar ]    |   [ TopAppBar ]    |   [ TopAppBar ]               |
|                    |                    |                               |
|    ( EchoOrb )     |  [ 5 Bento Cards ] |  +-------------------------+  |
|    "00:42"         |  - Consideration   |  |     חיווי התחדדות       |  |
|    מקשיב למחשבה... |  - Goals/Prices    |  | קודם: ... כעת: ...        |  |
|    ||||||||||||    |  - Hard Facts      |  +-------------------------+  |
|                    |  - Assumptions     |                               |
|   [ מה הדילמה? ]   |  - Missing Info    |  +-------------------------+  |
|                    |                    |  |   לולאת למידה רכה (3 צירים) |
|   [ כפתור: שקף לי ]|  [ שאלת הארה אחת ] |  | 1. מה קרה בפועל?         |  |
|                    |  [ מספיק לי לעכשיו]|  | 2. מה לגבי ההנחה?        |  |
|                    |                    |  | 3. מה היית משנה בדיעבד?  |  |
+--------------------+--------------------+--+-------------------------+--+
```

---

## 6. מפרט מסכים מפורט לפרומפטים ב-Google Stitch (Stitch Generation Prompts)

### פרומפט למסך 1: לכידה מהירה (Screen 1: Quick Capture Screen)
```text
Mobile screen for Echo (הד), a contemplative human judgment memory system.
Device: Mobile (RTL Hebrew).
Theme: Luxury dark mode, deep obsidian background #07080B, hairline gold accents #D4AF37.
Header: Minimalist fixed bar with small pulsing amber dot indicator, centered gold serif logo "ECHO · הד", right-hand kebab menu icon.
Center: A prominent sacred geometry glowing orb with concentric hairline rings spinning slowly, center glowing button with microphone icon. Below the orb: high contrast white monospace timer "00:42", muted subtitle "מקשיב למחשבה הגולמית שלך...".
Waveform: 8 delicate vertical bouncing gold bars indicating live voice input.
Input: Minimalist dark container with input placeholder "מה הדילמה שלפניך?".
Primary Action Button: Elegant ghost button with 1px gold border and gold text "שקף לי", subtle outer glow.
Bottom: Small down-arrow indicator with uppercase label "גלול להארה".
```

### פרומפט למסך 2: המראה המתפתחת וחדר ההחלטה (Screen 2: The Editable Mirror)
```text
Mobile screen for Echo (הד), The Editable Mirror and Decision Room.
Device: Mobile (RTL Hebrew).
Theme: Deep dark obsidian #07080B, glassmorphism surface cards #151C28 with 1px gold hairline borders.
Header: "מראה אפיסטמית" in elegant Noto Serif Hebrew font with subtle gold accent line.
Bento Grid Cards:
1. "אתה שוקל" (Dilemma): High contrast text "מעבר לתפקיד חדש באטלס מול זמן עם הילדים".
2. "מה חשוב לי / מטרות ומחירים": Text "שכר גבוה וקידום, לצד נוכחות אמיתית בבית בערב".
3. "עובדות קשיחות": Text "הוצע חוזה עם השכר המבוקש; העבודה במרחק שעה נסיעה".
4. "ההנחות שלי": Text "תפקיד בכיר בהכרח ידרוש זמינות רציפה בערבים".
5. "המידע החסר להחלטה": Text "מהי רמת הזמינות בפועל שדורש המנהל הישיר?".
Card Footer: Subdued clickable action "(זה משקף אותך? הקלק לעריכה)".
Structural Analogy Tag: Capsule badge with gold glow: "התאמה מבנית 89% להחלטה על תפקיד (2024)".
Illumination Section: Highlighted container with thick gold right border. Quote in italic serif: "מהו הנתון היחיד לגבי שעות העבודה שיכריע עבורך?". Input field with placeholder "הקלד את התובנה שלך...".
Action Buttons:
- Primary button: "דייק את ההחלטה" (Refine Decision)
- Secondary low-friction button: "מספיק לי לעכשיו — שמור והמשך" (Fast Exit).
```

### פרומפט למסך 3: חיווי ההתחדדות (Screen 3: The Insight Flash)
```text
Mobile screen for Echo (הד), Insight Flash (Before & After transformation).
Device: Mobile (RTL Hebrew).
Theme: Luxury dark mode #07080B, ambient gold glow.
Title: "חיווי התחדדות החשיבה" in Noto Serif Hebrew.
Card: Deep obsidian glass card with gold glow.
Comparison Layout:
- Top badge: "לפני התהליך" -> "חשבת: חשש מופשט שהתפקיד יפגע בבית או פחד משינוי".
- Center divider: Delicate horizontal gold gradient line with diamond icon.
- Lower badge: "כעת התחדד" -> "הבנת: החשש ממוקד בציפיות זמינות בערבים שמעולם לא בוררו".
Next Action Card: Highlighted gold capsule container: "הצעד שבחרת: לשאול את המנהל על ציפיות הזמינות בערב לפני מתן תשובה סופית".
Action Button: "שמור לזיכרון שיקול הדעת" (Save to Wisdom Memory).
```

### פרומפט למסך 4: סגירת מעגל רכה ולמידה (Screen 4: 3-Axis Outcome Loop)
```text
Mobile screen / bottom sheet modal for Echo (הד), Continuous Outcome Reflection.
Device: Mobile (RTL Hebrew).
Theme: Luxury dark mode #07080B, backdrop blur glass.
Header: Soft prompt in Noto Serif: "רצית לברר לגבי תפקיד באטלס, יצא לך?".
Quick Status Pills: 3 selectable capsules: "ביררתי" (Active gold), "עדיין לא", "כבר לא רלוונטי".
The 3 Reflection Inputs (Textareas with 1px border):
1. "מה קרה בפועל?" (Placeholder: סירבו לתת גמישות בערבים / הגענו לפשרה).
2. "מה התברר לגבי ההנחה שלך?" (Placeholder: התברר שהחשש שלי היה מוצד לחלוטין).
3. "מה היית משנה בדיעבד בתהליך?" (Placeholder: הייתי מעלה את שאלת הזמינות בראיון הראשון).
Footer Button: Solid gold button "עדכן את זיכרון שיקול הדעת שלי".
```

---

## 7. הנחיות העלאה ושימוש ב-Google Stitch

1. **העלאה ל-Stitch Web UI:**
   - פתח את פרויקט Google Stitch שלך.
   - לחץ על **Design System** -> **Upload DESIGN.md**.
   - בחר בקובץ זה (`DESIGN.md`).
   - המערכת של Stitch תסרוק את ה-YAML בראש הקובץ ותחיל את כל טוקני הצבע, הטיפוגרפיה והמרווחים, ותשתמש בהנחיות הממשק לייצור ועריכת מסכים.
2. **עבודה עם StitchMCP / Antigravity:**
   - הקובץ נטען אוטומטית באמצעות כלי `upload_design_md` ו-`create_design_system_from_design_md`.
   - ניתן לחולל מסכים באמצעות `generate_screen_from_text` על בסיס הפרומפטים בסעיף 6 לעיל.
