// Import from an Agentcis export: the client, partner, product and application lists.
// Agentcis hands these over as spreadsheets (list exports, or from its support team on request).
// Save each as CSV into one folder: clients.csv, partners.csv, products.csv, applications.csv.
// Column names vary by account and custom fields, so every column is matched by several names.
// Dry run unless apply is true. A second run adds nothing: every row keeps its Agentcis id.

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseCsv, pick } from './csv.mjs';
import { transaction } from './domain.mjs';

const read = (dir, name) => {
  const file = path.join(dir, name);
  return fs.existsSync(file) ? parseCsv(fs.readFileSync(file, 'utf8')) : [];
};

// dd/mm/yyyy is how Agentcis prints dates in Australia and New Zealand. ISO passes through.
export function toDate(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  m = s.match(/^(?:(\d{1,2})\s+)?([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if (m && months[m[2].toLowerCase()]) return `${m[3]}-${String(months[m[2].toLowerCase()]).padStart(2, '0')}-${(m[1] || '1').padStart(2, '0')}`;
  throw Error(`Unreadable date: ${s}`);
}

const cents = (v) => {
  const n = Number(String(v || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

// Agentcis workflows are set up per agency, so stages are matched by the words in them.
export function mapStage(stage, status) {
  const s = `${stage || ''} ${status || ''}`.toLowerCase();
  if (/discontinu|withdraw|cancel/.test(s)) return 'withdrawn';
  if (/refus|reject|declin/.test(s)) return 'refused';
  if (/complet|graduat/.test(s)) return 'completed';
  if (/enrol/.test(s)) return 'enrolled';
  if (/visa.*grant|grant/.test(s)) return 'visa_granted';
  if (/visa/.test(s)) return 'visa_lodged';
  if (/coe|confirmation of enrol/.test(s)) return 'coe_issued';
  if (/accept|deposit|fee pa/.test(s)) return 'accepted';
  if (/uncondition/.test(s)) return 'unconditional_offer';
  if (/offer/.test(s)) return 'conditional_offer';
  if (/lodg|submit|applic/.test(s)) return 'submitted';
  return 'draft';
}

const contactStage = (v) => {
  const s = String(v || '').toLowerCase();
  if (/client/.test(s)) return 'client';
  if (/prospect|lead/.test(s)) return 'prospect';
  if (/archiv|lost|inactive/.test(s)) return 'lost';
  return 'enquiry';
};

export async function importAgentcis(db, dir, apply) {
  if (!dir || !fs.existsSync(dir)) throw Error('Give the folder holding the Agentcis CSV files');
  const clients = read(dir, 'clients.csv');
  const partners = read(dir, 'partners.csv');
  const products = read(dir, 'products.csv');
  const apps = read(dir, 'applications.csv');
  if (!clients.length && !apps.length) throw Error('No clients.csv or applications.csv in that folder');

  const summary = { mode: apply ? 'applied' : 'dry run (add --apply to write)', staff: 0, institutions: 0, courses: 0, students: 0, applications: 0, already_there: 0, unmatched: [], stage_map: {} };

  const run = async () => {
    const staffIds = new Map((await db.query('select id, lower(name) as name from staff')).map((r) => [r.name, r.id]));
    const staffFor = async (name) => {
      const key = String(name || '').trim().toLowerCase();
      if (!key) return null;
      if (!staffIds.has(key)) {
        const [r] = await db.query('insert into staff (name, source_ref) values ($1, $2) returning id', [String(name).trim(), 'agentcis:staff:' + key]);
        staffIds.set(key, r.id);
        summary.staff++;
      }
      return staffIds.get(key);
    };
    const find = async (table, ref) => (await db.query(`select id from ${table} where source_ref = $1`, [ref]))[0]?.id;

    const instByName = new Map((await db.query('select id, lower(name) as name from institutions')).map((r) => [r.name, r.id]));
    const institution = async (name, row = {}) => {
      const key = String(name || '').trim().toLowerCase();
      if (!key) return null;
      if (instByName.has(key)) return instByName.get(key);
      const id = pick(row, 'Partner ID', 'ID');
      const ref = 'agentcis:partner:' + (id || key);
      const existing = await find('institutions', ref);
      if (existing) { instByName.set(key, existing); summary.already_there++; return existing; }
      const country = pick(row, 'Country') || 'NZ';
      const cc = /austral/i.test(country) ? 'AU' : /zealand/i.test(country) ? 'NZ' : country.slice(0, 2).toUpperCase();
      const [r] = await db.query(
        'insert into institutions (source_ref, name, country, currency, contact_email, notes) values ($1,$2,$3,$4,$5,$6) returning id',
        [ref, String(name).trim(), cc, pick(row, 'Currency') || (cc === 'AU' ? 'AUD' : 'NZD'), pick(row, 'Email', 'Contact Email') || null, 'Imported from Agentcis. Set the agreement dates and commission terms.'],
      );
      instByName.set(key, r.id);
      summary.institutions++;
      return r.id;
    };

    for (const p of partners) await institution(pick(p, 'Partner Name', 'Name', 'Partner'), p);

    const courseKey = new Map();
    const course = async (instId, name, row = {}) => {
      const key = instId + '|' + String(name || 'Unnamed course').trim().toLowerCase();
      if (courseKey.has(key)) return courseKey.get(key);
      const id = pick(row, 'Product ID');
      const ref = 'agentcis:product:' + (id || key);
      let cid = await find('courses', ref);
      if (!cid) cid = (await db.query('select id from courses where institution_id = $1 and lower(name) = lower($2)', [instId, String(name || '').trim()]))[0]?.id;
      if (cid) summary.already_there++;
      else {
        [{ id: cid }] = await db.query(
          'insert into courses (source_ref, institution_id, name, duration_weeks, tuition_per_year_cents, intakes) values ($1,$2,$3,$4,$5,$6) returning id',
          [ref, instId, String(name || 'Unnamed course').trim(), Number(pick(row, 'Duration (weeks)', 'Duration')) || null, cents(pick(row, 'Fees', 'Tuition Fee', 'Total Fee')), pick(row, 'Intakes', 'Intake') || null],
        );
        summary.courses++;
      }
      courseKey.set(key, cid);
      return cid;
    };
    for (const p of products) {
      const inst = await institution(pick(p, 'Partner', 'Partner Name', 'Institution'));
      if (inst) await course(inst, pick(p, 'Product Name', 'Name', 'Product'), p);
    }

    const studentByRef = new Map();
    for (const c of clients) {
      const id = pick(c, 'Client ID', 'Contact ID', 'ID');
      const name = pick(c, 'Name', 'Full Name') || [pick(c, 'First Name'), pick(c, 'Last Name')].filter(Boolean).join(' ');
      if (!name) { summary.unmatched.push(`client row with no name (id ${id || '?'})`); continue; }
      const ref = 'agentcis:client:' + (id || pick(c, 'Email') || name.toLowerCase());
      let sid = await find('students', ref);
      if (sid) summary.already_there++;
      else {
        [{ id: sid }] = await db.query(
          `insert into students (source_ref, name, email, phone, nationality, date_of_birth, stage, source, staff_id, passport_expires_on, created_on)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,coalesce($11::date, current_date)) returning id`,
          [ref, name, pick(c, 'Email', 'Email Address') || null, pick(c, 'Phone', 'Phone Number', 'Mobile') || null,
            pick(c, 'Country of Passport', 'Nationality', 'Country') || null, toDate(pick(c, 'Date of Birth', 'DOB')),
            contactStage(pick(c, 'Contact Type', 'Type', 'Status')), pick(c, 'Source', 'Lead Source') || 'agentcis',
            await staffFor(pick(c, 'Assignee', 'Assigned To', 'Consultant')), toDate(pick(c, 'Passport Expiry', 'Passport Expiry Date')),
            toDate(pick(c, 'Added On', 'Created At', 'Created'))],
        );
        summary.students++;
      }
      studentByRef.set(String(id || name).toLowerCase(), sid);
    }

    for (const a of apps) {
      const id = pick(a, 'Application ID', 'ID');
      const ref = 'agentcis:application:' + (id || JSON.stringify(a));
      if (await find('applications', ref)) { summary.already_there++; continue; }
      const who = pick(a, 'Client ID', 'Contact ID') || pick(a, 'Client', 'Client Name', 'Contact');
      const sid = studentByRef.get(String(who).toLowerCase()) || (await db.query('select id from students where lower(name) = lower($1)', [who]))[0]?.id;
      const inst = await institution(pick(a, 'Partner', 'Partner Name', 'Institution'));
      if (!sid || !inst) { summary.unmatched.push(`application ${id || '?'}: ${!sid ? 'no client ' + who : 'no partner'}`); continue; }
      const cid = await course(inst, pick(a, 'Product', 'Product Name', 'Course'));
      const agStage = pick(a, 'Stage', 'Current Stage');
      const stage = mapStage(agStage, pick(a, 'Status'));
      summary.stage_map[`${agStage || '(blank)'} / ${pick(a, 'Status') || '-'}`] = stage;
      const intake = toDate(pick(a, 'Intake', 'Intake Date', 'Start Date')) || toDate(pick(a, 'Started At', 'Created At')) || new Date().toISOString().slice(0, 10);
      const [{ id: appId }] = await db.query(
        `insert into applications (source_ref, ref, student_id, course_id, staff_id, intake_on, stage, stage_on, submitted_on)
         values ($1,$2,$3,$4,$5,$6,$7,current_date,$8) returning id`,
        [ref, 'AG-' + (id || createHash('sha1').update(JSON.stringify(a)).digest('hex').slice(0, 8)), sid, cid, await staffFor(pick(a, 'Assignee', 'Assigned To')), intake, stage, toDate(pick(a, 'Started At', 'Created At'))],
      );
      await db.query("insert into notes (student_id, application_id, kind, body) values ($1,$2,'note',$3)", [sid, appId, 'Imported from Agentcis. Original row: ' + JSON.stringify(a)]);
      if (['accepted', 'coe_issued', 'visa_lodged', 'visa_granted', 'enrolled', 'completed'].includes(stage)) await db.query("update students set stage = 'client' where id = $1 and stage in ('enquiry','prospect')", [sid]);
      summary.applications++;
    }
    if (!apply) throw Object.assign(Error('dry run'), { dry: true });
  };

  try {
    await transaction(db, run);
  } catch (e) {
    if (!e.dry) throw e;
  }
  return summary;
}
