-- Education Agency for Claude Code: the schema.
-- An education agency places international students with institutions in New Zealand,
-- Australia and beyond, and is paid commission by the institution once the student enrols.
-- Plain Postgres. Runs on any Postgres 13+ and on the embedded PGlite.

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Counsellors and admin staff. A visa adviser registration is what lets someone give
-- visa advice from inside New Zealand (licensed immigration adviser) or Australia
-- (registered migration agent). docs/compliance.md has the rules.
create table staff (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique,
  name text not null,
  email text,
  role text not null default 'counsellor' check (role in ('counsellor','admissions','visa','manager','admin')),
  office text,
  based_in text not null default 'NZ' check (based_in in ('NZ','AU','offshore')),
  nz_adviser_licence text,
  au_marn text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Institutions the agency represents (Agentcis calls them partners).
create table institutions (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique,
  name text not null,
  country text not null default 'NZ',
  kind text not null default 'university' check (kind in ('university','polytechnic','college','english','school','other')),
  provider_code text,
  currency text not null default 'NZD',
  agreement_start date,
  agreement_end date,
  commission_pct numeric(5,2) not null default 10,
  commission_basis text not null default 'first_year' check (commission_basis in ('first_year','per_term','full_course','flat')),
  claim_after_days int not null default 30,
  pays_within_days int not null default 30,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- What the institution sells (Agentcis calls them products).
create table courses (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique,
  institution_id uuid not null references institutions(id),
  name text not null,
  level text,
  duration_weeks int,
  tuition_per_year_cents bigint,
  commission_pct numeric(5,2),
  intakes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Other agents who send students in and share the commission.
create table sub_agents (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique,
  name text not null,
  country text,
  share_pct numeric(5,2) not null default 50,
  agreement_end date,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every person, from first enquiry to enrolled student.
create table students (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique,
  name text not null,
  email text,
  phone text,
  nationality text,
  date_of_birth date,
  location text not null default 'offshore' check (location in ('offshore','onshore NZ','onshore AU')),
  stage text not null default 'enquiry' check (stage in ('enquiry','prospect','client','alumni','lost')),
  source text,
  sub_agent_id uuid references sub_agents(id),
  staff_id uuid references staff(id),
  interested_in text,
  english_test text,
  english_score text,
  passport_expires_on date,
  guardian_name text,
  welfare_arrangement text,
  current_provider text,
  current_course_started_on date,
  last_contact_on date,
  next_follow_up_on date,
  privacy_review_on date,
  lost_reason text,
  created_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One application of one student to one course for one intake.
create table applications (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  source_ref text unique,
  student_id uuid not null references students(id),
  course_id uuid not null references courses(id),
  staff_id uuid references staff(id),
  intake_on date not null,
  stage text not null default 'draft' check (stage in (
    'draft','submitted','conditional_offer','unconditional_offer','accepted','coe_issued',
    'visa_lodged','visa_granted','enrolled','completed','withdrawn','refused','deferred')),
  stage_on date not null default current_date,
  submitted_on date,
  offer_on date,
  offer_expires_on date,
  conditions text,
  deposit_due_on date,
  deposit_paid_on date,
  tuition_first_year_cents bigint,
  visa_needed boolean not null default true,
  onshore_transfer boolean not null default false,
  prior_provider text,
  accepted_by_provider_on date,
  transfer_exception text,
  coe_ref text,
  enrolled_on date,
  census_on date,
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The document checklist for each student and application.
create table documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  application_id uuid references applications(id),
  kind text not null check (kind in (
    'passport','transcript','english_test','statement_of_purpose','financial_evidence',
    'offer_letter','acceptance','coe','insurance','visa_grant','guardian_consent','welfare_letter','other')),
  status text not null default 'required' check (status in ('required','received','verified','rejected','expired')),
  received_on date,
  expires_on date,
  retain_until date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Visa applications. adviser_location is where the adviser was when they gave the advice.
create table visas (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  application_id uuid references applications(id),
  country text not null check (country in ('NZ','AU','other')),
  kind text not null default 'student' check (kind in ('student','guardian','visitor','work','post_study_work','other')),
  staff_id uuid references staff(id),
  adviser_location text not null default 'offshore' check (adviser_location in ('offshore','onshore')),
  status text not null default 'preparing' check (status in ('preparing','lodged','granted','refused','withdrawn')),
  lodged_on date,
  decided_on date,
  expires_on date,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The money: one commission claim per application per period.
create table commissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  period text not null,
  claimable_on date not null,
  tuition_cents bigint not null,
  pct numeric(5,2) not null,
  amount_cents bigint not null,
  currency text not null,
  status text not null default 'expected' check (status in ('expected','invoiced','paid','blocked','written_off')),
  invoice_no text,
  invoiced_on date,
  paid_on date,
  paid_cents bigint,
  sub_agent_share_cents bigint not null default 0,
  sub_agent_paid_on date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, period)
);

-- The history: every call, message, meeting and walk-in. Append only.
create table notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  application_id uuid references applications(id),
  staff_id uuid references staff(id),
  happened_on date not null default current_date,
  kind text not null default 'note' check (kind in ('note','call','email','whatsapp','meeting','walk-in','stage')),
  body text not null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  application_id uuid references applications(id),
  staff_id uuid references staff(id),
  title text not null,
  due_on date not null,
  done_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['staff','institutions','courses','sub_agents','students','applications','documents','visas','commissions','tasks','settings'] loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

create index on applications (student_id);
create index on applications (course_id);
create index on applications (stage);
create index on commissions (status, claimable_on);
create index on notes (student_id, happened_on);
create index on documents (student_id);
create index on visas (student_id);

insert into settings (key, value) values
  ('quiet_days', '7'),
  ('offer_warning_days', '14'),
  ('visa_lead_days', '42'),
  ('visa_expiry_warning_days', '60'),
  ('agreement_warning_days', '60'),
  ('au_transfer_commission_cutoff', '2026-03-31')
on conflict (key) do nothing;

create or replace function setting_int(k text, dflt int) returns int language sql stable as $$
  select coalesce((select value::int from settings where key = k), dflt)
$$;

-- The application board: every open application with what happens next.
create view application_board as
select
  a.id, a.ref,
  s.name as student,
  i.name as institution,
  i.country,
  c.name as course,
  a.intake_on as intake,
  a.stage,
  (current_date - a.stage_on) as days_in_stage,
  st.name as counsellor,
  case a.stage
    when 'draft' then 'finish and submit the application'
    when 'submitted' then 'chase the institution for an offer'
    when 'conditional_offer' then 'clear the conditions: ' || coalesce(a.conditions, 'see offer')
    when 'unconditional_offer' then 'student to accept and pay the deposit'
    when 'accepted' then case when i.country = 'AU' then 'waiting on the CoE' else 'prepare the visa' end
    when 'coe_issued' then 'lodge the visa'
    when 'visa_lodged' then 'waiting on the visa decision'
    when 'visa_granted' then 'pre-departure and enrolment'
    when 'enrolled' then 'claim commission after census'
    else ''
  end as next_step,
  a.offer_expires_on,
  s.id as student_id, a.course_id, i.id as institution_id
from applications a
join students s on s.id = a.student_id
join courses c on c.id = a.course_id
join institutions i on i.id = c.institution_id
left join staff st on st.id = a.staff_id
where a.stage not in ('completed','withdrawn','refused');

-- Commissions with their institution, student and whether they are late.
create view commission_ledger as
select
  cm.id, a.ref, s.name as student, i.name as institution, cm.period,
  cm.claimable_on, cm.status, cm.currency, cm.amount_cents,
  coalesce(cm.paid_cents, 0) as paid_cents,
  cm.sub_agent_share_cents,
  cm.invoice_no, cm.invoiced_on, cm.paid_on,
  case
    when cm.status = 'expected' and cm.claimable_on <= current_date then 'claim now'
    when cm.status = 'invoiced' and cm.invoiced_on + i.pays_within_days < current_date then 'overdue'
    when cm.status = 'invoiced' then 'awaiting payment'
    else cm.status
  end as state,
  case when cm.status = 'invoiced' then current_date - cm.invoiced_on end as days_since_invoice,
  a.id as application_id, i.id as institution_id, s.id as student_id
from commissions cm
join applications a on a.id = cm.application_id
join students s on s.id = a.student_id
join courses c on c.id = a.course_id
join institutions i on i.id = c.institution_id;

-- Everything that needs a person today, one row per reason.
create view attention as
select 'enquiry gone quiet' as reason, s.name as who, coalesce(st.name, 'unassigned') as owner,
       'no contact for ' || (current_date - coalesce(s.last_contact_on, s.created_on)) || ' days (' || coalesce(s.source, 'unknown source') || ')' as detail,
       1 as priority
from students s left join staff st on st.id = s.staff_id
where s.stage in ('enquiry','prospect')
  and current_date - coalesce(s.last_contact_on, s.created_on) > setting_int('quiet_days', 7)
union all
select 'follow-up due', s.name, coalesce(st.name, 'unassigned'), 'was due ' || s.next_follow_up_on, 2
from students s left join staff st on st.id = s.staff_id
where s.next_follow_up_on <= current_date and s.stage not in ('alumni','lost')
union all
select 'offer expiring', b.student, coalesce(b.counsellor, 'unassigned'),
       b.ref || ' ' || b.institution || ', expires ' || b.offer_expires_on, 1
from application_board b
where b.stage in ('conditional_offer','unconditional_offer')
  and b.offer_expires_on <= current_date + setting_int('offer_warning_days', 14)
union all
select 'deposit overdue', s.name, coalesce(st.name, 'unassigned'), a.ref || ' deposit was due ' || a.deposit_due_on, 1
from applications a join students s on s.id = a.student_id left join staff st on st.id = a.staff_id
where a.deposit_due_on < current_date and a.deposit_paid_on is null
  and a.stage in ('unconditional_offer','accepted')
union all
select 'no offer after 21 days', b.student, coalesce(b.counsellor, 'unassigned'), b.ref || ' ' || b.institution || ', submitted ' || b.days_in_stage || ' days ago', 2
from application_board b where b.stage = 'submitted' and b.days_in_stage > 21
union all
select 'visa not lodged', b.student, coalesce(b.counsellor, 'unassigned'),
       b.ref || ' starts ' || b.intake || ' (' || (b.intake - current_date) || ' days)', 1
from application_board b join applications a on a.id = b.id
where a.visa_needed and b.stage in ('unconditional_offer','accepted','coe_issued')
  and b.intake <= current_date + setting_int('visa_lead_days', 42)
  and not exists (select 1 from visas v where v.application_id = a.id and v.status in ('lodged','granted'))
union all
select 'visa expiring', s.name, coalesce(st.name, 'unassigned'),
       v.country || ' ' || v.kind || ' visa expires ' || v.expires_on, 1
from visas v join students s on s.id = v.student_id left join staff st on st.id = s.staff_id
where v.status = 'granted' and v.expires_on between current_date and current_date + setting_int('visa_expiry_warning_days', 60)
  and not exists (select 1 from visas v2 where v2.student_id = v.student_id and v2.id <> v.id
                  and (v2.status in ('preparing','lodged') or (v2.status = 'granted' and v2.expires_on > v.expires_on)))
union all
select 'documents missing', s.name, coalesce(st.name, 'unassigned'),
       count(*) || ' still required: ' || string_agg(d.kind, ', ' order by d.kind), 2
from documents d join students s on s.id = d.student_id left join staff st on st.id = s.staff_id
join applications a on a.id = d.application_id
where d.status in ('required','rejected','expired') and a.stage not in ('completed','withdrawn','refused','enrolled')
group by s.name, st.name
union all
select 'commission to claim', l.institution, 'accounts', count(*) || ' claims, ' || l.currency || ' ' || to_char(sum(l.amount_cents) / 100.0, 'FM999,999,990') , 1
from commission_ledger l where l.state = 'claim now' group by l.institution, l.currency
union all
select 'commission overdue', l.institution, 'accounts', count(*) || ' invoices, ' || l.currency || ' ' || to_char(sum(l.amount_cents - l.paid_cents) / 100.0, 'FM999,999,990') || ', oldest ' || max(l.days_since_invoice) || ' days', 1
from commission_ledger l where l.state = 'overdue' group by l.institution, l.currency
union all
select 'agreement ending', i.name, 'manager',
       case when i.agreement_end < current_date then 'agreement ended ' || i.agreement_end else 'agreement ends ' || i.agreement_end end, 1
from institutions i
where i.agreement_end <= current_date + setting_int('agreement_warning_days', 60)
  and exists (select 1 from applications a join courses c on c.id = a.course_id where c.institution_id = i.id and a.stage not in ('completed','withdrawn','refused'))
union all
select 'task overdue', coalesce(s.name, '-'), coalesce(st.name, 'unassigned'), t.title || ' (due ' || t.due_on || ')', 2
from tasks t left join students s on s.id = t.student_id left join staff st on st.id = t.staff_id
where t.done_on is null and t.due_on < current_date;
