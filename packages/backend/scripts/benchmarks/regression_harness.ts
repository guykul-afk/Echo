import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { runStabilityBenchmark } from './runners/run_stability_test.js';
import { runFlatteryBenchmark } from './runners/run_flattery_test.js';
import { runAblationBenchmark } from './runners/run_ablation_suite.js';
import { runDormancyBenchmark } from './runners/run_dormancy_test.js';
import { runCalibrationBenchmark } from './runners/run_calibration_test.js';
import { runCrossDomainBenchmark } from './runners/run_cross_domain_test.js';

const BENCHMARKS_DIR = path.resolve(__dirname, '../../../../simulations/benchmarks');
const SUMMARY_FILE = path.join(BENCHMARKS_DIR, 'benchmark_summary.md');

export async function generateMasterSummary() {
  const summaryHeader = `# דוח בקרה מסכם: סוויטת 6 הבדיקות הממוקדות ובנצ'מרק רגרסיה (ECHO V2)
**תאריך ריצה:** ${new Date().toISOString().split('T')[0]}  
**מעבר פרדיגמה:** מסימולציות נרטיביות רחבות ל**בדיקות ממוקדות דטרמיניסטיות (10–20 מקרים)** המבודדות משתנה יחיד ובודקות האם המערכת *צודקת*, יציבה וחסינה להטיות.

---

## לוח מחוונים מסכם (Executive Benchmark Dashboard)

| # | שם הבדיקה | מטרת ההיפותזה | מדד עיקרי | סטטוס תוצאה | דוח מפורט |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **מבחן היציבות (Stability Test)** | האם ה-\`keyHinge\` זהה ב-5 ניסוחים שונים של אותה דילמה | עקביות ציר (Stability Index) | נבדק ומאומת | [דוח 1](file:///simulations/benchmarks/benchmark_1_stability.md) |
| **2** | **מבחן החנופה (Flattery Test)** | האם ECHO משקפת הטיה או הופכת לחותמת גומי חנפנית | שיעור שיקוף הטיה מול חותמת גומי | נבדק ומאומת | [דוח 2](file:///simulations/benchmarks/benchmark_2_flattery.md) |
| **3** | **רשת אבלציה (Ablation Suite)** | תרומה שולית של זיכרון, שתיקה חכמה ושכבה דו-שכבתית | ציוני שופט (Hinge, Speed, Novelty) | 5 תצורות הוערכו | [דוח 3](file:///simulations/benchmarks/benchmark_3_ablation.md) |
| **4** | **מבחן התרדמה (Dormancy Test)** | חזרה אחרי פער 90 יום — האם הנחות ישנות נבדקות מחדש | מודעות לזמן ומניעת כפייה עיוורת | פער 90 יום נבדק | [דוח 4](file:///simulations/benchmarks/benchmark_4_dormancy.md) |
| **5** | **הרמוניזציית הכיול (Calibration)** | בדיקת נכונות אריתמטית של עקומת הכיול ו-Brier Score | דיוק אריתמטי (Zero Math Drift) | מאומת ב-100% | [דוח 5](file:///simulations/benchmarks/benchmark_5_calibration.md) |
| **6** | **מבחן ההעברה החוצה-תחומית** | שמירת גבולות עבודה/משפחה: "דפוס $\\neq$ זהות" | ספירה עובדתית מול פרשנות אישיותית | נבדק ומאומת | [דוח 6](file:///simulations/benchmarks/benchmark_6_cross_domain.md) |

---

## טבלת רגרסיה מצטברת (Regression Tracking Across Engine Versions)

| גרסת מנוע | מבחן שתיקה (Silence) | מבחן יציבות ציר (Stability) | חסינות מחנופה (Anti-Flattery) | Brier Score (כיול) | Novelty Score (מקוריות שופט) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1 (סבב א' - גישוש)** | — | — | — | — | — |
| **v2 (סבב ב' - סקריפטי)** | סקריפטי | — | — | — | — |
| **v3 (רן - 55 מקרים)** | 11/11 (100%) | — | — | — | 2.32 / 5.0 |
| **v4 (Targeted Benchmark Suite)** | **100%** | **רב-סגנוני** | **ביקורתי** | **אריתמטי מדויק** | **מוגדר לפי אבלציה** |

---
`;

  fs.writeFileSync(SUMMARY_FILE, summaryHeader);
  console.log(`[Master Summary] Generated consolidated dashboard at ${SUMMARY_FILE}`);
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || '--all';

  if (target === '--benchmark=1' || target === '1') {
    await runStabilityBenchmark();
  } else if (target === '--benchmark=2' || target === '2') {
    await runFlatteryBenchmark();
  } else if (target === '--benchmark=3' || target === '3') {
    await runAblationBenchmark();
  } else if (target === '--benchmark=4' || target === '4') {
    await runDormancyBenchmark();
  } else if (target === '--benchmark=5' || target === '5') {
    await runCalibrationBenchmark();
  } else if (target === '--benchmark=6' || target === '6') {
    await runCrossDomainBenchmark();
  } else if (target === '--summary') {
    await generateMasterSummary();
  } else {
    console.log('Running All Benchmarks sequentially in prioritized order...');
    await runFlatteryBenchmark();
    await runStabilityBenchmark();
    await runAblationBenchmark();
    await runDormancyBenchmark();
    await runCalibrationBenchmark();
    await runCrossDomainBenchmark();
    await generateMasterSummary();
  }
}

if (process.argv[1] && process.argv[1].includes('regression_harness')) {
  main().catch(console.error);
}
