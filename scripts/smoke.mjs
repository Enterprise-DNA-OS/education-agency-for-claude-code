#!/usr/bin/env node
// npm test: a fresh database in a temp folder, migrate and seed twice, then every command.
// Set TEST_DATABASE_URL to run the same checks against an empty, disposable Postgres.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';
import { toDate, mapStage } from './lib/import.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'education-agency-test-'));
const env = { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL || '', DATA_DIR: path.join(dir, 'db'), OUTPUT_DIR: dir };
let checks = 0;

function run(file, args = [], expected = 0) {
  const p = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', file), ...args], { cwd: REPO_ROOT, env, encoding: 'utf8' });
  assert.equal(p.status, expected, `${file} ${args.join(' ')}\n${p.stdout}\n${p.stderr}`);
  checks++;
  return p.stdout;
}
const cli = (args, expected = 0) => JSON.parse(run('agency.mjs', [...args, '--json'], expected));
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

try {
  if (env.DATABASE_URL) {
    const { getDb } = await import('./lib/db.mjs');
    process.env.DATABASE_URL = env.DATABASE_URL;
    const db = await getDb();
    try {
      const rows = await db.query("select tablename from pg_tables where schemaname = 'public'");
      assert.equal(rows.length, 0, 'TEST_DATABASE_URL must point to an empty, disposable database');
    } finally {
      await db.close();
    }
  }

  // Pure helpers.
  ok(toDate('05/07/2002') === '2002-07-05', 'dd/mm/yyyy');
  ok(toDate('Feb 2027') === '2027-02-01', 'month year');
  ok(toDate('2026-09-30T10:00:00Z') === '2026-09-30', 'iso');
  ok(mapStage('Offer Letter', 'In Progress') === 'conditional_offer', 'offer stage');
  ok(mapStage('Visa Application', '') === 'visa_lodged', 'visa stage');
  ok(mapStage('Application', 'Discontinued') === 'withdrawn', 'discontinued');
  ok(mapStage('COE Issued', '') === 'coe_issued', 'coe');
  assert.deepEqual(parseCsv('a,b\r\n"x, ""y""",2\r\n'), [{ a: 'x, "y"', b: '2' }]);

  run('migrate.mjs');
  run('migrate.mjs');
  run('seed.mjs');
  run('seed.mjs');

  // Every read runs and returns rows.
  const help = cli(['help']);
  for (const cmd of help.reads) ok(Array.isArray(cli([cmd])), `${cmd} returns rows`);
  for (const cmd of help.reads) run('agency.mjs', [cmd]);

  // The demo agency, as seeded.
  const attention = cli(['attention']);
  const reasons = (r) => attention.filter((a) => a.reason === r).map((a) => a.who);
  assert.deepEqual(reasons('offer expiring'), ['Mei Lin Chen']);
  assert.deepEqual(reasons('deposit overdue'), ['Nguyen Thi Hoa']);
  assert.deepEqual(reasons('visa not lodged'), ['Aarav Patel']);
  assert.deepEqual(reasons('visa expiring'), ['Daniel Kim']);
  assert.deepEqual(reasons('enquiry gone quiet').sort(), ['Fatima Noor', 'Rahul Verma']);
  assert.deepEqual(reasons('no offer after 21 days'), ['Ayesha Rahman']);
  ok(reasons('agreement ending').includes('Canterbury Plains Polytechnic'), 'expired agreement flagged');
  ok(reasons('commission overdue').includes('Eastern Institute of Hospitality'), 'overdue commission flagged');
  ok(!reasons('visa expiring').includes('Siti Aminah'), 'a visa with a new one lodged is not flagged');

  const apps = cli(['applications']);
  ok(apps.length === 9 && apps.every((a) => a.stage !== 'enrolled'), 'nine open applications, none enrolled');
  ok(cli(['offers']).length === 2, 'two offers waiting');
  ok(cli(['documents']).some((d) => d.student === 'Mei Lin Chen' && d.status === 'rejected'), 'rejected english test listed');

  const slow = cli(['slow-payers']);
  ok(slow[0].institution === 'Eastern Institute of Hospitality' && Number(slow[0].avg_days_to_pay) > 60, 'slowest payer first');
  const claim = cli(['claim-run']);
  ok(claim.some((c) => c.institution === 'Pacific English Academy' && Number(c.claims) === 2), 'claim run groups by institution');
  const forecast = cli(['forecast']);
  ok(forecast.every((f) => f.currency === 'AUD' || f.currency === 'NZD'), 'forecast keeps currencies apart');
  ok(cli(['sub-agent-payouts'])[0].sub_agent === 'Himalaya Study Link', 'sub-agent owed');
  const conv = cli(['conversion']);
  ok(conv.length === 6 && conv.every((c) => Number(c.enrolled) <= Number(c.applied)), 'conversion by source');

  // Compliance: every rule runs and the seeded breaches are found.
  const comp = cli(['compliance']);
  ok(comp.checks.length === 7, 'seven rules');
  const found = (rule) => comp.findings.filter((f) => f.rule.startsWith(rule));
  ok(found('AU onshore transfer').every((f) => f.record === 'Maria Santos') && found('AU onshore transfer').length === 2, 'onshore transfer commission');
  ok(found('Written agreement').some((f) => f.severity === 'breach' && f.record === 'Canterbury Plains Polytechnic'), 'expired agreement');
  ok(found('Written agreement').some((f) => f.severity === 'due' && f.record === 'Southbank College of Business'), 'agreement ending');
  ok(found('NZ visa advice')[0].record === 'Siti Aminah', 'unlicensed NZ onshore advice');
  ok(found('AU visa help')[0].record === 'Maria Santos', 'unregistered AU onshore help');
  ok(found('AU visa help').length === 1, 'registered agent and offshore help are fine');
  ok(found('Under 18')[0].record === 'Nguyen Thi Hoa', 'under 18 without welfare');
  ok(found('Personal documents').some((f) => f.record === 'Olivia Martins' && f.severity === 'breach'), 'retention');
  ok(found('Passport numbers').length === 1, 'passport number in a note');

  // One record, matching.
  ok(cli(['student', 'mei lin']).student.name === 'Mei Lin Chen', 'partial name');
  ok(cli(['student', 'MEI LIN CHEN']).applications[0].ref === 'HL-1002', 'case-insensitive');
  ok(cli(['student', '00000000-0000-4000-8000-000000000502']).student.name === 'Mei Lin Chen', 'by id');
  assert.match(cli(['student', 'Sharma'], 1).error, /Ambiguous/);
  assert.match(cli(['student', 'nobody-here'], 1).error, /No match/);
  ok(cli(['application', 'HL-1004']).commission.length === 2, 'application with its claims');
  ok(cli(['institution', 'eastern']).institution.pays_within_days === 30, 'institution');
  const weekly = cli(['weekly-review']);
  ok(weekly.attention.length > 5 && weekly.compliance.length >= 5, 'weekly review');

  // Writes.
  const log = cli(['log', 'Rahul Verma', 'call: Called back, wants the February intake']);
  ok(log.kind === 'call', 'log kind from prefix');
  ok(!cli(['attention']).some((a) => a.reason === 'enquiry gone quiet' && a.who === 'Rahul Verma'), 'logging clears the quiet flag');
  assert.match(cli(['log', 'Rahul Verma', 'later', '--on=2999-01-01'], 1).error, /future/);

  const added = cli(['add', 'application', JSON.stringify({ student_id: 'Fatima Noor', course_id: 'Diploma of Business', intake_on: '2027-04-06', staff_id: 'Ana Silva' })]);
  ok(added.ref === 'HL-1015', 'next HL number');
  ok(cli(['stage', 'HL-1015', 'submitted']).stage === 'submitted', 'stage moves');
  assert.match(cli(['stage', 'HL-1015', 'nowhere'], 1).error, /Stage must be/);
  assert.match(cli(['add', 'student', '{"nme":"typo"}'], 1).error, /Unknown field/);
  assert.match(cli(['update', 'application', 'HL-1015', '{"stage":"enrolled"}'], 1).error, /Use stage/);

  // Enrolling creates the expected commission from the institution's terms.
  cli(['stage', 'HL-1015', 'enrolled', '--on=2027-04-06']);
  const c = cli(['application', 'HL-1015']).commission;
  ok(c.length === 1 && c[0].period === 'Term 1' && Number(c[0].amount_cents) === 140000, 'commission on enrolment');

  // Commission: the transfer rule blocks the draft until the claim is blocked.
  assert.match(cli(['draft-commission-claim', 'Eastern Institute'], 1).error, /onshore transfer/);
  ok(cli(['block', 'HL-1004', '--reason=onshore transfer, National Code 4.7']).length === 2, 'blocked');
  ok(!cli(['compliance']).findings.some((f) => f.rule.startsWith('AU onshore')), 'blocked claim clears the rule');
  const d = cli(['draft-commission-claim', 'pacific english']);
  ok(d.sent === false && Number(d.total_cents) === 392000, 'claim drafted, not sent');
  const draftText = fs.readFileSync(path.join(dir, d.draft), 'utf8');
  ok(draftText.includes('Daniel Kim') && !draftText.includes('npm run'), 'draft reads as an email');
  ok(cli(['invoice', 'pacific english', '--invoice=HL-INV-0400']).length === 2, 'invoiced');
  const paid = cli(['paid', 'HL-INV-0400', '--amount=3000']);
  ok(Number(paid.short_cents) === 92000, 'short payment recorded');
  assert.match(cli(['paid', 'HL-INV-0400'], 1).error, /No unpaid/);
  ok(cli(['sub-agent-paid', 'himalaya']).length === 2, 'sub-agent paid');
  ok(cli(['sub-agent-payouts']).length === 0, 'nothing owed after payout');

  // Drafts.
  for (const [cmd, who] of [['draft-follow-up', 'Fatima Noor'], ['draft-offer-chase', 'HL-1002'], ['draft-document-request', 'Aarav Patel']]) {
    const out = cli([cmd, who]);
    ok(out.sent === false && fs.existsSync(path.join(dir, out.draft)), `${cmd} writes a draft`);
  }
  ok(fs.readFileSync(path.join(dir, cli(['draft-document-request', 'Aarav Patel']).draft), 'utf8').includes('financial evidence'), 'document list');
  ok(cli(['task-done', 'offer extension']).done_on, 'task done');

  // Import: dry run writes nothing, apply writes, a second apply adds nothing.
  const fixtures = path.join(REPO_ROOT, 'fixtures', 'agentcis');
  const before = cli(['students']).length;
  const dry = cli(['import', 'agentcis', fixtures]);
  ok(dry.students === 4 && dry.applications === 3 && dry.unmatched.length === 1, 'dry run counts');
  ok(cli(['students']).length === before, 'dry run writes nothing');
  const applied = cli(['import', 'agentcis', fixtures, '--apply']);
  ok(applied.students === 4 && applied.institutions === 1 && applied.courses === 1, 'applied');
  ok(cli(['student', 'hiroshi']).applications[0].stage === 'conditional_offer', 'stage mapped');
  { const m = cli(['student', 'Maria Lopez']).student; ok(m.stage === 'prospect' && m.name === 'Maria Lopez "Maru"', 'quoted names survive, lead is a prospect'); }
  const again = cli(['import', 'agentcis', fixtures, '--apply']);
  ok(again.students === 0 && again.applications === 0, 'second import adds nothing');
  assert.match(cli(['import', 'agentcis', path.join(dir, 'missing')], 1).error, /folder/);

  // Export, paperwork and views.
  const ex = cli(['export', path.join(dir, 'export')]);
  ok(ex.tables.students > 200 && fs.existsSync(path.join(dir, 'export', 'commissions.json')), 'export');
  assert.match(cli(['export', path.join(dir, 'export')], 1).error, /already exists/);
  ok(/document\(s\) rendered/.test(run('docs.mjs')), 'docs');
  for (const kind of ['commission-claim', 'student-checklist']) ok(fs.readdirSync(path.join(dir, 'docs-out', kind)).length > 0, `${kind} rendered`);
  run('view.mjs');
  for (const v of ['week', 'pipeline', 'money']) ok(fs.readFileSync(path.join(dir, 'views', `${v}.html`), 'utf8').includes('Harbourline Education'), `${v} view in brand`);

  // Every slash command names a real CLI command.
  const cmds = fs.readdirSync(path.join(REPO_ROOT, '.claude', 'commands')).filter((f) => f.endsWith('.md') && f !== 'README.md');
  const verbs = new Set([...help.reads, 'student', 'application', 'institution', 'compliance', 'weekly-review', 'add', 'update', 'log', 'stage', 'task-done', 'invoice', 'paid', 'block', 'sub-agent-paid', 'draft-follow-up', 'draft-offer-chase', 'draft-document-request', 'draft-commission-claim', 'import', 'export', 'help']);
  for (const f of cmds) {
    const text = fs.readFileSync(path.join(REPO_ROOT, '.claude', 'commands', f), 'utf8');
    ok(/^---\ndescription: .+\n---/.test(text), `${f} has a description`);
    for (const m of text.matchAll(/npm run agency -- ([a-z-]+)/g)) ok(verbs.has(m[1]), `${f}: ${m[1]} is a real command`);
  }

  // No em dashes anywhere in the prose.
  const prose = ['README.md', 'CLAUDE.md', 'AGENTS.md', ...fs.readdirSync(path.join(REPO_ROOT, 'docs')).map((f) => `docs/${f}`), ...cmds.map((f) => `.claude/commands/${f}`)];
  for (const f of prose) ok(!fs.readFileSync(path.join(REPO_ROOT, f), 'utf8').includes('\u2014'), `${f} has no em dash`);

  console.log(`PASS  ${checks} checks, ${cmds.length} slash commands (${env.DATABASE_URL ? 'postgres' : 'pglite'})`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
