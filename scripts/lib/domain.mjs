// Every report the agency runs, as one query each, plus matching, writes and the compliance checks.

// Writable fields per table. Anything else is refused, so a typo never becomes a silent no-op.
export const fields = {
  staff: ['name', 'email', 'role', 'office', 'based_in', 'nz_adviser_licence', 'au_marn', 'active'],
  institutions: ['name', 'country', 'kind', 'provider_code', 'currency', 'agreement_start', 'agreement_end', 'commission_pct', 'commission_basis', 'claim_after_days', 'pays_within_days', 'contact_name', 'contact_email', 'notes'],
  courses: ['institution_id', 'name', 'level', 'duration_weeks', 'tuition_per_year_cents', 'commission_pct', 'intakes', 'active'],
  sub_agents: ['name', 'country', 'share_pct', 'agreement_end', 'email'],
  students: ['name', 'email', 'phone', 'nationality', 'date_of_birth', 'location', 'stage', 'source', 'sub_agent_id', 'staff_id', 'interested_in', 'english_test', 'english_score', 'passport_expires_on', 'guardian_name', 'welfare_arrangement', 'current_provider', 'current_course_started_on', 'last_contact_on', 'next_follow_up_on', 'privacy_review_on', 'lost_reason'],
  applications: ['ref', 'student_id', 'course_id', 'staff_id', 'intake_on', 'submitted_on', 'offer_on', 'offer_expires_on', 'conditions', 'deposit_due_on', 'deposit_paid_on', 'tuition_first_year_cents', 'visa_needed', 'onshore_transfer', 'prior_provider', 'accepted_by_provider_on', 'transfer_exception', 'coe_ref', 'enrolled_on', 'census_on', 'closed_reason'],
  documents: ['student_id', 'application_id', 'kind', 'status', 'received_on', 'expires_on', 'retain_until', 'note'],
  visas: ['student_id', 'application_id', 'country', 'kind', 'staff_id', 'adviser_location', 'status', 'lodged_on', 'decided_on', 'expires_on', 'reference'],
  commissions: ['application_id', 'period', 'claimable_on', 'tuition_cents', 'pct', 'amount_cents', 'currency', 'status', 'invoice_no', 'invoiced_on', 'paid_on', 'paid_cents', 'sub_agent_share_cents', 'sub_agent_paid_on', 'note'],
  tasks: ['student_id', 'application_id', 'staff_id', 'title', 'due_on', 'done_on'],
  notes: ['student_id', 'application_id', 'staff_id', 'happened_on', 'kind', 'body'],
};

const aliases = {
  student: 'students', students: 'students', enquiry: 'students', contact: 'students', client: 'students',
  institution: 'institutions', institutions: 'institutions', partner: 'institutions', provider: 'institutions',
  course: 'courses', courses: 'courses', product: 'courses',
  application: 'applications', applications: 'applications',
  document: 'documents', documents: 'documents', doc: 'documents',
  visa: 'visas', visas: 'visas',
  commission: 'commissions', commissions: 'commissions', claim: 'commissions',
  task: 'tasks', tasks: 'tasks',
  staff: 'staff', counsellor: 'staff',
  'sub-agent': 'sub_agents', sub_agent: 'sub_agents', sub_agents: 'sub_agents', subagent: 'sub_agents',
  note: 'notes', notes: 'notes',
};

export function entity(name) {
  const t = aliases[String(name || '').toLowerCase()];
  if (!t) throw Error(`Unknown record type: ${name}. Use one of: ${Object.keys(fields).join(', ')}`);
  return t;
}

// The stages, in order. `stage` moves an application along this line.
export const STAGES = ['draft', 'submitted', 'conditional_offer', 'unconditional_offer', 'accepted', 'coe_issued', 'visa_lodged', 'visa_granted', 'enrolled', 'completed', 'withdrawn', 'refused', 'deferred'];

export const reads = {
  students: `
    select s.name, s.stage, s.nationality, s.location, s.source, st.name as counsellor,
           s.last_contact_on as last_contact, s.next_follow_up_on as follow_up,
           (select count(*) from applications a where a.student_id = s.id and a.stage not in ('completed','withdrawn','refused'))::int as open_apps
    from students s left join staff st on st.id = s.staff_id
    where s.stage in ('enquiry','prospect','client')
    order by s.stage, s.name`,

  enquiries: `
    select s.name, s.stage, s.source, s.interested_in, coalesce(st.name, 'unassigned') as counsellor,
           current_date - coalesce(s.last_contact_on, s.created_on) as days_quiet,
           s.next_follow_up_on as follow_up
    from students s left join staff st on st.id = s.staff_id
    where s.stage in ('enquiry','prospect')
    order by days_quiet desc`,

  applications: `
    select ref, student, institution, course, intake, stage, days_in_stage, counsellor, next_step
    from application_board where stage <> 'enrolled' order by intake, student`,

  intakes: `
    select to_char(b.intake, 'YYYY-MM') as intake_month, b.institution,
           count(*)::int as students,
           count(*) filter (where b.stage in ('draft','submitted','conditional_offer','unconditional_offer'))::int as still_at_offer,
           count(*) filter (where b.stage in ('accepted','coe_issued','visa_lodged'))::int as accepted_or_visa,
           count(*) filter (where b.stage in ('visa_granted','enrolled'))::int as ready,
           string_agg(b.student, ', ' order by b.student) as who
    from application_board b
    where b.intake >= current_date - 14
    group by 1, 2 order by 1, 2`,

  offers: `
    select b.ref, b.student, b.institution, b.stage, b.offer_expires_on as offer_expires,
           b.offer_expires_on - current_date as days_left, a.conditions, a.deposit_due_on as deposit_due,
           case when a.deposit_paid_on is not null then 'paid' when a.deposit_due_on < current_date then 'OVERDUE' else '' end as deposit
    from application_board b join applications a on a.id = b.id
    where b.stage in ('conditional_offer','unconditional_offer')
    order by b.offer_expires_on nulls last`,

  documents: `
    select s.name as student, a.ref, d.kind, d.status, d.note,
           case when d.expires_on < current_date then 'expired ' || d.expires_on else '' end as expiry
    from documents d join students s on s.id = d.student_id
    left join applications a on a.id = d.application_id
    where d.status in ('required','rejected','expired') and coalesce(a.stage, 'draft') not in ('completed','withdrawn','refused')
    union all
    select s.name, null, 'passport', 'expires soon', 'passport ends ' || s.passport_expires_on || ', within 6 months of intake', ''
    from students s join applications a on a.student_id = s.id
    where a.stage not in ('completed','withdrawn','refused','enrolled') and s.passport_expires_on < a.intake_on + 183
    order by 1, 3`,

  visas: `
    select s.name as student, v.country, v.kind, v.status, coalesce(st.name, '-') as adviser, v.adviser_location,
           v.lodged_on as lodged, case when v.status = 'lodged' then current_date - v.lodged_on end as days_waiting,
           v.expires_on as expires, a.ref, a.intake_on as intake
    from visas v join students s on s.id = v.student_id
    left join staff st on st.id = v.staff_id
    left join applications a on a.id = v.application_id
    where v.status in ('preparing','lodged') or (v.status = 'granted' and v.expires_on >= current_date)
    order by case v.status when 'lodged' then 0 when 'preparing' then 1 else 2 end, v.expires_on`,

  commissions: `
    select state, institution, student, ref, period, claimable_on, currency, amount_cents, invoice_no, days_since_invoice
    from commission_ledger
    where status in ('expected','invoiced') and (state <> 'expected' or claimable_on <= current_date + 90)
    order by case state when 'claim now' then 0 when 'overdue' then 1 when 'awaiting payment' then 2 when 'expected' then 4 else 3 end, claimable_on`,

  'claim-run': `
    select institution, currency, count(*)::int as claims, sum(amount_cents)::bigint as amount_cents,
           min(claimable_on) as oldest_claimable, string_agg(student || ' (' || period || ')', ', ' order by student) as students
    from commission_ledger where state = 'claim now'
    group by institution, currency order by amount_cents desc`,

  'slow-payers': `
    select i.name as institution, i.pays_within_days as terms_days,
           count(*) filter (where cm.status = 'paid')::int as paid_invoices,
           round(avg(cm.paid_on - cm.invoiced_on) filter (where cm.status = 'paid'), 1) as avg_days_to_pay,
           max(cm.paid_on - cm.invoiced_on) filter (where cm.status = 'paid') as slowest_days,
           count(*) filter (where cm.status = 'invoiced')::int as unpaid_invoices,
           i.currency, coalesce(sum(cm.amount_cents) filter (where cm.status = 'invoiced'), 0)::bigint as unpaid_cents
    from institutions i join courses c on c.institution_id = i.id
    join applications a on a.course_id = c.id join commissions cm on cm.application_id = a.id
    where cm.invoiced_on >= current_date - 730
    group by i.id order by avg_days_to_pay desc nulls last`,

  forecast: `
    select case when claimable_on <= current_date then 'claimable now' else to_char(claimable_on, 'YYYY-MM') end as month,
           currency, count(*)::int as claims, sum(amount_cents)::bigint as amount_cents,
           sum(sub_agent_share_cents)::bigint as sub_agent_share_cents,
           sum(amount_cents - sub_agent_share_cents)::bigint as ours_cents
    from commissions
    where status = 'expected' and claimable_on <= current_date + 183
    group by 1, 2 order by 1, 2`,

  'sub-agent-payouts': `
    select sa.name as sub_agent, cm.currency, count(*)::int as claims, sum(cm.sub_agent_share_cents)::bigint as owed_cents,
           min(cm.paid_on) as oldest_paid, string_agg(s.name || ' ' || cm.period, ', ' order by s.name) as for_students
    from commissions cm join applications a on a.id = cm.application_id
    join students s on s.id = a.student_id join sub_agents sa on sa.id = s.sub_agent_id
    where cm.status = 'paid' and cm.sub_agent_share_cents > 0 and cm.sub_agent_paid_on is null
    group by sa.name, cm.currency order by sa.name`,

  institutions: `
    select i.name, i.country, i.kind, trim_scale(i.commission_pct) || '% ' || replace(i.commission_basis, '_', ' ') as commission,
           i.agreement_end, i.agreement_end - current_date as days_left,
           (select count(*) from applications a join courses c on c.id = a.course_id where c.institution_id = i.id and a.stage not in ('completed','withdrawn','refused','enrolled'))::int as open_apps,
           (select count(*) from applications a join courses c on c.id = a.course_id where c.institution_id = i.id and a.stage = 'enrolled')::int as studying_now,
           (select count(*) from applications a join courses c on c.id = a.course_id where c.institution_id = i.id and a.enrolled_on >= current_date - 365)::int as enrolled_12m,
           i.currency,
           (select coalesce(sum(cm.paid_cents), 0) from commissions cm join applications a on a.id = cm.application_id join courses c on c.id = a.course_id where c.institution_id = i.id and cm.paid_on >= current_date - 365)::bigint as paid_12m_cents
    from institutions i order by paid_12m_cents desc`,

  courses: `
    select c.name, i.name as institution, c.level, c.duration_weeks as weeks, i.currency, c.tuition_per_year_cents,
           coalesce(c.commission_pct, i.commission_pct) as commission_pct, c.intakes
    from courses c join institutions i on i.id = c.institution_id where c.active order by i.name, c.name`,

  conversion: `
    select s.source,
           count(*)::int as enquiries,
           count(*) filter (where exists (select 1 from applications a where a.student_id = s.id))::int as applied,
           count(*) filter (where exists (select 1 from applications a where a.student_id = s.id and a.enrolled_on is not null))::int as enrolled,
           round(100.0 * count(*) filter (where exists (select 1 from applications a where a.student_id = s.id and a.enrolled_on is not null)) / count(*), 1) as enrolled_pct,
           (select coalesce(sum(cm.paid_cents - cm.sub_agent_share_cents), 0) from commissions cm join applications a on a.id = cm.application_id join students s2 on s2.id = a.student_id where s2.source = s.source and cm.status = 'paid')::bigint as net_commission_cents
    from students s where s.created_on >= current_date - 730
    group by s.source order by enrolled_pct desc`,

  counsellors: `
    select st.name as counsellor, st.office, st.role,
           case when st.nz_adviser_licence is not null then 'NZ licensed' when st.au_marn is not null then 'AU registered' else '-' end as visa_advice,
           (select count(*) from students s where s.staff_id = st.id and s.stage in ('enquiry','prospect'))::int as open_enquiries,
           (select count(*) from applications a where a.staff_id = st.id and a.stage not in ('completed','withdrawn','refused','enrolled'))::int as open_apps,
           (select count(*) from applications a where a.staff_id = st.id and a.enrolled_on >= current_date - 365)::int as enrolled_12m,
           (select count(*) from tasks t where t.staff_id = st.id and t.done_on is null and t.due_on < current_date)::int as overdue_tasks
    from staff st where st.active order by open_apps desc`,

  tasks: `
    select t.title, t.due_on, coalesce(s.name, '-') as student, coalesce(st.name, '-') as owner,
           case when t.due_on < current_date then 'overdue' else '' end as flag
    from tasks t left join students s on s.id = t.student_id left join staff st on st.id = t.staff_id
    where t.done_on is null order by t.due_on`,

  staff: `select name, role, office, based_in, nz_adviser_licence, au_marn, active from staff order by name`,

  'sub-agents': `
    select sa.name, sa.country, sa.share_pct, sa.agreement_end,
           (select count(*) from students s where s.sub_agent_id = sa.id)::int as students
    from sub_agents sa order by sa.name`,

  activity: `
    select n.happened_on as date, n.kind, s.name as student, coalesce(st.name, '-') as by, n.body
    from notes n join students s on s.id = n.student_id left join staff st on st.id = n.staff_id
    where n.happened_on >= current_date - 30 order by n.happened_on desc, n.created_at desc`,

  attention: `select reason, who, owner, detail from attention order by priority, reason, who`,
};

const uuidLike = /^[0-9a-f]{8}(-[0-9a-f]{0,4})*/i;
const nameCol = { applications: 'ref', notes: 'body', documents: 'kind', visas: 'reference', commissions: 'invoice_no', tasks: 'title' };

// Match a record by id prefix, application ref, invoice number or a case-insensitive name fragment.
// More than one match is an error that lists the candidates.
export async function match(db, table, needle) {
  if (!needle) throw Error(`Name the ${table.replace(/s$/, '')} (a name, a ref or an id)`);
  const col = nameCol[table] || 'name';
  const q = String(needle).trim();
  let rows = [];
  if (uuidLike.test(q) && q.length >= 8) rows = await db.query(`select * from ${table} where id::text like $1`, [q.toLowerCase() + '%']);
  if (!rows.length) rows = await db.query(`select * from ${table} where lower(${col}::text) = lower($1)`, [q]);
  if (!rows.length) rows = await db.query(`select * from ${table} where ${col}::text ilike $1 order by ${col} limit 20`, [`%${q}%`]);
  if (!rows.length) throw Error(`No match for "${q}" in ${table}`);
  if (rows.length > 1) throw Error(`Ambiguous "${q}": ${rows.map((r) => r[col]).join(', ')}`);
  return rows[0];
}

function check(table, data) {
  const allowed = fields[table];
  const bad = Object.keys(data).filter((k) => !allowed.includes(k));
  if (bad.length) throw Error(`Unknown field(s) for ${table}: ${bad.join(', ')}. Allowed: ${allowed.join(', ')}`);
  if (!Object.keys(data).length) throw Error('Nothing to write');
}

export async function insert(db, table, data) {
  check(table, data);
  const keys = Object.keys(data);
  const rows = await db.query(
    `insert into ${table} (${keys.join(', ')}) values (${keys.map((_, i) => '$' + (i + 1)).join(', ')}) returning *`,
    keys.map((k) => data[k]),
  );
  return rows[0];
}

export async function update(db, table, id, data) {
  check(table, data);
  const keys = Object.keys(data);
  const rows = await db.query(
    `update ${table} set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning *`,
    [id, ...keys.map((k) => data[k])],
  );
  return rows[0];
}

export async function transaction(db, fn) {
  await db.exec('begin');
  try {
    const out = await fn();
    await db.exec('commit');
    return out;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}

// Each rule: what it checks, the source, and one query returning the records that breach it
// (severity 'breach') or will soon ('due'). docs/compliance.md explains each in words.
export const rules = [
  {
    rule: 'AU onshore transfer commission',
    source: 'National Code 2018 Standards 4.7 and 4.8, amended 2026: education.gov.au/esos-framework/resources/2025-fact-sheet-education-agents-and-commissions',
    sql: `
      select 'breach' as severity, s.name as record, a.ref || ': ' || cm.period || ' commission ' || cm.status || ' from ' || i.name || ' for a student who moved from ' || coalesce(a.prior_provider, 'another provider') || ', accepted ' || a.accepted_by_provider_on as detail
      from commissions cm join applications a on a.id = cm.application_id join students s on s.id = a.student_id
      join courses c on c.id = a.course_id join institutions i on i.id = c.institution_id
      where i.country = 'AU' and a.onshore_transfer and a.transfer_exception is null
        and coalesce(a.accepted_by_provider_on, current_date) > (select value::date from settings where key = 'au_transfer_commission_cutoff')
        and cm.status in ('expected','invoiced','paid')`,
  },
  {
    rule: 'Written agreement with the institution',
    source: 'AU: National Code 2018 Standard 4.2, education.gov.au/esos-framework/resources/standard-4-education-agents. NZ: Pastoral Care Code 2021 Outcome 9 Process 2 and clauses 58 to 59, nzqa.govt.nz',
    sql: `
      select case when i.agreement_end is null or i.agreement_end < current_date then 'breach' else 'due' end as severity,
             i.name as record,
             case when i.agreement_end is null then 'no agreement on file'
                  when i.agreement_end < current_date then 'agreement ended ' || i.agreement_end
                  else 'agreement ends ' || i.agreement_end end
             || ', ' || count(a.id) || ' current student(s) and application(s): ' || string_agg(a.ref, ', ' order by a.ref) as detail
      from institutions i join courses c on c.institution_id = i.id
      join applications a on a.course_id = c.id and a.stage not in ('completed','withdrawn','refused')
      where i.agreement_end is null or i.agreement_end <= current_date + setting_int('agreement_warning_days', 60)
      group by i.id`,
  },
  {
    rule: 'NZ visa advice by a licensed adviser',
    source: 'Immigration Advisers Licensing Act 2007 ss 6 and 11(h), legislation.govt.nz/act/public/2007/0015/latest/DLM407312.html; iaa.govt.nz/can-i-give-advice/information-for-education-agents/',
    sql: `
      select 'breach' as severity, s.name as record,
             v.kind || ' visa advice given ' || v.adviser_location || ' by ' || coalesce(st.name, 'unknown') || ', who holds no NZ adviser licence' as detail
      from visas v join students s on s.id = v.student_id left join staff st on st.id = v.staff_id
      where v.country = 'NZ' and st.nz_adviser_licence is null and (v.adviser_location = 'onshore' or v.kind <> 'student')`,
  },
  {
    rule: 'AU visa help from inside Australia by a registered agent',
    source: 'Migration Act 1958 s 280; OMARA consumer guide, mara.gov.au/get-help-visa-subsite/FIles/consumer_guide_english.pdf',
    sql: `
      select 'breach' as severity, s.name as record,
             v.kind || ' visa help given in Australia by ' || coalesce(st.name, 'unknown') || ', who has no MARN on file' as detail
      from visas v join students s on s.id = v.student_id left join staff st on st.id = v.staff_id
      where v.country = 'AU' and v.adviser_location = 'onshore' and st.au_marn is null`,
  },
  {
    rule: 'Under 18: welfare and guardian arranged',
    source: 'AU: National Code 2018 Standard 5, education.gov.au/esos-framework/resources/standard-5-younger-overseas-students. NZ: Pastoral Care Code 2021, the rules for international learners under 18, nzqa.govt.nz',
    sql: `
      select case when a.intake_on <= current_date + 30 then 'breach' else 'due' end as severity, s.name as record,
             a.ref || ' starts ' || a.intake_on || ' aged ' || extract(year from age(a.intake_on, s.date_of_birth)) || ', no welfare arrangement recorded' as detail
      from applications a join students s on s.id = a.student_id
      where a.stage not in ('completed','withdrawn','refused') and s.date_of_birth is not null
        and age(a.intake_on, s.date_of_birth) < interval '18 years' and s.welfare_arrangement is null`,
  },
  {
    rule: 'Personal documents kept past their retention date',
    source: 'AU: Australian Privacy Principle 11.2, oaic.gov.au. NZ: Privacy Act 2020 information privacy principle 9, privacy.org.nz/privacy-principles/9/',
    sql: `
      select 'breach' as severity, s.name as record, d.kind || ' copy kept, retention ended ' || d.retain_until as detail
      from documents d join students s on s.id = d.student_id where d.retain_until < current_date
      union all
      select 'due', s.name, 'privacy review was due ' || s.privacy_review_on
      from students s where s.privacy_review_on < current_date and s.stage in ('alumni','lost')`,
  },
  {
    rule: 'Passport numbers written into notes',
    source: 'AU: Australian Privacy Principle 11.1, oaic.gov.au. NZ: Privacy Act 2020 information privacy principle 5, privacy.org.nz',
    sql: `
      select 'breach' as severity, s.name as record, 'note of ' || n.happened_on || ' contains what looks like a passport number' as detail
      from notes n join students s on s.id = n.student_id
      where n.body ~* 'passport[^.]{0,20}[A-Z]{1,2}[0-9]{6,8}'`,
  },
];

export async function compliance(db) {
  const checks = [];
  const findings = [];
  for (const r of rules) {
    const rows = await db.query(r.sql);
    const breaches = rows.filter((x) => x.severity === 'breach').length;
    checks.push({ rule: r.rule, result: breaches ? 'BREACH' : rows.length ? 'due soon' : 'clean', count: rows.length, source: r.source });
    for (const x of rows) findings.push({ rule: r.rule, ...x });
  }
  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'breach' ? -1 : 1));
  return { checks, findings };
}
