// Checks the audition rules on targets.json: 10 items, fields present, https links reachable,
// no wallet address, email or phone, no duplicates. Run: node researcher/check.mjs [--offline]
import { readFileSync } from 'node:fs';
const t = JSON.parse(readFileSync(new URL('./targets.json', import.meta.url)));
const problems = [];
if (t.length !== 10) problems.push(`expected 10 targets, got ${t.length}`);
const keys = ['handle', 'name', 'where', 'source', 'segment', 'why_now'];
const seen = new Set();
for (const [i, x] of t.entries()) {
  for (const k of keys) if (typeof x[k] !== 'string' || !x[k].trim()) problems.push(`${i} ${k} missing`);
  if (!x.where.startsWith('https://')) problems.push(`${i} where is not https`);
  const s = JSON.stringify(x);
  if (/0x[0-9a-fA-F]{40}/.test(s)) problems.push(`${i} has a wallet address`);
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(s)) problems.push(`${i} has an email`);
  if (/\+?\d[\d\s().-]{8,}\d/.test(x.why_now)) problems.push(`${i} may have a phone number`);
  if (/[\u2013\u2014]/.test(s)) problems.push(`${i} has a long dash`);
  for (const k of ['handle', 'where']) { const v = k + ':' + x[k].toLowerCase(); if (seen.has(v)) problems.push(`${i} duplicate ${k}`); seen.add(v); }
}
if (!process.argv.includes('--offline')) {
  for (const x of t) {
    const r = await fetch(x.where, { redirect: 'follow' }).catch(e => ({ status: e.message }));
    if (![200, 402].includes(r.status)) problems.push(`${x.handle} link answered ${r.status}`);
    else console.log(r.status, x.where);
  }
}
console.log(problems.length ? problems.join('\n') : 'all rules pass');
process.exit(problems.length ? 1 : 0);
