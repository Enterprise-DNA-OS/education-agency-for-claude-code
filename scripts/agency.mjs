#!/usr/bin/env node
// The one CLI. Every slash command in .claude/commands runs one of these.
//   npm run agency -- help
//   npm run agency -- attention
//   npm run agency -- student "mei lin" --json
import fs from 'node:fs';
import path from 'node:path';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { table, heading, money } from './lib/format.mjs';
import { fields, reads, entity, match, insert, update, transaction, compliance, STAGES } from './lib/domain.mjs';
import { importAgentcis } from './lib/import.mjs';

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const apply = argv.includes('--apply');
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const known = ['--json', '--apply'];
const args = argv.filter((a) => !known.includes(a) && !/^--(on|invoice|amount|reason)=/.test(a));
const [cmd = 'help', ...rest] = args;

const help = {
  reads: Object.keys(reads),
  one_record: ['student <name>', 'application <ref>', 'institution <name>'],
  checks: ['compliance', 'weekly-review'],
  writes: [
    'add <type> <json>',
    'update <type> <name-or-ref> <json>',
    'log <student> <text> [--on=YYYY-MM-DD] (kind: prefix the text with call:, email:, whatsapp:, meeting: or walk-in:)',
    'stage <application-ref> <stage> [--on=YYYY-MM-DD] [--reason=...]',
    'task-done <task title>',
    'invoice <institution> --invoice=<number> [--on=YYYY-MM-DD]',
    'paid <invoice-number> [--amount=<dollars>] [--on=YYYY-MM-DD]',
    'block <application-ref> --reason=...',
    'sub-agent-paid <sub-agent> [--on=YYYY-MM-DD]',
  ],
  drafts: ['draft-follow-up <student>', 'draft-offer-chase <application-ref>', 'draft-document-request <student>', 'draft-commission-claim <institution>'],
  data: ['import agentcis <folder> [--apply]', 'export <new-folder>'],
  stages: STAGES,
  types: Object.keys(fields),
};

function show(rows) {
  if (!rows.length) return '  (none)';
  return table(rows, Object.keys(rows[0]).filter((k) => !k.endsWith('_id') && k !== 'id').map((key) => ({
    key,
    label: key.replace(/_cents$/, '').replaceAll('_', ' '),
    align: /_cents$|days|^count$|^claims$|^students$|apps|_pct$|^enquiries$|^applied$|^enrolled|_now$|invoices$/.test(key) ? 'right' : 'left',
    width: key === 'body' || key === 'detail' || key === 'who' || key === 'students' || key === 'for_students' ? 70 : 44,
    format: key.endsWith('_cents') ? (v, r) => (v === null || v === undefined ? '' : money(v, r.currency || 'NZD')) : undefined,
  })));
}

function print(out) {
  if (json) return console.log(JSON.stringify(out, null, 2));
  if (Array.isArray(out)) return console.log(show(out));
  if (out && typeof out === 'object') {
    for (const [k, v] of Object.entries(out)) {
      const title = heading(k.replaceAll('_', ' '));
      if (Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object')) console.log(`${title}\n${v.length ? v.map((x) => `  - ${x}`).join('\n') : '  (none)'}`);
      else if (Array.isArray(v)) console.log(`${title}\n${show(v)}`);
      else if (v instanceof Date) console.log(`${k}: ${v.toISOString()}`);
      else if (v && typeof v === 'object' && Object.values(v).every((x) => x === null || typeof x !== 'object')) {
        const rows = Object.entries(v).map(([field, value]) => ({ field, value }));
        console.log(`${title}\n${rows.length ? show(rows) : '  (none)'}`);
      } else if (v && typeof v === 'object') console.log(`${title}\n${show([v])}`);
      else console.log(`${k}: ${v ?? ''}`);
    }
    return;
  }
  console.log(out);
}

const today = async (db) => (await db.query('select current_date as d'))[0].d;

function draft(name, body) {
  const dir = path.resolve(process.env.OUTPUT_DIR || REPO_ROOT, 'drafts');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}-${name}.md`);
  fs.writeFileSync(file, body);
  return { draft: path.relative(process.env.OUTPUT_DIR || REPO_ROOT, file), sent: false, note: 'Draft only. A person reads it and sends it.' };
}

async function brandName() {
  try {
    return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'brand.json'), 'utf8')).business_name || 'Our agency';
  } catch {
    return 'Our agency';
  }
}

let db;
try {
  if (cmd === 'help' || cmd === '--help') {
    print(help);
    process.exit(0);
  }
  const stray = argv.filter((a) => a.startsWith('--') && !known.includes(a) && !/^--(on|invoice|amount|reason)=/.test(a));
  if (stray.length) throw Error(`Unknown option: ${stray.join(' ')}`);
  db = await getDb();
  let out;

  if (reads[cmd]) out = await db.query(reads[cmd]);
  else if (cmd === 'compliance') out = await compliance(db);
  else if (cmd === 'student') {
    const s = await match(db, 'students', rest.join(' '));
    out = {
      student: (await db.query(`select s.name, s.stage, s.email, s.phone, s.nationality, s.date_of_birth, s.location, s.source, st.name as counsellor, sa.name as sub_agent,
        s.english_test, s.english_score, s.passport_expires_on, s.welfare_arrangement, s.last_contact_on, s.next_follow_up_on
        from students s left join staff st on st.id = s.staff_id left join sub_agents sa on sa.id = s.sub_agent_id where s.id = $1`, [s.id]))[0],
      applications: await db.query(`select a.ref, i.name as institution, c.name as course, a.intake_on as intake, a.stage, a.offer_expires_on, a.conditions
        from applications a join courses c on c.id = a.course_id join institutions i on i.id = c.institution_id where a.student_id = $1 order by a.intake_on`, [s.id]),
      documents: await db.query('select kind, status, received_on, expires_on, note from documents where student_id = $1 order by kind', [s.id]),
      visas: await db.query('select country, kind, status, lodged_on, decided_on, expires_on from visas where student_id = $1 order by lodged_on', [s.id]),
      history: await db.query(`select n.happened_on as date, n.kind, coalesce(st.name, '-') as by, n.body from notes n left join staff st on st.id = n.staff_id
        where n.student_id = $1 order by n.happened_on desc, n.created_at desc`, [s.id]),
    };
  } else if (cmd === 'application') {
    const a = await match(db, 'applications', rest[0]);
    out = {
      application: (await db.query('select * from application_board where id = $1', [a.id]))[0] || { ref: a.ref, stage: a.stage, note: 'closed' },
      detail: { submitted: a.submitted_on, offer: a.offer_on, offer_expires: a.offer_expires_on, conditions: a.conditions, deposit_due: a.deposit_due_on, deposit_paid: a.deposit_paid_on, coe: a.coe_ref, census: a.census_on, onshore_transfer: a.onshore_transfer },
      documents: await db.query('select kind, status, note from documents where application_id = $1 order by kind', [a.id]),
      commission: await db.query('select period, state, claimable_on, currency, amount_cents, invoice_no from commission_ledger where application_id = $1 order by claimable_on', [a.id]),
    };
  } else if (cmd === 'institution') {
    const i = await match(db, 'institutions', rest.join(' '));
    out = {
      institution: (await db.query('select name, country, kind, provider_code, agreement_start, agreement_end, commission_pct, commission_basis, claim_after_days, pays_within_days, contact_name, contact_email from institutions where id = $1', [i.id]))[0],
      open_applications: await db.query('select ref, student, course, intake, stage from application_board where institution_id = $1 order by intake', [i.id]),
      commission: await db.query("select state, student, period, claimable_on, currency, amount_cents, invoice_no from commission_ledger where institution_id = $1 and status in ('expected','invoiced') order by claimable_on", [i.id]),
    };
  } else if (cmd === 'weekly-review') {
    const checks = await compliance(db);
    out = {
      attention: await db.query(reads.attention),
      intakes: await db.query(reads.intakes),
      money_to_chase: await db.query(reads['claim-run']),
      slow_payers: (await db.query(reads['slow-payers'])).slice(0, 3),
      compliance: checks.checks.filter((c) => c.result !== 'clean').map(({ rule, result, count }) => ({ rule, result, count })),
      enquiries_by_source: await db.query(reads.conversion),
    };
  } else if (cmd === 'add' || cmd === 'update') {
    const t = entity(rest[0]);
    const data = JSON.parse(rest[cmd === 'add' ? 1 : 2] || '{}');
    if ('stage' in data && t === 'applications') throw Error('Use stage <ref> <stage> to move an application');
    if (t === 'notes' && cmd === 'update') throw Error('Notes are the history and are never edited. Log a correction.');
    for (const k of Object.keys(data).filter((k) => k.endsWith('_id') && typeof data[k] === 'string' && !/^[0-9a-f-]{36}$/i.test(data[k]))) {
      const target = { student_id: 'students', course_id: 'courses', staff_id: 'staff', institution_id: 'institutions', application_id: 'applications', sub_agent_id: 'sub_agents' }[k];
      if (target) data[k] = (await match(db, target, data[k])).id;
    }
    if (cmd === 'add' && t === 'applications' && !data.ref) {
      const [{ n }] = await db.query("select coalesce(max(substring(ref from 'HL-(\\d+)')::int), 1000) + 1 as n from applications where ref ~ '^HL-\\d+$'");
      data.ref = 'HL-' + n;
    }
    out = cmd === 'add' ? await insert(db, t, data) : await update(db, t, (await match(db, t, rest[1])).id, data);
  } else if (cmd === 'log') {
    const s = await match(db, 'students', rest[0]);
    let body = rest.slice(1).join(' ').trim();
    if (!body) throw Error('Say what happened');
    const k = body.match(/^(call|email|whatsapp|meeting|walk-in):\s*/i);
    const kind = k ? k[1].toLowerCase() : 'note';
    if (k) body = body.slice(k[0].length);
    const on = opt('on') || (await today(db));
    if (on > (await today(db))) throw Error('A contact cannot be in the future. Add a task instead.');
    out = await transaction(db, async () => {
      const note = await insert(db, 'notes', { student_id: s.id, happened_on: on, kind, body, staff_id: s.staff_id });
      await db.query('update students set last_contact_on = greatest(coalesce(last_contact_on, $2::date), $2::date) where id = $1', [s.id, on]);
      return note;
    });
  } else if (cmd === 'stage') {
    const a = await match(db, 'applications', rest[0]);
    const stage = String(rest[1] || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (!STAGES.includes(stage)) throw Error(`Stage must be one of: ${STAGES.join(', ')}`);
    const on = opt('on') || (await today(db));
    out = await transaction(db, async () => {
      const set = { stage, stage_on: on };
      if (stage === 'submitted' && !a.submitted_on) set.submitted_on = on;
      if (/offer/.test(stage) && !a.offer_on) set.offer_on = on;
      if (stage === 'enrolled') set.enrolled_on = a.enrolled_on || on;
      if (['withdrawn', 'refused', 'deferred'].includes(stage)) set.closed_reason = opt('reason') || a.closed_reason;
      const keys = Object.keys(set);
      const [row] = await db.query(`update applications set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning ref, stage, stage_on`, [a.id, ...keys.map((k) => set[k])]);
      await db.query("insert into notes (student_id, application_id, staff_id, happened_on, kind, body) values ($1,$2,$3,$4,'stage',$5)",
        [a.student_id, a.id, a.staff_id, on, `${a.ref}: ${a.stage} to ${stage}${opt('reason') ? ' (' + opt('reason') + ')' : ''}`]);
      if (['accepted', 'coe_issued', 'visa_lodged', 'visa_granted', 'enrolled'].includes(stage)) await db.query("update students set stage = 'client' where id = $1 and stage in ('enquiry','prospect')", [a.student_id]);
      if (stage === 'enrolled') {
        // Expected commission for the first claim, from the institution's terms.
        const [t] = await db.query(`select i.commission_basis, coalesce(c.commission_pct, i.commission_pct) as pct, i.currency, i.claim_after_days,
          coalesce(a.tuition_first_year_cents, c.tuition_per_year_cents) as tuition, coalesce(sa.share_pct, 0) as share, coalesce(a.census_on, $2::date + 14) as census
          from applications a join courses c on c.id = a.course_id join institutions i on i.id = c.institution_id
          join students s on s.id = a.student_id left join sub_agents sa on sa.id = s.sub_agent_id where a.id = $1`, [a.id, on]);
        if (t.tuition) {
          const base = t.commission_basis === 'per_term' ? Math.round(t.tuition / 2) : Number(t.tuition);
          const amount = Math.round((base * Number(t.pct)) / 100);
          await db.query(`insert into commissions (application_id, period, claimable_on, tuition_cents, pct, amount_cents, currency, sub_agent_share_cents)
            values ($1,$2,$3::date + $4::int,$5,$6,$7,$8,$9) on conflict (application_id, period) do nothing`,
            [a.id, t.commission_basis === 'per_term' ? 'Term 1' : t.commission_basis === 'full_course' ? 'Full course' : 'First year', t.census, t.claim_after_days, base, t.pct, amount, t.currency, Math.round((amount * Number(t.share)) / 100)]);
        }
      }
      return row;
    });
  } else if (cmd === 'task-done') {
    const t = await match(db, 'tasks', rest.join(' '));
    out = await update(db, 'tasks', t.id, { done_on: opt('on') || (await today(db)) });
  } else if (cmd === 'invoice') {
    const i = await match(db, 'institutions', rest.join(' '));
    const no = opt('invoice');
    if (!no) throw Error('Give the invoice number: --invoice=HL-INV-0400');
    out = await db.query(`update commissions cm set status = 'invoiced', invoice_no = $2, invoiced_on = $3
      from applications a, courses c where a.id = cm.application_id and c.id = a.course_id and c.institution_id = $1
      and cm.status = 'expected' and cm.claimable_on <= $3 returning cm.period, cm.amount_cents, cm.currency, cm.invoice_no`, [i.id, no, opt('on') || (await today(db))]);
    if (!out.length) throw Error(`Nothing is claimable from ${i.name} today`);
  } else if (cmd === 'paid') {
    const no = rest[0];
    const rows = await db.query("select id, amount_cents from commissions where invoice_no = $1 and status = 'invoiced'", [no]);
    if (!rows.length) throw Error(`No unpaid claims on invoice ${no}`);
    const amount = opt('amount') ? Math.round(Number(opt('amount')) * 100) : rows.reduce((s, r) => s + Number(r.amount_cents), 0);
    const due = rows.reduce((s, r) => s + Number(r.amount_cents), 0);
    const on = opt('on') || (await today(db));
    out = await transaction(db, async () => {
      for (const r of rows) await db.query("update commissions set status = 'paid', paid_on = $2, paid_cents = round(amount_cents * $3::numeric / $4) where id = $1", [r.id, on, amount, due]);
      return { invoice: no, claims: rows.length, received_cents: amount, short_cents: due - amount, currency: (await db.query('select currency from commissions where id = $1', [rows[0].id]))[0].currency, note: 'Recorded. Recording a payment does not move money.' };
    });
  } else if (cmd === 'block') {
    const a = await match(db, 'applications', rest[0]);
    if (!opt('reason')) throw Error('Say why: --reason="onshore transfer, National Code 4.7"');
    out = await db.query("update commissions set status = 'blocked', note = $2 where application_id = $1 and status = 'expected' returning period, amount_cents, currency, status", [a.id, opt('reason')]);
  } else if (cmd === 'sub-agent-paid') {
    const sa = await match(db, 'sub_agents', rest.join(' '));
    out = await db.query(`update commissions cm set sub_agent_paid_on = $2 from applications a, students s
      where a.id = cm.application_id and s.id = a.student_id and s.sub_agent_id = $1 and cm.status = 'paid' and cm.sub_agent_share_cents > 0 and cm.sub_agent_paid_on is null
      returning cm.period, cm.sub_agent_share_cents, cm.currency`, [sa.id, opt('on') || (await today(db))]);
  } else if (cmd === 'draft-follow-up') {
    const s = await match(db, 'students', rest.join(' '));
    const [last] = await db.query('select happened_on, body from notes where student_id = $1 order by happened_on desc, created_at desc limit 1', [s.id]);
    const who = (await db.query('select name from staff where id = $1', [s.staff_id]))[0]?.name || '[your name]';
    out = draft(`follow-up-${s.name.toLowerCase().replace(/\W+/g, '-')}`, `# DRAFT: follow-up to ${s.name}\n\nTo: ${s.email || '[email]'}\nSubject: Your study plans${s.interested_in ? ': ' + s.interested_in : ''}\n\nHi ${s.name.split(' ')[0]},\n\nI wanted to check in on your plans${s.interested_in ? ` for ${s.interested_in}` : ''}. ${last ? 'Last time we spoke: ' + last.body : ''}\n\nIf it helps, I can shortlist two or three courses with the next intake dates and the English score each one needs. Reply with a good time for a 15 minute call.\n\nKind regards,\n${who}\n${await brandName()}\n`);
  } else if (cmd === 'draft-offer-chase') {
    const a = await match(db, 'applications', rest[0]);
    const [b] = await db.query('select * from application_board where id = $1', [a.id]);
    const [s] = await db.query('select name, email from students where id = $1', [a.student_id]);
    out = draft(`offer-${a.ref}`, `# DRAFT: offer chase for ${a.ref}\n\nTo: ${s.email || '[email]'}\nSubject: Your offer from ${b.institution}\n\nHi ${s.name.split(' ')[0]},\n\nYour ${b.stage.replace('_', ' ')} from ${b.institution} for ${b.course} (${b.intake} intake) ${a.offer_expires_on ? `expires on ${a.offer_expires_on}` : 'is waiting on you'}.\n\n${a.conditions ? `Still to clear: ${a.conditions}.\n\n` : ''}${a.deposit_due_on && !a.deposit_paid_on ? `The deposit was due on ${a.deposit_due_on}.\n\n` : ''}Tell me where you are and I will sort the next step with the ${b.country === 'AU' ? 'university' : 'institution'} today.\n\nKind regards,\n${b.counsellor || '[your name]'}\n${await brandName()}\n`);
  } else if (cmd === 'draft-document-request') {
    const s = await match(db, 'students', rest.join(' '));
    const docs = await db.query("select kind, status, note from documents where student_id = $1 and status in ('required','rejected','expired') order by kind", [s.id]);
    if (!docs.length) throw Error(`${s.name} has no documents outstanding`);
    out = draft(`documents-${s.name.toLowerCase().replace(/\W+/g, '-')}`, `# DRAFT: documents still needed from ${s.name}\n\nTo: ${s.email || '[email]'}\nSubject: Documents we still need\n\nHi ${s.name.split(' ')[0]},\n\nTo keep your application moving we still need:\n\n${docs.map((d) => `- ${d.kind.replaceAll('_', ' ')}${d.status !== 'required' ? ` (${d.status})` : ''}${d.note ? ': ' + d.note : ''}`).join('\n')}\n\nA clear scan or photo of each is fine. Please do not type passport or bank account numbers into the email itself.\n\nKind regards,\n${await brandName()}\n`);
  } else if (cmd === 'draft-commission-claim') {
    const i = await match(db, 'institutions', rest.join(' '));
    const claims = await db.query("select student, ref, period, claimable_on, currency, amount_cents from commission_ledger where institution_id = $1 and state = 'claim now' order by student", [i.id]);
    const held = await db.query("select student from commission_ledger where institution_id = $1 and state like 'hold%'", [i.id]);
    if (!claims.length) throw Error(`Nothing is claimable from ${i.name} today${held.length ? `. ${held.length} claim(s) for ${[...new Set(held.map((h) => h.student))].join(', ')} are on hold under the onshore transfer rule: see /compliance` : ''}`);
    const blocked = (await compliance(db)).findings.filter((f) => f.rule.startsWith('AU onshore') && claims.some((c) => f.detail.startsWith(c.ref + ':')));
    if (blocked.length) throw Error(`Not drafted. ${[...new Set(blocked.map((b) => b.record))].join(', ')} may not be claimed (onshore transfer rule). Block it first: block <ref> --reason=...`);
    const total = claims.reduce((s, c) => s + Number(c.amount_cents), 0);
    out = draft(`commission-claim-${i.name.toLowerCase().replace(/\W+/g, '-')}`, `# DRAFT: commission claim to ${i.name}\n\nTo: ${i.contact_email || '[agent team email]'}\nSubject: Commission claim, ${claims.length} student(s)\n\nHi ${(i.contact_name || 'team').split(' ')[0]},\n\nPlease find our commission claim for the students below, who have passed census. Our tax invoice is attached.\n\n| Student | Application | Period | Amount |\n|---|---|---|---|\n${claims.map((c) => `| ${c.student} | ${c.ref} | ${c.period} | ${money(c.amount_cents, c.currency)} |`).join('\n')}\n| **Total** | | | **${money(total, claims[0].currency)}** |\n\nYour agreement pays within ${i.pays_within_days} days of invoice. Tell me if any enrolment details differ from your records.\n\nKind regards,\n${await brandName()}\n`);
    out.invoice = 'Render the tax invoice to attach: npm run docs -- commission-claim';
    out.claims = claims.length;
    out.total_cents = total;
    out.currency = claims[0].currency;
  } else if (cmd === 'import') {
    if ((rest[0] || '').toLowerCase() !== 'agentcis') throw Error('Supported: import agentcis <folder> [--apply]');
    out = await importAgentcis(db, rest[1] && path.resolve(rest[1]), apply);
  } else if (cmd === 'export') {
    if (!rest[0]) throw Error('Give a new folder to export into');
    const dir = path.resolve(rest[0]);
    if (fs.existsSync(dir)) throw Error(`${dir} already exists. Pick a new folder.`);
    const snapshot = {};
    for (const t of [...Object.keys(fields), 'settings']) snapshot[t] = await db.query(`select * from ${t} order by created_at nulls last`.replace(' order by created_at nulls last', t === 'settings' ? ' order by key' : ' order by created_at'));
    fs.mkdirSync(dir, { recursive: true });
    for (const [t, rows] of Object.entries(snapshot)) fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2) + '\n');
    out = { folder: dir, tables: Object.fromEntries(Object.entries(snapshot).map(([t, r]) => [t, r.length])), note: 'Every record as JSON. Holds personal data: store it like the database.' };
  } else throw Error(`Unknown command: ${cmd}. Try: npm run agency -- help`);

  print(out);
} catch (e) {
  if (json) console.log(JSON.stringify({ error: e.message }));
  else console.error(e.message);
  process.exitCode = 1;
} finally {
  if (db) await db.close();
}
