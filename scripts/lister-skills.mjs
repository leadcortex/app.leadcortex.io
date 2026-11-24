#!/usr/bin/env node
// scripts/lister-skills.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const home = os.homedir();
const claudeDir = path.join(home, ".claude");
const projectDir = process.cwd();

function findSkillFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const full = path.join(current, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name === "SKILL.md") out.push(full);
    }
  }
  return out;
}

function readFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const fields = {};
  if (!match) return fields;
  const lines = match[1].split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value === ">" || value === "|" || value === ">-" || value === "|-" || value === "") {
      const parts = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) parts.push(lines[++i].trim());
      value = parts.join(" ");
    }
    fields[m[1]] = value.replace(/^["']|["']$/g, "");
  }
  return fields;
}

function shortDescription(text = "") {
  const clean = text.replace(/\s+/g, " ").replace(/\|/g, "/").trim();
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return firstSentence.length > 180 ? firstSentence.slice(0, 177) + "…" : firstSentence;
}

function installedPlugins() {
  const file = path.join(claudeDir, "plugins", "installed_plugins.json");
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = [];
  for (const [id, installs] of Object.entries(data.plugins ?? {})) {
    for (const inst of installs) {
      list.push({ name: id.split("@")[0], version: inst.version, dir: inst.installPath });
    }
  }
  return list;
}

// Traductions françaises des descriptions (clé = nom complet du skill).
// Un skill absent de ce fichier garde sa description anglaise, marquée « (EN) ».
const translationsFile = new URL("./skills-descriptions-fr.json", import.meta.url);
const translations = fs.existsSync(translationsFile)
  ? JSON.parse(fs.readFileSync(translationsFile, "utf8"))
  : {};

const groups = [];

for (const plugin of installedPlugins()) {
  const skills = findSkillFiles(plugin.dir).map((f) => ({ file: f, ...readFrontmatter(f) }));
  groups.push({
    title: `Plugin ${plugin.name} (v${plugin.version})`,
    prefix: `${plugin.name}:`,
    skills,
  });
}

const personal = findSkillFiles(path.join(claudeDir, "skills")).map((f) => ({
  file: f,
  ...readFrontmatter(f),
}));
const synced = personal.filter((s) => s.file.includes(`${path.sep}synced${path.sep}`));
const own = personal.filter((s) => !synced.includes(s));
if (synced.length) groups.push({ title: "Skills synchronisés depuis claude.ai", prefix: "", skills: synced });
if (own.length) groups.push({ title: "Skills personnels (~/.claude/skills)", prefix: "", skills: own });

const project = findSkillFiles(path.join(projectDir, ".claude", "skills")).map((f) => ({
  file: f,
  ...readFrontmatter(f),
}));
if (project.length) groups.push({ title: "Skills du projet (.claude/skills)", prefix: "", skills: project });

const total = groups.reduce((n, g) => n + g.skills.length, 0);
const today = new Date().toISOString().slice(0, 10);
let md = `# Skills détectés\n\nGénéré le ${today} par \`node scripts/lister-skills.mjs\`. ${total} skills trouvés.\n`;
for (const g of groups) {
  if (!g.skills.length) continue;
  md += `\n## ${g.title}\n\n| Skill | À quoi il sert |\n| --- | --- |\n`;
  for (const s of g.skills.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))) {
    const name = s.name ?? path.basename(path.dirname(s.file));
    const fullName = `${g.prefix}${name}`;
    const fr = translations[fullName];
    const description = fr ? fr.replace(/\|/g, "/") : `(EN) ${shortDescription(s.description)}`;
    md += `| \`${fullName}\` | ${description} |\n`;
  }
}

const target = process.argv[2];
if (target) {
  fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  fs.writeFileSync(target, md);
  console.log(`${total} skills écrits dans ${target}`);
} else {
  process.stdout.write(md);
}
