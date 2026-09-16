#!/usr/bin/env node
/**
 * scripts/record-lesson.js
 * Automated WikiSkill Reflection & Continuous Learning Tool for Echo.
 * 
 * Usage:
 *   node scripts/record-lesson.js --title="Short Title" --category="Category" --failure="What failed" --lesson="Rule to prevent repeat" [--solution="What was fixed"]
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const equalIndex = arg.indexOf('=');
      if (equalIndex !== -1) {
        const key = arg.slice(2, equalIndex);
        const val = arg.slice(equalIndex + 1);
        parsed[key] = val;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        const key = arg.slice(2);
        parsed[key] = args[i + 1];
        i++;
      } else {
        const key = arg.slice(2);
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

const args = parseArgs();

if (!args.title || !args.failure || !args.lesson) {
  console.error(`
Usage:
  node scripts/record-lesson.js --title="Title" --failure="Description of error" --lesson="Lesson/Rule learned" [--category="Area"] [--solution="Fix applied"]

Required:
  --title     Short concise title for the incident
  --failure   What failed or required rework
  --lesson    Rule or best practice to prevent recurrence

Optional:
  --category  Component or functional area (e.g. Auth, Firestore, UI, Engine)
  --solution  How the issue was ultimately resolved
`);
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const year = now.getFullYear();
const month = pad(now.getMonth() + 1);
const day = pad(now.getDate());
const hours = pad(now.getHours());
const minutes = pad(now.getMinutes());

const dateStr = `${day}/${month}/${year}`;
const timestampStr = `${year}${month}${day}_${hours}${minutes}`;

const projectRoot = path.resolve(__dirname, '..');
const wikiskillDir = path.join(projectRoot, '.wikiskill');
const logsDir = path.join(wikiskillDir, 'logs');
const wikiFile = path.join(wikiskillDir, 'wiki.md');
const globalQaSkillFile = path.join('C:', 'Users', 'guyku', '.gemini', 'config', 'skills', 'continuous-qa-learning', 'SKILL.md');

// Ensure directories exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 1. Create Log Entry in .wikiskill/logs/
const logFileName = `log_${timestampStr}.md`;
const logFilePath = path.join(logsDir, logFileName);
const logContent = `# Execution Log: ${dateStr} ${hours}:${minutes} - ${args.title}

- **Category:** ${args.category || 'General'}
- **Timestamp:** ${now.toISOString()}

## 1. What Failed / Rework Required
${args.failure}

## 2. Root Cause Analysis & Solution
${args.solution || 'Resolved and verified by agent.'}

## 3. Persistent Lesson Learned
${args.lesson}
`;

fs.writeFileSync(logFilePath, logContent, 'utf8');
console.log(`[WikiSkill] Created log file: .wikiskill/logs/${logFileName}`);

// 2. Append to .wikiskill/wiki.md
let wikiContent = '';
if (fs.existsSync(wikiFile)) {
  wikiContent = fs.readFileSync(wikiFile, 'utf8');
} else {
  wikiContent = '# Echo Project Wiki\n\nThis is the persistent knowledge base for the Echo project.\n\n';
}

const headerForDate = `## ${dateStr}`;
const newBullet = `* **${args.title}:** ${args.lesson}${args.category ? ` (Category: ${args.category})` : ''}`;

if (wikiContent.includes(headerForDate)) {
  // Insert bullet directly after the date header
  wikiContent = wikiContent.replace(headerForDate, `${headerForDate}\n${newBullet}`);
} else {
  // Append new date section
  wikiContent = `${wikiContent.trim()}\n\n${headerForDate}\n${newBullet}\n`;
}

fs.writeFileSync(wikiFile, wikiContent, 'utf8');
console.log(`[WikiSkill] Updated knowledge base: .wikiskill/wiki.md`);

// 3. Append to Global continuous-qa-learning/SKILL.md if it exists
if (fs.existsSync(globalQaSkillFile)) {
  try {
    let qaContent = fs.readFileSync(globalQaSkillFile, 'utf8');
    const qaSection = '## 3. יומן לקחים מביקורות קודמות';
    const qaBullet = `* **${month}-${year} | ${args.title}:** ${args.lesson}`;
    if (qaContent.includes(qaSection) && !qaContent.includes(args.title)) {
      qaContent = qaContent.replace(qaSection, `${qaSection}\n${qaBullet}`);
      fs.writeFileSync(globalQaSkillFile, qaContent, 'utf8');
      console.log(`[WikiSkill] Updated global continuous-qa-learning SKILL.md`);
    }
  } catch (err) {
    console.warn('[WikiSkill Notice] Could not update global QA skill:', err.message);
  }
}

console.log(`[WikiSkill Success] Lesson successfully recorded across all systems.`);
