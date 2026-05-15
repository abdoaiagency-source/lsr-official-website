# LSR Conversion Engine Strategy

> **For Hermes:** Use `business-process-architect`, `systems-architect`, `ai-operations-architect`, `database-systems-designer`, `internal-tools-ux-designer`, and `writing-plans` before implementing this strategy.

**Goal:** Turn TikTok/website attention into qualified, trackable, commercially useful opportunities that move toward payment and internal processing.

**North Star:** Increase the number of leads that move from `needs_documents` or direct qualification into `ready_deposit`, then from `ready_deposit` into `submitted`.

**Core Funnel:**

```text
TikTok attention
→ Website qualification chat
→ Lead saved
→ Status assigned
→ Ayoub priority queue
→ ready_deposit
→ submitted
→ Hajras operations
→ in_process
→ completed
```

---

## 1. Strategic Principle

LSR should not build a generic CRM first.

LSR should build a **conversion engine**: a simple system that captures demand, filters bad leads, prioritizes high-value leads, and creates a clean handoff into operations.

The system should optimize for:

```text
more qualified people reaching ready_deposit and submitted
```

The most important business transitions are:

```text
needs_documents → ready_deposit
ready_deposit → submitted
submitted → completed
```

---

## 2. Approved Statuses

Use these exact statuses across the system:

```text
rejected
needs_documents
ready_deposit
submitted
in_process
completed
```

Arabic meanings:

```text
rejected = لا يمكن البدء حالياً
needs_documents = يحتاج أوراق أو توضيح
ready_deposit = جاهز للدفعة / مؤهل لتسليم الأوراق ودفع الدفعة الأولى
submitted = تم استلام الأوراق والدفعة
in_process = تحت الإجراء
completed = مكتمل
```

Client-facing rule:

- Do not say `مرفوض` harshly.
- Say `لا يمكن البدء حالياً`.
- Internally keep status as `rejected`.

---

## 3. TikTok Funnel Strategy

### Current reality

- TikTok has daily inbound demand.
- Many users ask about price and duration.
- No dedicated human responder means manual reply is not reliable.

### Strategy

Use TikTok as attention source, not as the operating system.

Flow:

```text
TikTok bio link / auto-reply
→ Website qualification chat
→ Database record
→ Status classification
→ Ayoub dashboard
```

### TikTok bio CTA draft

```text
للاستفسار عن الإقامة والإجراءات ومعرفة إمكانية البدء، افتح الرابط وأجب على الأسئلة السريعة.
```

### TikTok auto-reply draft

```text
أهلاً بك في الإقامة الآمنة. لمعرفة إمكانية البدء والسعر والمدة، فضلاً افتح الرابط وأجب على الأسئلة السريعة، وسيتم توجيهك حسب حالتك.
```

### Comment/DM reply draft

```text
أهلاً بك. حتى نقدر نحدد حالتك بدقة، افتح الرابط في البايو وأجب على الأسئلة السريعة. إذا كانت حالتك مناسبة سيتم توجيهك للخطوة التالية.
```

---

## 4. Website Qualification Chat Strategy

The website chat should behave like a smart receptionist, not an open-ended AI chatbot.

It should:

- ask short Arabic questions
- classify using deterministic rules
- avoid legal/price/timeline promises
- save every lead
- create a clear next action

### Required questions v1

```text
1. الاسم
2. رقم الهاتف / واتساب
3. المدينة
4. الجنسية
5. هل يوجد ختم دخول رسمي؟
6. هل دخلت ليبيا بطريقة رسمية؟
7. هل عندك إقامة أو كفيل سابق؟
8. إذا نعم: هل عندك إخلاء طرف؟
9. إذا لا: هل تستطيع جلب إخلاء طرف؟
10. هل الجواز موجود وصالح؟
11. هل الشهادة الصحية جاهزة؟
12. هل الصور جاهزة؟
13. هل توافق على الحضور لتسليم الأوراق ودفع الدفعة الأولى إذا كانت حالتك مناسبة؟
14. هل تريد من الإقامة الآمنة مساعدتك في تعبئة منصة وافد؟
```

### Chat behavior rules

- If answer is fatal blocker → `rejected`.
- If missing non-fatal papers → `needs_documents`.
- If core papers ready and user agrees to come → `ready_deposit`.
- If user submits/pays in office → staff changes to `submitted`.
- Do not let AI make exceptions beyond approved rules.

---

## 5. Classification Logic

### Rejected

Classify as `rejected` if:

```text
no official entry stamp
entered Libya unofficially
previous sponsor/residency exists and no sponsor clearance
client says they cannot obtain sponsor clearance
passport problem blocks procedure now
```

Message:

```text
حسب المعلومات المقدمة، حالتك لا يمكن البدء فيها حالياً لأن الإجراء يحتاج ختم دخول رسمي أو إخلاء طرف من الكفيل السابق عند وجود إقامة/كفيل سابق.
في حال تغير وضعك أو تحصلت على المستند المطلوب، يمكنك التواصل معنا من جديد.
```

### Needs documents

Classify as `needs_documents` if:

```text
entry stamp exists but health certificate missing
passport and stamp exist but photos missing
sponsor clearance exists but not delivered yet
sponsor clearance missing but client can obtain it
entry stamp unclear
previous sponsor status unclear
passport validity needs confirmation
```

Message:

```text
حالتك يمكن مراجعتها، لكن الملف ناقص حالياً.
المطلوب منك تجهيز الأوراق التالية:
[قائمة الأوراق الناقصة]
بعد تجهيزها يمكنك التواصل معنا أو الحضور لتسليم الأوراق ومتابعة الإجراء.
```

### Ready deposit

Classify as `ready_deposit` only if:

```text
official entry stamp exists
passport exists and appears valid
if previous sponsor/residency exists, sponsor clearance exists
required basic documents are ready
client understands next step
client agrees to come / says they will visit
no fatal blocker exists
no first deposit has been paid yet
```

Message:

```text
تمام، حسب المعلومات التي قدمتها حالتك مناسبة مبدئياً للبدء.
الخطوة التالية هي الحضور لتسليم الجواز والأوراق المطلوبة ودفع الدفعة الأولى حتى يتم فتح الملف ومتابعة الإجراء.
```

### Submitted

Staff changes to `submitted` only after:

```text
client physically/officially submits documents
first deposit is received
documents are attached or checked internally
handoff to Hajras is ready
```

---

## 6. Ayoub Priority Queue

Ayoub should not see a flat CRM list. He should see priorities.

### Priority 1: ready_deposit

Meaning:

```text
commercially closest to payment/submission
```

Ayoub action:

```text
contact immediately
confirm visit time
confirm required documents
confirm payment step
```

Dashboard label:

```text
جاهز للدفعة
```

### Priority 2: needs_documents

Meaning:

```text
possible client but incomplete
```

Ayoub/system action:

```text
send missing document checklist
follow up after defined delay
move to ready_deposit when documents become ready
```

Dashboard label:

```text
يحتاج أوراق
```

### Priority 3: rejected

Meaning:

```text
do not spend sales time unless special exception
```

Dashboard label:

```text
لا يمكن البدء حالياً
```

---

## 7. Hajras Handoff Strategy

Handoff point:

```text
submitted
```

Meaning:

```text
papers received + first deposit paid
```

Hajras should receive a clean file with:

```text
client details
service type
submitted documents
missing/uncertain items if any
payment note
Waafed help needed: yes/no
client-safe summary
internal notes
next action
```

Hajras statuses inside operations:

```text
in_process
completed
```

Detailed Waafed/internal tracking can use secondary fields:

```text
waafed_not_started
waafed_entry_in_progress
waafed_submitted
waiting_waafed_code
code_issued
needs_correction
```

Do not overload the main commercial status list with every Waafed sub-state.

---

## 8. Needs Documents Nurture Strategy

`needs_documents` is not dead. It is a nurture pool.

For each missing document, the system should store:

```text
missing_document_type
message_template_key
follow_up_delay_days
next_action_owner
last_follow_up_at
```

Suggested follow-ups:

```text
missing_health_certificate → follow up after 2 days
missing_photos → follow up after 1 day
missing_sponsor_clearance_but_obtainable → follow up after 3 days
passport_validity_needs_confirmation → follow up after 2 days
unclear_entry_stamp → ask for photo/confirmation immediately
```

The goal is to move qualified-but-incomplete leads into:

```text
ready_deposit
```

---

## 9. Message Template Strategy

Before AI sends anything, templates must exist.

Required templates:

```text
welcome_from_tiktok
price_duration_general
rejected_soft
needs_documents_general
missing_health_certificate
missing_photos
missing_sponsor_clearance_obtainable
ready_deposit_next_step
ready_deposit_follow_up_1
ready_deposit_follow_up_2
submitted_confirmation
in_process_update
completed_message
```

Template rules:

- Arabic-first.
- Short and polite.
- No hard legal promises.
- No invented price.
- No invented completion time.
- For rejected, use `لا يمكن البدء حالياً`, not `مرفوض`.

---

## 10. Metrics and Dashboard Strategy

Daily metrics:

```text
new_leads
rejected_count
needs_documents_count
ready_deposit_count
submitted_count
in_process_count
completed_count
```

Conversion metrics:

```text
TikTok clicks → chat starts
chat starts → chat completions
chat completions → ready_deposit
needs_documents → ready_deposit
ready_deposit → submitted
submitted → completed
```

Most important commercial metric:

```text
ready_deposit → submitted
```

If this is low, the issue is likely:

- Ayoub follow-up speed
- unclear visit/payment instructions
- price objection
- wrong qualification
- weak reminder sequence

Second important metric:

```text
needs_documents → ready_deposit
```

If this is low, the issue is likely:

- missing-document instructions unclear
- no follow-up reminders
- documents too difficult to obtain
- users are not serious

---

## 11. AI Strategy

AI should support the conversion engine, not replace it.

### AI v1: Chat classifier

Can:

```text
ask guided questions
classify using fixed rules
save structured record
generate client-safe response from templates
```

Cannot:

```text
invent price
invent timeline
override rejection rules
mark submitted
verify documents
```

### AI v2: Ayoub assistant

Can:

```text
summarize lead
explain why status was assigned
draft WhatsApp follow-up
generate missing document checklist
suggest next action
```

### AI v3: Operations assistant

Can:

```text
summarize submitted file for Hajras
flag stale in_process files
draft status update
generate daily report
```

### AI audit rule

Every AI-generated output should store:

```text
record_id
prompt/template version
source fields used
output text
approved_by
sent_at if external
```

---

## 12. Data Model Additions for Conversion Engine

Add or ensure these fields exist on leads:

```text
status
source_channel
source_campaign
entry_stamp_status
official_entry_status
previous_sponsor_status
sponsor_clearance_status
passport_status
health_certificate_status
photos_status
agrees_to_visit
wants_waafed_help
missing_documents
rejection_reason
next_action_type
next_action_owner
next_action_due_date
last_follow_up_at
converted_at
submitted_at
```

Important timestamp fields:

```text
first_seen_at
chat_started_at
chat_completed_at
status_assigned_at
ready_deposit_at
submitted_at
completed_at
```

These timestamps allow conversion analytics later.

---

## 13. MVP Screens

### 1. Conversion Dashboard

Cards:

```text
New today
Needs documents
Ready deposit
Submitted today
In process
Completed
```

### 2. Ayoub Queue

Sections:

```text
جاهز للدفعة
يحتاج أوراق
لا يمكن البدء حالياً
```

Each lead card shows:

```text
name
phone
status
missing documents
reason
next action
created time
last follow-up
```

### 3. Lead Detail

Shows:

```text
answers
classification
reason
missing documents
recommended message
activity log
convert/update status buttons
```

### 4. Hajras Submitted Queue

Shows:

```text
submitted files
payment received
documents received
Waafed help needed
next operation step
```

---

## 14. First Implementation Slice

Build the smallest version that proves the engine:

```text
Website qualification chat
Lead database
Rule-based status assignment
Ayoub queue
Basic message templates
Manual status update to submitted
Basic metrics cards
```

Do not build yet:

```text
full client portal
complex AI agent
automatic WhatsApp sending
payments system
full Waafed integration
advanced analytics
```

---

## 15. Definition of Done

The conversion engine MVP is done when:

- [ ] TikTok bio/auto-reply points to website chat.
- [ ] Website chat collects required answers.
- [ ] Every completed chat creates a lead record.
- [ ] Lead is assigned exactly one approved status.
- [ ] Rejected users receive soft wording.
- [ ] Needs-documents users receive a missing-document checklist.
- [ ] Ready-deposit users receive clear visit/payment next step.
- [ ] Ayoub can see ready_deposit first.
- [ ] Ayoub can update status after contact.
- [ ] Staff can mark a lead as submitted only after documents + first deposit.
- [ ] Hajras can see submitted cases.
- [ ] Daily counts show rejected / needs_documents / ready_deposit / submitted / in_process / completed.
- [ ] No AI-generated price, timeline, or eligibility promise is sent without approved template/human review.

---

## 16. Strategic Summary

The next strategic system is not just tracking.

It is a conversion engine:

```text
attention → qualification → ready_deposit → submitted → in_process → completed
```

The business win is:

```text
less wasted TikTok demand
less Ayoub time wasted on bad leads
more ready_deposit leads contacted quickly
more submitted paid files handed to Hajras cleanly
```
