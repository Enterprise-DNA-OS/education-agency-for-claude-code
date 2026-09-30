-- Demo data: Harbourline Education, a fictional education agency with offices in Auckland,
-- Melbourne and Kathmandu. Every person, institution and number here is invented.
-- Dates are relative to the day you seed, so the demo always has something to say.
-- Safe to run twice: fixed ids and "on conflict do nothing". Never run it on a real database.

begin;

insert into staff (id, name, email, role, office, based_in, nz_adviser_licence, au_marn) values
  ('00000000-0000-4000-8000-000000000101', 'Priya Sharma', 'priya@harbourline.example', 'counsellor', 'Auckland', 'NZ', 'DEMO-LIA-0412', null),
  ('00000000-0000-4000-8000-000000000102', 'Tom Nguyen', 'tom@harbourline.example', 'visa', 'Melbourne', 'AU', null, 'DEMO-MARN-1790'),
  ('00000000-0000-4000-8000-000000000103', 'Ana Silva', 'ana@harbourline.example', 'counsellor', 'Melbourne', 'AU', null, null),
  ('00000000-0000-4000-8000-000000000104', 'Bikash Thapa', 'bikash@harbourline.example', 'counsellor', 'Kathmandu', 'offshore', null, null),
  ('00000000-0000-4000-8000-000000000105', 'Grace Liu', 'grace@harbourline.example', 'manager', 'Auckland', 'NZ', null, null)
on conflict do nothing;

insert into institutions (id, name, country, kind, provider_code, currency, agreement_start, agreement_end, commission_pct, commission_basis, claim_after_days, pays_within_days, contact_name, contact_email) values
  ('00000000-0000-4000-8000-000000000201', 'Harbour City University', 'AU', 'university', 'DEMO-CRICOS-01', 'AUD', current_date - 700, current_date + 400, 15, 'first_year', 30, 45, 'Helen Marsh', 'agents@hcu.example'),
  ('00000000-0000-4000-8000-000000000202', 'Southbank College of Business', 'AU', 'college', 'DEMO-CRICOS-02', 'AUD', current_date - 680, current_date + 35, 20, 'per_term', 21, 30, 'Omar Haddad', 'partners@southbank.example'),
  ('00000000-0000-4000-8000-000000000203', 'Northshore Institute of Technology', 'NZ', 'polytechnic', 'DEMO-NZQA-03', 'NZD', current_date - 720, current_date + 500, 12, 'first_year', 30, 30, 'Kiri Walker', 'international@northshore.example'),
  ('00000000-0000-4000-8000-000000000204', 'Pacific English Academy', 'NZ', 'english', 'DEMO-NZQA-04', 'NZD', current_date - 720, current_date + 300, 20, 'full_course', 14, 14, 'Sam Ruiz', 'agents@pacificenglish.example'),
  ('00000000-0000-4000-8000-000000000205', 'Canterbury Plains Polytechnic', 'NZ', 'polytechnic', 'DEMO-NZQA-05', 'NZD', current_date - 750, current_date - 20, 10, 'first_year', 30, 30, 'Rob Fletcher', 'intl@cpp.example'),
  ('00000000-0000-4000-8000-000000000206', 'Riverside Grammar', 'NZ', 'school', 'DEMO-NZQA-06', 'NZD', current_date - 400, current_date + 600, 10, 'first_year', 30, 30, 'Jo Carter', 'international@riverside.example'),
  ('00000000-0000-4000-8000-000000000207', 'Eastern Institute of Hospitality', 'AU', 'college', 'DEMO-CRICOS-07', 'AUD', current_date - 700, current_date + 250, 25, 'per_term', 21, 30, 'Mina Park', 'agents@eih.example')
on conflict do nothing;

insert into courses (id, institution_id, name, level, duration_weeks, tuition_per_year_cents, intakes) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', 'Master of Data Science', 'masters', 104, 4800000, 'Feb, Jul'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000201', 'Bachelor of Nursing', 'bachelor', 156, 4200000, 'Feb'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000202', 'Diploma of Business', 'diploma', 52, 1400000, 'Jan, Apr, Jul, Oct'),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000202', 'Advanced Diploma of Leadership and Management', 'diploma', 52, 1500000, 'Jan, Apr, Jul, Oct'),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000203', 'Graduate Diploma in Information Technology', 'graduate diploma', 52, 2600000, 'Feb, Jul'),
  ('00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000203', 'Bachelor of Engineering Technology', 'bachelor', 156, 3000000, 'Feb'),
  ('00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000000204', 'General English (24 weeks)', 'english', 24, 980000, 'Every Monday'),
  ('00000000-0000-4000-8000-000000000308', '00000000-0000-4000-8000-000000000205', 'Diploma in Agriculture', 'diploma', 52, 2400000, 'Feb, Jul'),
  ('00000000-0000-4000-8000-000000000309', '00000000-0000-4000-8000-000000000206', 'International Year 11 to 13', 'school', 52, 2300000, 'Each term'),
  ('00000000-0000-4000-8000-000000000310', '00000000-0000-4000-8000-000000000207', 'Certificate IV in Commercial Cookery', 'certificate', 52, 1600000, 'Jan, Apr, Jul, Oct')
on conflict do nothing;

insert into sub_agents (id, name, country, share_pct, agreement_end, email) values
  ('00000000-0000-4000-8000-000000000401', 'Himalaya Study Link', 'Nepal', 50, current_date + 300, 'office@himalayastudy.example'),
  ('00000000-0000-4000-8000-000000000402', 'Manila Pathways', 'Philippines', 40, current_date + 200, 'hello@manilapathways.example')
on conflict do nothing;

-- The live caseload.
insert into students (id, name, email, phone, nationality, date_of_birth, location, stage, source, sub_agent_id, staff_id, interested_in, english_test, english_score, passport_expires_on, guardian_name, welfare_arrangement, current_provider, current_course_started_on, last_contact_on, next_follow_up_on, privacy_review_on, created_on) values
  ('00000000-0000-4000-8000-000000000501', 'Aarav Patel', 'aarav.p@example.test', '+91 98200 11001', 'India', '2000-04-11', 'offshore', 'client', 'website', null, '00000000-0000-4000-8000-000000000101', 'IT postgraduate, NZ', 'IELTS', '6.5', current_date + 1500, null, null, null, null, current_date - 4, null, null, current_date - 120),
  ('00000000-0000-4000-8000-000000000502', 'Mei Lin Chen', 'meilin.c@example.test', '+86 138 0000 1002', 'China', '1999-09-02', 'offshore', 'client', 'referral', null, '00000000-0000-4000-8000-000000000102', 'Data science masters, AU', 'IELTS', '6.0 (needs 6.5)', current_date + 2000, null, null, null, null, current_date - 6, null, null, current_date - 90),
  ('00000000-0000-4000-8000-000000000503', 'Sujan Karki', 'sujan.k@example.test', '+977 980 000 1003', 'Nepal', '2002-01-20', 'offshore', 'client', 'sub-agent', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000104', 'Business diploma, AU', 'PTE', '58', current_date + 1200, null, null, null, null, current_date - 3, null, null, current_date - 100),
  ('00000000-0000-4000-8000-000000000504', 'Maria Santos', 'maria.s@example.test', '+61 400 000 504', 'Philippines', '1996-06-15', 'onshore AU', 'client', 'sub-agent', '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000103', 'Commercial cookery, switching college', 'IELTS', '6.0', current_date + 900, null, null, 'Bayside Training Academy', current_date - 200, current_date - 5, null, null, current_date - 70),
  ('00000000-0000-4000-8000-000000000505', 'Daniel Kim', 'daniel.k@example.test', '+64 21 000 505', 'South Korea', '2001-11-30', 'onshore NZ', 'client', 'expo', null, '00000000-0000-4000-8000-000000000101', 'English then engineering, NZ', 'IELTS', '5.5', current_date + 1800, null, null, 'Pacific English Academy', current_date - 60, current_date - 8, current_date + 3, null, current_date - 150),
  ('00000000-0000-4000-8000-000000000506', 'Nguyen Thi Hoa', 'hoa.n@example.test', '+84 90 000 0506', 'Vietnam', (current_date - interval '16 years 2 months')::date, 'offshore', 'client', 'referral', null, '00000000-0000-4000-8000-000000000101', 'Secondary school, NZ', null, null, current_date + 1600, null, null, null, null, current_date - 2, null, null, current_date - 45),
  ('00000000-0000-4000-8000-000000000507', 'Rahul Verma', 'rahul.v@example.test', '+91 98100 00507', 'India', '2003-02-14', 'offshore', 'enquiry', 'facebook', null, '00000000-0000-4000-8000-000000000103', 'Nursing, AU', null, null, null, null, null, null, null, current_date - 12, null, null, current_date - 14),
  ('00000000-0000-4000-8000-000000000508', 'Fatima Noor', 'fatima.n@example.test', '+92 300 000 0508', 'Pakistan', '2001-07-07', 'offshore', 'prospect', 'website', null, '00000000-0000-4000-8000-000000000103', 'Business, AU or NZ', 'IELTS', '6.5', current_date + 1100, null, null, null, null, current_date - 9, null, null, current_date - 30),
  ('00000000-0000-4000-8000-000000000509', 'Carlos Mendoza', 'carlos.m@example.test', '+64 22 000 509', 'Colombia', '1998-03-03', 'onshore NZ', 'enquiry', 'walk-in', null, '00000000-0000-4000-8000-000000000101', 'Hospitality, NZ', null, null, null, null, null, null, null, current_date - 2, current_date, null, current_date - 2),
  ('00000000-0000-4000-8000-000000000510', 'Ayesha Rahman', 'ayesha.r@example.test', '+880 1700 000510', 'Bangladesh', '2000-12-01', 'offshore', 'client', 'expo', null, '00000000-0000-4000-8000-000000000102', 'Nursing, AU', 'IELTS', '7.0', current_date + 1400, null, null, null, null, current_date - 5, null, null, current_date - 60),
  ('00000000-0000-4000-8000-000000000511', 'Kenji Sato', 'kenji.s@example.test', '+81 90 0000 0511', 'Japan', '1997-05-19', 'offshore', 'client', 'website', null, '00000000-0000-4000-8000-000000000101', 'Agriculture, NZ', 'IELTS', '6.0', current_date + 2100, null, null, null, null, current_date - 3, null, null, current_date - 40),
  ('00000000-0000-4000-8000-000000000512', 'Prakash Adhikari', 'prakash.a@example.test', '+61 400 000 512', 'Nepal', '1999-08-08', 'onshore AU', 'client', 'sub-agent', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000104', 'Leadership diploma, AU', 'PTE', '62', current_date + 1000, null, null, null, null, current_date - 20, null, null, current_date - 400),
  ('00000000-0000-4000-8000-000000000513', 'Siti Aminah', 'siti.a@example.test', '+64 27 000 513', 'Indonesia', '1998-10-10', 'onshore NZ', 'client', 'referral', null, '00000000-0000-4000-8000-000000000101', 'IT, NZ', 'IELTS', '6.5', current_date + 1300, null, null, null, null, current_date - 7, null, null, current_date - 380),
  ('00000000-0000-4000-8000-000000000514', 'Anjali Singh', 'anjali.s@example.test', '+91 98300 00514', 'India', '2000-01-25', 'offshore', 'client', 'facebook', null, '00000000-0000-4000-8000-000000000102', 'Data science masters, AU', 'IELTS', '7.0', current_date + 1700, null, null, null, null, current_date - 1, null, null, current_date - 150),
  ('00000000-0000-4000-8000-000000000515', 'Tenzin Dorje', 'tenzin.d@example.test', '+977 980 000 1515', 'Nepal', '2001-12-12', 'offshore', 'client', 'sub-agent', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000104', 'Cookery, AU', 'PTE', '52', current_date + 1600, null, null, null, null, current_date - 4, null, null, current_date - 80),
  ('00000000-0000-4000-8000-000000000516', 'Olivia Martins', 'olivia.m@example.test', null, 'Brazil', '1995-02-02', 'offshore', 'alumni', 'website', null, '00000000-0000-4000-8000-000000000101', 'English, NZ', null, null, null, null, null, null, null, current_date - 900, null, current_date - 30, current_date - 1400)
on conflict do nothing;

insert into applications (id, ref, student_id, course_id, staff_id, intake_on, stage, stage_on, submitted_on, offer_on, offer_expires_on, conditions, deposit_due_on, deposit_paid_on, tuition_first_year_cents, visa_needed, onshore_transfer, prior_provider, accepted_by_provider_on, coe_ref, enrolled_on, census_on) values
  ('00000000-0000-4000-8000-000000000601', 'HL-1001', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000101', current_date + 40, 'accepted', current_date - 12, current_date - 70, current_date - 40, current_date - 10, null, current_date - 15, current_date - 14, 2600000, true, false, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000602', 'HL-1002', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000102', current_date + 95, 'conditional_offer', current_date - 20, current_date - 45, current_date - 20, current_date + 10, 'IELTS 6.5 overall, no band below 6.0', null, null, 4800000, true, false, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000603', 'HL-1003', '00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000104', current_date + 60, 'visa_lodged', current_date - 9, current_date - 80, current_date - 60, null, null, current_date - 40, current_date - 38, 1400000, true, false, null, null, 'DEMO-COE-5503', null, null),
  ('00000000-0000-4000-8000-000000000604', 'HL-1004', '00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000310', '00000000-0000-4000-8000-000000000103', current_date - 35, 'enrolled', current_date - 30, current_date - 60, current_date - 50, null, null, current_date - 45, current_date - 44, 1600000, true, true, 'Bayside Training Academy', current_date - 48, 'DEMO-COE-5504', current_date - 30, current_date - 16),
  ('00000000-0000-4000-8000-000000000605', 'HL-1005', '00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000000101', current_date - 60, 'enrolled', current_date - 60, current_date - 110, current_date - 100, null, null, current_date - 90, current_date - 88, 980000, true, false, null, null, null, current_date - 60, current_date - 46),
  ('00000000-0000-4000-8000-000000000606', 'HL-1006', '00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000101', current_date + 140, 'draft', current_date - 8, null, null, null, null, null, null, 3000000, true, false, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000607', 'HL-1007', '00000000-0000-4000-8000-000000000506', '00000000-0000-4000-8000-000000000309', '00000000-0000-4000-8000-000000000101', current_date + 70, 'unconditional_offer', current_date - 15, current_date - 35, current_date - 15, current_date + 30, null, current_date - 3, null, 2300000, true, false, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000608', 'HL-1008', '00000000-0000-4000-8000-000000000510', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000102', current_date + 130, 'submitted', current_date - 30, current_date - 30, null, null, null, null, null, 4200000, true, false, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000609', 'HL-1009', '00000000-0000-4000-8000-000000000511', '00000000-0000-4000-8000-000000000308', '00000000-0000-4000-8000-000000000101', current_date + 120, 'submitted', current_date - 10, current_date - 10, null, null, null, null, null, 2400000, true, false, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000000610', 'HL-1010', '00000000-0000-4000-8000-000000000512', '00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000104', current_date - 200, 'enrolled', current_date - 200, current_date - 280, current_date - 260, null, null, current_date - 240, current_date - 239, 1500000, true, false, null, null, 'DEMO-COE-5510', current_date - 200, current_date - 186),
  ('00000000-0000-4000-8000-000000000611', 'HL-1011', '00000000-0000-4000-8000-000000000513', '00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000101', current_date - 230, 'enrolled', current_date - 230, current_date - 320, current_date - 300, null, null, current_date - 280, current_date - 279, 2600000, true, false, null, null, null, current_date - 230, current_date - 216),
  ('00000000-0000-4000-8000-000000000612', 'HL-1012', '00000000-0000-4000-8000-000000000514', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000102', current_date + 20, 'visa_granted', current_date - 6, current_date - 140, current_date - 110, null, null, current_date - 90, current_date - 88, 4800000, true, false, null, null, 'DEMO-COE-5512', null, null),
  ('00000000-0000-4000-8000-000000000613', 'HL-1013', '00000000-0000-4000-8000-000000000515', '00000000-0000-4000-8000-000000000310', '00000000-0000-4000-8000-000000000104', current_date + 30, 'visa_lodged', current_date - 18, current_date - 70, current_date - 55, null, null, current_date - 40, current_date - 39, 1600000, true, false, null, null, 'DEMO-COE-5513', null, null),
  ('00000000-0000-4000-8000-000000000614', 'HL-1014', '00000000-0000-4000-8000-000000000516', '00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000000101', current_date - 1300, 'completed', current_date - 1100, current_date - 1360, current_date - 1350, null, null, current_date - 1340, current_date - 1340, 980000, true, false, null, null, null, current_date - 1300, current_date - 1286)
on conflict do nothing;

insert into visas (id, student_id, application_id, country, kind, staff_id, adviser_location, status, lodged_on, decided_on, expires_on, reference) values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000603', 'AU', 'student', '00000000-0000-4000-8000-000000000104', 'offshore', 'lodged', current_date - 9, null, null, 'DEMO-TRN-701'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000604', 'AU', 'student', '00000000-0000-4000-8000-000000000103', 'onshore', 'granted', current_date - 45, current_date - 32, current_date + 400, 'DEMO-TRN-702'),
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000605', 'NZ', 'student', '00000000-0000-4000-8000-000000000101', 'offshore', 'granted', current_date - 85, current_date - 70, current_date + 45, 'DEMO-INZ-703'),
  ('00000000-0000-4000-8000-000000000704', '00000000-0000-4000-8000-000000000513', '00000000-0000-4000-8000-000000000611', 'NZ', 'student', '00000000-0000-4000-8000-000000000105', 'onshore', 'lodged', current_date - 12, null, null, 'DEMO-INZ-704'),
  ('00000000-0000-4000-8000-000000000705', '00000000-0000-4000-8000-000000000514', '00000000-0000-4000-8000-000000000612', 'AU', 'student', '00000000-0000-4000-8000-000000000102', 'onshore', 'granted', current_date - 40, current_date - 6, current_date + 760, 'DEMO-TRN-705'),
  ('00000000-0000-4000-8000-000000000706', '00000000-0000-4000-8000-000000000515', '00000000-0000-4000-8000-000000000613', 'AU', 'student', '00000000-0000-4000-8000-000000000104', 'offshore', 'lodged', current_date - 18, null, null, 'DEMO-TRN-706'),
  ('00000000-0000-4000-8000-000000000707', '00000000-0000-4000-8000-000000000512', '00000000-0000-4000-8000-000000000610', 'AU', 'student', '00000000-0000-4000-8000-000000000104', 'offshore', 'granted', current_date - 230, current_date - 210, current_date + 180, 'DEMO-TRN-707'),
  ('00000000-0000-4000-8000-000000000708', '00000000-0000-4000-8000-000000000513', '00000000-0000-4000-8000-000000000611', 'NZ', 'student', '00000000-0000-4000-8000-000000000101', 'offshore', 'granted', current_date - 270, current_date - 250, current_date + 20, 'DEMO-INZ-708')
on conflict do nothing;

insert into documents (id, student_id, application_id, kind, status, received_on, expires_on, retain_until, note) values
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', 'passport', 'verified', current_date - 110, current_date + 1500, null, null),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', 'financial_evidence', 'required', null, null, null, 'Bank statements for 3 months, funds for living costs'),
  ('00000000-0000-4000-8000-000000000803', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', 'insurance', 'required', null, null, null, null),
  ('00000000-0000-4000-8000-000000000804', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000602', 'english_test', 'rejected', current_date - 60, current_date + 600, null, 'Overall 6.0, offer needs 6.5. Resit booked.'),
  ('00000000-0000-4000-8000-000000000805', '00000000-0000-4000-8000-000000000510', '00000000-0000-4000-8000-000000000608', 'transcript', 'verified', current_date - 35, null, null, null),
  ('00000000-0000-4000-8000-000000000806', '00000000-0000-4000-8000-000000000510', '00000000-0000-4000-8000-000000000608', 'financial_evidence', 'required', null, null, null, null),
  ('00000000-0000-4000-8000-000000000807', '00000000-0000-4000-8000-000000000506', '00000000-0000-4000-8000-000000000607', 'guardian_consent', 'required', null, null, null, 'Parents to sign the school''s consent form'),
  ('00000000-0000-4000-8000-000000000808', '00000000-0000-4000-8000-000000000516', '00000000-0000-4000-8000-000000000614', 'passport', 'verified', current_date - 1360, current_date - 200, current_date - 30, 'Copy kept on file'),
  ('00000000-0000-4000-8000-000000000809', '00000000-0000-4000-8000-000000000514', '00000000-0000-4000-8000-000000000612', 'insurance', 'verified', current_date - 30, current_date + 760, null, null),
  ('00000000-0000-4000-8000-000000000810', '00000000-0000-4000-8000-000000000514', '00000000-0000-4000-8000-000000000612', 'visa_grant', 'verified', current_date - 6, current_date + 760, null, null)
on conflict do nothing;

insert into commissions (id, application_id, period, claimable_on, tuition_cents, pct, amount_cents, currency, status, invoice_no, invoiced_on, paid_on, paid_cents, sub_agent_share_cents, note) values
  -- Maria Santos moved from another college after the cutoff: this claim should be blocked.
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000604', 'Term 1', current_date - 9, 800000, 25, 200000, 'AUD', 'expected', null, null, null, null, 80000, null),
  ('00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000604', 'Term 2', current_date + 170, 800000, 25, 200000, 'AUD', 'expected', null, null, null, null, 80000, null),
  ('00000000-0000-4000-8000-000000000903', '00000000-0000-4000-8000-000000000605', 'Full course', current_date - 46, 980000, 20, 196000, 'NZD', 'expected', null, null, null, null, 0, null),
  ('00000000-0000-4000-8000-000000000904', '00000000-0000-4000-8000-000000000610', 'Term 1', current_date - 165, 750000, 20, 150000, 'AUD', 'paid', 'HL-INV-0301', current_date - 160, current_date - 128, 150000, 75000, null),
  ('00000000-0000-4000-8000-000000000905', '00000000-0000-4000-8000-000000000610', 'Term 2', current_date - 75, 750000, 20, 150000, 'AUD', 'invoiced', 'HL-INV-0342', current_date - 70, null, null, 75000, null),
  ('00000000-0000-4000-8000-000000000906', '00000000-0000-4000-8000-000000000611', 'First year', current_date - 186, 2600000, 12, 312000, 'NZD', 'paid', 'HL-INV-0298', current_date - 180, current_date - 150, 312000, 0, null),
  ('00000000-0000-4000-8000-000000000907', '00000000-0000-4000-8000-000000000603', 'Term 1', current_date + 81, 700000, 20, 140000, 'AUD', 'expected', null, null, null, null, 70000, null),
  ('00000000-0000-4000-8000-000000000908', '00000000-0000-4000-8000-000000000612', 'First year', current_date + 50, 4800000, 15, 720000, 'AUD', 'expected', null, null, null, null, 0, null),
  ('00000000-0000-4000-8000-000000000909', '00000000-0000-4000-8000-000000000613', 'Term 1', current_date + 51, 800000, 25, 200000, 'AUD', 'expected', null, null, null, null, 100000, null),
  ('00000000-0000-4000-8000-000000000910', '00000000-0000-4000-8000-000000000601', 'First year', current_date + 70, 2600000, 12, 312000, 'NZD', 'expected', null, null, null, null, 0, null)
on conflict do nothing;

insert into notes (id, student_id, application_id, staff_id, happened_on, kind, body) values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000101', current_date - 4, 'whatsapp', 'Aarav has the offer and paid the deposit. Waiting on his father''s bank statements before we lodge the visa.'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000102', current_date - 6, 'email', 'IELTS resit booked. Asked the university to extend the offer by four weeks. No reply yet.'),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000103', current_date - 5, 'call', 'Maria settled in well. Wants to add a barista short course next term.'),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000506', '00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000101', current_date - 2, 'meeting', 'Met Hoa''s parents on video. They want a homestay near the school. Deposit coming next week.'),
  ('00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000000507', null, '00000000-0000-4000-8000-000000000103', current_date - 12, 'call', 'Asked about nursing in Melbourne. Sent the course list. Said he would call back.'),
  ('00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-000000000516', '00000000-0000-4000-8000-000000000614', '00000000-0000-4000-8000-000000000101', current_date - 1340, 'note', 'Passport number FA123456 copied for the enrolment form.'),
  ('00000000-0000-4000-8000-000000001007', '00000000-0000-4000-8000-000000000512', '00000000-0000-4000-8000-000000000610', '00000000-0000-4000-8000-000000000104', current_date - 20, 'email', 'Chased Southbank for invoice HL-INV-0342. They said it is with their finance team.'),
  ('00000000-0000-4000-8000-000000001008', '00000000-0000-4000-8000-000000000509', null, '00000000-0000-4000-8000-000000000101', current_date - 2, 'walk-in', 'Walked into the Auckland office. On a working holiday visa, wants to study hospitality. Call back today.')
on conflict do nothing;

insert into tasks (id, student_id, application_id, staff_id, title, due_on, done_on) values
  ('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000102', 'Get the offer extension in writing', current_date - 1, null),
  ('00000000-0000-4000-8000-000000001102', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000101', 'Book Aarav''s insurance', current_date + 5, null),
  ('00000000-0000-4000-8000-000000001103', null, null, '00000000-0000-4000-8000-000000000105', 'Renew the Southbank agency agreement', current_date + 10, null)
on conflict do nothing;

-- Two years of history for the numbers: placed students, commission paid, and the enquiries
-- that never turned into anything. Generated, but fixed: the same rows every time.
insert into students (id, name, email, nationality, location, stage, source, sub_agent_id, staff_id, last_contact_on, created_on, lost_reason, date_of_birth)
select
  ('00000000-0000-4000-9000-' || lpad(n::text, 12, '0'))::uuid,
  (array['Arjun','Priyanka','Wei','Hana','Minh','Sabina','Rohan','Yuki','Kavya','Bilal','Linh','Nima','Ji-woo','Sanjay','Thu','Farhan','Ritika','Hao','Pooja','Dawa'])[(n % 20) + 1]
    || ' ' ||
  (array['Sharma','Wang','Tran','Gurung','Khan','Park','Nair','Pham','Rai','Iyer','Zhang','Lama','Das','Le','Bose','Tamang','Ali','Joshi','Liu','Shrestha'])[((n / 20) * 7 + n * 3) % 20 + 1],
  'past' || n || '@example.test',
  (array['India','China','Nepal','Vietnam','Philippines','Bangladesh','South Korea','Pakistan'])[(n % 8) + 1],
  'offshore',
  case when n <= 80 then 'alumni' else 'lost' end,
  (array['website','facebook','referral','expo','sub-agent','walk-in'])[(n % 6) + 1],
  case when n % 6 = 4 then case when n % 2 = 0 then '00000000-0000-4000-8000-000000000401'::uuid else '00000000-0000-4000-8000-000000000402'::uuid end end,
  (array['00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000104'])[(n % 4) + 1]::uuid,
  current_date - (40 + n * 3),
  current_date - (60 + n * 4),
  case when n > 80 then (array['chose another agent','visa refused elsewhere','could not show funds','stopped replying','deferred a year'])[(n % 5) + 1] end,
  make_date(1995 + n % 9, (n % 12) + 1, (n % 27) + 1)
from generate_series(1, 200) as n
on conflict do nothing;

-- Placed students: one application each. Every ninth withdrew and every eleventh was refused.
insert into applications (id, ref, student_id, course_id, staff_id, intake_on, stage, stage_on, submitted_on, offer_on, deposit_paid_on, tuition_first_year_cents, enrolled_on, census_on, closed_reason)
select
  ('00000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid,
  'HL-' || (100 + n),
  ('00000000-0000-4000-9000-' || lpad(n::text, 12, '0'))::uuid,
  c.id,
  (array['00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000104'])[(n % 4) + 1]::uuid,
  current_date - (60 + n * 8),
  case when n % 9 = 0 then 'withdrawn' when n % 11 = 0 then 'refused' when 60 + n * 8 > 365 then 'completed' else 'enrolled' end,
  current_date - (60 + n * 8),
  current_date - (140 + n * 8),
  case when n % 11 <> 0 then current_date - (120 + n * 8) end,
  case when n % 9 <> 0 and n % 11 <> 0 then current_date - (100 + n * 8) end,
  c.tuition_per_year_cents,
  case when n % 9 <> 0 and n % 11 <> 0 then current_date - (60 + n * 8) end,
  case when n % 9 <> 0 and n % 11 <> 0 then current_date - (46 + n * 8) end,
  case when n % 9 = 0 then 'student chose to defer' when n % 11 = 0 then 'visa refused' end
from generate_series(1, 80) as n
join courses c on c.id = (array[
  '00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000305',
  '00000000-0000-4000-8000-000000000307','00000000-0000-4000-8000-000000000310','00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000304','00000000-0000-4000-8000-000000000306','00000000-0000-4000-8000-000000000308'])[(n % 9) + 1]::uuid
on conflict do nothing;

-- Their commission: paid on time mostly; Eastern Institute of Hospitality pays late.
insert into commissions (id, application_id, period, claimable_on, tuition_cents, pct, amount_cents, currency, status, invoice_no, invoiced_on, paid_on, paid_cents, sub_agent_share_cents)
select
  ('00000000-0000-4000-b000-' || lpad(n::text, 12, '0'))::uuid,
  a.id,
  case when i.commission_basis = 'per_term' then 'Term 1' when i.commission_basis = 'full_course' then 'Full course' else 'First year' end,
  a.census_on + i.claim_after_days - 14,
  case when i.commission_basis = 'per_term' then a.tuition_first_year_cents / 2 else a.tuition_first_year_cents end,
  i.commission_pct,
  round((case when i.commission_basis = 'per_term' then a.tuition_first_year_cents / 2 else a.tuition_first_year_cents end) * i.commission_pct / 100),
  i.currency,
  case when n <= 3 then 'expected' when n <= 6 then 'invoiced' else 'paid' end,
  case when n > 3 then 'HL-INV-' || lpad((100 + n)::text, 4, '0') end,
  case when n > 3 then a.census_on + i.claim_after_days - 10 end,
  case when n > 6 then a.census_on + i.claim_after_days - 10 + i.pays_within_days - 10 + (n % 15) + case when i.name like 'Eastern%' then 45 else 0 end end,
  case when n > 6 then round((case when i.commission_basis = 'per_term' then a.tuition_first_year_cents / 2 else a.tuition_first_year_cents end) * i.commission_pct / 100) end,
  case when s.sub_agent_id is not null then round((case when i.commission_basis = 'per_term' then a.tuition_first_year_cents / 2 else a.tuition_first_year_cents end) * i.commission_pct / 100 * sa.share_pct / 100) else 0 end
from generate_series(1, 80) as n
join applications a on a.id = ('00000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid
join students s on s.id = a.student_id
left join sub_agents sa on sa.id = s.sub_agent_id
join courses c on c.id = a.course_id
join institutions i on i.id = c.institution_id
where a.stage in ('enrolled','completed')
on conflict do nothing;

-- Second terms for the per-term colleges.
insert into commissions (id, application_id, period, claimable_on, tuition_cents, pct, amount_cents, currency, status, invoice_no, invoiced_on, paid_on, paid_cents, sub_agent_share_cents)
select
  ('00000000-0000-4000-c000-' || lpad(n::text, 12, '0'))::uuid,
  cm.application_id, 'Term 2', cm.claimable_on + 182, cm.tuition_cents, cm.pct, cm.amount_cents, cm.currency,
  case when cm.claimable_on + 182 > current_date then 'expected' else cm.status end,
  case when cm.claimable_on + 182 <= current_date and cm.invoice_no is not null then cm.invoice_no || '-2' end,
  case when cm.claimable_on + 182 <= current_date then cm.invoiced_on + 182 end,
  case when cm.claimable_on + 182 <= current_date and cm.paid_on is not null then cm.paid_on + 182 end,
  case when cm.claimable_on + 182 <= current_date then cm.paid_cents end,
  cm.sub_agent_share_cents
from generate_series(1, 80) as n
join commissions cm on cm.id = ('00000000-0000-4000-b000-' || lpad(n::text, 12, '0'))::uuid
where cm.period = 'Term 1'
on conflict do nothing;

-- Sub-agent shares on paid claims older than 90 days have been paid out.
update commissions set sub_agent_paid_on = paid_on + 14
where sub_agent_share_cents > 0 and status = 'paid' and paid_on < current_date - 90 and sub_agent_paid_on is null;

commit;
