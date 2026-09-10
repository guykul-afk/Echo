# מסמך עיצוב מערכת — הד | Echo
> **הערה מחייבת:** קובץ המקור הקנוני והבלעדי המגדיר את שפת העיצוב של המערכת הוא **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**.
> כל שינוי בממשק חייב לציית ב-100% לכללי הברזל המפורטים בו וב-[AGENTS.md](./AGENTS.md).

---

## פילוסופיה: Minimalist Sacred Luxury & Epistemic Clarity
מרחב שקט, מעמיק ויוקרתי לעיבוד שיקול דעת אנושי. כתיבה במחברת עור יוקרתית תחת תאורה חמה, ללא עומס ויזואלי, ללא Rainbow UI, וכיווניות ימין-לשמאל (`dir="rtl"`).

## פלטת 3 הצבעים המחייבת (The Strict 3-Color Hierarchy)

```yaml
colors:
  # 1. The Void Canvas (שחור-בזלת עמוק)
  void-base: '#07080B'
  surface-card: 'rgba(255, 255, 255, 0.03)'
  surface-elevated: 'rgba(255, 255, 255, 0.05)'
  border-default: 'rgba(212, 175, 55, 0.15)'
  border-subtle: 'rgba(255, 255, 255, 0.08)'

  # 2. Unified Typography (פנינה מונוכרומטית אחידה)
  text-primary: '#E6E8EE'
  text-secondary: 'rgba(230, 232, 238, 0.70)'
  text-tertiary: 'rgba(230, 232, 238, 0.45)'
  text-inverse: '#07080B'

  # 3. Living Accent & Sacred Gold (זהב קיסרי חי)
  gold-primary: '#D4AF37'
  gold-rgb: '212, 175, 55'
  aura-glow: 'rgba(212, 175, 55, 0.25)'
  aura-secondary: 'rgba(212, 175, 55, 0.12)'
```

## טיפוגרפיה מחייבת

* **Editorial & Headings:** `'Frank Ruhl Libre', serif` (משקלים: 600, 700).
* **Body & Controls:** `'Assistant', sans-serif` (משקלים: 300, 400, 600).
* **איסור מוחלט:** אין להשתמש ב-Noto Serif, Inter, Roboto או פונטים אחרים.

## רכיבי מפתח
1. **Echo Orb (`EchoOrb.tsx`):** מנוע קנבס HTML5 Canvas 2D מתמטי פועם ומסתובב ב-60 FPS בצבע זהב בלעדי (`#D4AF37`), המגיב לתדרי שמע.
2. **EchoPastCard (`EchoPastCard.tsx`):** כרטיס הד מהעבר המופיע רק עבור דמיון $\ge 0.85$ מול מאגר 38 מחזורי ההכרעה המאומתים.
3. **DecisionRoomScreen (`DecisionRoomScreen.tsx`):** מראה אנושית ב-4 ממדים הניתנים לעריכה, עם מיקוד 20 השניות הראשונות (מתח מרכזי וציר ההכרעה).
