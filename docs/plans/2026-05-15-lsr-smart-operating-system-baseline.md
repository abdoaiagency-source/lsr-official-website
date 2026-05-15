# LSR Smart Operating System Baseline Blueprint

> **For Hermes:** Use `business-process-architect`, `systems-architect`, `database-systems-designer`, `internal-tools-ux-designer`, `document-operations-specialist`, `ai-operations-architect`, and `writing-plans` before implementation.

**Goal:** Design the baseline operating system that converts TikTok/WhatsApp interest into qualified records, simple staff workflows, and AI-agent-readable operational data.

**Architecture:** Start with a structured intake + qualification engine connected to a source-of-truth database. Human staff see simple Arabic/RTL screens; AI agents read controlled statuses, next actions, documents, and client-safe summaries.

**Current business context captured:** Daily inbound volume is ~100 messages, TikTok DMs currently have no human responder, most questions are about price and completion time, and initial success means TikTok inquiries move into a website qualification chat that saves records and classifies them.

---

## 1. Operating Reality

### Current channels

- TikTok inbox: ~100 daily messages.
- TikTok has no dedicated responder currently.
- Bio link and auto-reply will send users to the website chat.
- Website becomes the qualification gateway.
- Current operational tracking includes Google Sheets.
- Waafed platform is external and independent from LSR.

### Most common questions

- Price / cost.
- Completion time / duration.

### Immediate rejection cases

Reject immediately if:

- No entry stamp.
- No clearance/release from previous sponsor/kafeel.

Arabic labels:

- لا يوجد ختم دخول
- لا يوجد إخلاء طرف من الكفيل السابق

### Current human roles

#### Ayoub

Owns the beginning of the journey with the client:

- Client contacts Ayoub.
- Ayoub explains required documents.
- Client comes in person with passport/documents.
- Client pays initial payment.
- At that point Ayoub’s phase ends or he hands over internally.

#### Hajras

Internal organizational/operations role:

- Enters client data into the system.
- Tracks and updates the file.
- Currently uses Google Sheets.
- Enters data manually into Waafed.
- Waits for code issuance from Waafed / Ministry of Labor.

### Waafed platform

- Waafed is independent from LSR.
- It is the first procedural platform where the process starts.
- Data is currently entered manually.
- Some clients may fill Waafed themselves before visiting LSR.
- Some clients cannot do it and ask LSR to fill it.
- Client uploads documents and registers in Waafed, then waits for code.

---

## 2. Minimum Successful Outcome

The project is successful at the first level if:

```text
TikTok inbox questions → website qualification chat → saved database record → classified status
```

Classification outcomes must use these exact operating statuses:

```text
rejected
needs_documents
ready_deposit
submitted
in_process
completed
```

Arabic labels:

```text
مرفوض = لا يمكن البدء حالياً
يحتاج أوراق = مناسب مبدئياً لكن ناقص أوراق أو توضيح
جاهز للدفعة = مؤهل مبدئياً وجاهز للحضور
تم التسليم = يتحول لهجرس / معالجة داخلية
تحت الإجراء = هجرس يتابع داخلياً
مكتمل = تمت الخدمة
```

Important client-facing language rule: do not say `مرفوض` bluntly to the client. The system records `rejected`, but the client hears `لا يمكن البدء حالياً`. This keeps communication polite while preserving operational clarity.

This is more important than building a full client portal first.

---

## 3. Baseline Operating Principle

Every inbound lead must become a structured record with:

```text
source_channel
client_identity
contact_method
case_type
key answers
rejection flags
qualification_status
next_action
assigned_owner
created_at
```

Every operational file must answer:

```text
What is the status?
What is missing?
Who owns the next action?
When is it due?
What can safely be said to the client?
```

---

## 4. Intake + Qualification Flow

### Entry point

TikTok bio link and auto-reply send user to website chat.

Example auto-reply:

```text
أهلاً بك في الإقامة الآمنة. لمعرفة إمكانية التقديم والسعر والمدة، فضلاً افتح الرابط وأجب على الأسئلة السريعة وسيتم تصنيف حالتك مباشرة.
```

### Chat qualification goals

The chat should not behave like an open chatbot at first. It should be a guided form/chat hybrid.

It must collect enough data to classify the case without overwhelming the user.

### Required intake questions v1

1. Name.
2. Phone / WhatsApp.
3. City.
4. Nationality.
5. Are you inside Libya? نعم / لا.
6. Do you have an entry stamp? نعم / لا / غير متأكد.
7. Do you have clearance/release from previous sponsor? نعم / لا / لا ينطبق / غير متأكد.
8. What service do you need?
   - new procedure / registration
   - residency
   - renewal
   - worker/labor service
   - not sure
9. Do you have passport/documents ready? نعم / لا / جزئياً.
10. Preferred contact method.
11. Optional: ask if they want LSR to fill Waafed for them.

### Immediate classification rules

#### 1. Rejected / مرفوض internally

Meaning: do not continue with the client, do not ask them to come pay, and do not waste Ayoub’s time.

Classify as `rejected` when:

```text
no official entry stamp
entered Libya unofficially
has previous residency/sponsor and no sponsor clearance
says they cannot obtain sponsor clearance
passport is invalid in a way that blocks the procedure now, unless Ayoub decides it requires review
```

Structured reasons:

```text
missing_entry_stamp
unofficial_entry
missing_sponsor_clearance
cannot_obtain_sponsor_clearance
invalid_passport_blocking
```

Client-safe message template:

```text
حسب المعلومات المقدمة، حالتك لا يمكن البدء فيها حالياً لأن الإجراء يحتاج ختم دخول رسمي أو إخلاء طرف من الكفيل السابق عند وجود إقامة/كفيل سابق.
في حال تغير وضعك أو تحصلت على المستند المطلوب، يمكنك التواصل معنا من جديد.
```

Communication rule: never write `مرفوض` harshly to the client. Say `لا يمكن البدء حالياً`. Internally, the status remains `rejected`.

#### 2. Needs documents / يحتاج أوراق

Meaning: the client may be suitable, but the file is not ready. Do not treat this as commercially ready.

Classify as `needs_documents` when:

```text
has entry stamp but missing health certificate
has passport and stamp but missing photos
has sponsor clearance but has not sent/brought it
unclear whether they have entry stamp
unclear whether they have previous residency/sponsor
has passport but validity must be renewed or confirmed
```

Current required documents mentioned:

```text
passport
entry stamp or visa proof
health certificate
photos
sponsor clearance when needed
```

Client-safe message template:

```text
حالتك يمكن مراجعتها، لكن الملف ناقص حالياً.
المطلوب منك تجهيز الأوراق التالية:
[قائمة الأوراق الناقصة]
بعد تجهيزها يمكنك التواصل معنا أو الحضور لتسليم الأوراق ومتابعة الإجراء.
```

Important rule:

```text
If sponsor clearance is missing but the client says they can obtain it → needs_documents.
If sponsor clearance is missing and the client says they cannot obtain it → rejected.
```

#### 3. Waiting documents and deposit / جاهز للدفعة

Meaning: this is the key commercial state. The client is preliminarily qualified, understands what is needed, documents appear ready, but they have not delivered documents and have not paid the first deposit yet.

Classify as `ready_deposit` only when all are true:

```text
has official entry stamp or acceptable entry situation
passport exists and appears valid
if previous sponsor/residency exists, sponsor clearance exists
understands required documents
agrees to come / says they will visit
has not delivered documents yet
has not paid the first deposit yet
```

Client-safe message template:

```text
تمام، حسب المعلومات التي قدمتها حالتك مناسبة مبدئياً للبدء.
الخطوة التالية هي الحضور لتسليم الجواز والأوراق المطلوبة ودفع الدفعة الأولى حتى يتم فتح الملف ومتابعة الإجراء.
```

Golden rule: never put a client in `ready_deposit` if they are missing a fatal document. This state means the lead is commercially close to becoming money. Missing or unclear cases stay in `needs_documents`; no stamp or no obtainable sponsor clearance becomes `rejected`.

#### Fast chatbot decision logic

```text
1. هل يوجد ختم دخول رسمي؟
   - لا → rejected
   - نعم → اسأل عن الجواز والإقامة السابقة

2. هل لديه إقامة/كفيل سابق؟
   - نعم → هل عنده إخلاء طرف؟
      - لا، ولا يستطيع جلبه → rejected
      - لا، لكنه يستطيع جلبه → needs_documents
      - نعم → كمل
   - لا → كمل

3. هل الأوراق الأساسية جاهزة؟
   - لا → needs_documents
   - نعم → ready_deposit

4. بعد تسليم الأوراق ودفع الدفعة الأولى:
   - submitted

5. بعد دخول هجرس ومتابعة الإجراء:
   - in_process

6. بعد انتهاء الخدمة:
   - completed
```

---

## 5. Human Workflow Baseline

### Stage 1: Digital intake

Owner: system/chat + intake queue.

Outcome:

- record created
- classification assigned
- source TikTok captured
- next action created

### Stage 2: Ayoub qualification

Owner: Ayoub.

Ayoub handles:

- follow-up call/message
- explanation of required documents
- price/duration explanation using approved template
- confirms if client should visit office
- confirms initial payment step

Completion criteria:

```text
client visited or confirmed next step
initial payment received if applicable
documents/passport received or scheduled
handoff_needed = true/false
```

### Stage 3: Handoff to Hajras

Owner: Ayoub → Hajras.

Handoff requires:

- client record complete
- document checklist status
- payment note
- required Waafed action
- client-safe summary
- internal notes

### Stage 4: Hajras operations

Owner: Hajras.

Hajras handles:

- data entry into internal system
- Google Sheet transition if still used
- Waafed data entry
- document upload/verification follow-up
- waits for Waafed / Ministry code
- updates status

### Stage 5: Code issued / follow-up

Owner: Hajras.

Status updates:

```text
waafed_submitted
waiting_waafed_code
code_issued
needs_correction
completed
```

---

## 6. Core Status Model

### Final operating statuses

Use these exact statuses in the system:

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
rejected / مرفوض = لا يمكن البدء حالياً
needs_documents / يحتاج أوراق = ممكن يكون مناسب لكن ناقص أوراق أو توضيح
ready_deposit / جاهز للدفعة = مؤهل مبدئياً وجاهز لتسليم الأوراق ودفع الدفعة الأولى
submitted / تم التسليم = تم استلام الأوراق والدفعة ويتحول لهجرس
in_process / تحت الإجراء = هجرس يتابع داخلياً
completed / مكتمل = تمت الخدمة
```

### Rejection reasons

```text
missing_entry_stamp
unofficial_entry
missing_sponsor_clearance
cannot_obtain_sponsor_clearance
invalid_passport_blocking
outside_service_scope
duplicate_or_invalid_contact
```

### Needs-document reasons

```text
missing_health_certificate
missing_photos
missing_sponsor_clearance_but_obtainable
unclear_entry_stamp
unclear_previous_sponsor
passport_validity_needs_confirmation
partial_documents
```

### Internal process/Waafed tracking statuses

When a case reaches Hajras, track Waafed/internal progress separately from the commercial qualification status:

```text
ready_for_waafed_entry
waafed_entry_in_progress
waafed_submitted
waiting_waafed_code
code_issued
needs_correction
completed
```

---

## 7. Suggested MVP Data Model

### leads

```text
id
public_id
source_channel
source_detail
name
phone
city
nationality
inside_libya
has_entry_stamp
has_sponsor_clearance
service_type
has_documents_ready
wants_lsr_waafed_help
qualification_status
rejection_reason
human_review_reason
price_question_asked
duration_question_asked
client_safe_summary
internal_notes
assigned_owner_id
next_action_type
next_action_due_date
created_at
updated_at
```

### clients

Created when lead becomes real client.

```text
id
public_id
name
phone
city
nationality
source_lead_id
status
client_safe_summary
internal_notes
created_at
updated_at
```

### requests

```text
id
public_id
client_id
lead_id
service_type
status
priority
assigned_owner_id
next_action_type
next_action_due_date
waafed_status
waafed_code
initial_payment_status
client_safe_summary
internal_notes
created_at
updated_at
```

### documents

```text
id
public_id
entity_type
entity_id
document_type
required
status
file_path
expiry_date
verified_by
verified_at
needs_correction_reason
visibility
created_at
updated_at
```

### tasks

```text
id
public_id
related_entity_type
related_entity_id
task_type
title
assigned_owner_id
priority
due_date
status
created_at
updated_at
```

### activity_logs

```text
id
entity_type
entity_id
actor_type
actor_id
action
summary
visibility
metadata_json
created_at
```

### message_templates

```text
id
template_key
language
channel
purpose
body
requires_human_approval
created_at
updated_at
```

---

## 8. First UI Screens

### Intake dashboard

For Ayoub:

- New TikTok/website leads.
- Rejected cases.
- Needs documents.
- Ready to apply.
- Needs human review.
- Button: call/contact client.
- Button: send approved price/duration response.

### Lead detail page

Shows:

- user answers
- classification result
- rejection/human review reason
- contact details
- recommended next action
- client-safe message draft
- internal note
- convert to client/request button

### Operations dashboard

For Hajras:

- ready for Waafed entry
- Waafed entry in progress
- waiting Waafed code
- needs correction
- completed

### Request/file page

Shows:

- client
- service type
- status
- Waafed status
- documents
- tasks
- activity log
- next action

---

## 9. AI Agent Boundaries

### AI can do first

- classify intake answers using rules
- draft client-safe response
- summarize lead/request
- generate missing document checklist
- suggest next action
- flag human review cases

### AI must not do first

- send WhatsApp externally without approval
- decide legal eligibility beyond simple rejection rules
- mark documents as verified without human review
- expose internal notes to clients
- change Waafed status without staff confirmation

### Human approval required for

- price messages unless using fixed approved template
- duration promises
- rejection messages
- document verification
- external communication
- status changes after Waafed submission

---

## 10. Price and Duration Handling

Because most users ask about price and duration, the system needs approved response templates.

Do not let AI invent prices or timelines.

Recommended v1 approach:

- Use general answer until staff confirms case type.
- Store `price_template_key` and `duration_template_key`.
- Use fixed message templates approved by LSR.
- If case is uncertain, keep it in `needs_documents` with a structured `needs_clarification` or specific missing-document reason. Do not create a separate public/customer status for human review in v1.

Example safe structure:

```text
السعر والمدة يعتمدون على نوع الإجراء وحالة الأوراق. جاوب على الأسئلة السريعة وسنحدد لك المسار المناسب، وإذا كانت حالتك جاهزة سيتم التواصل معك بالتفاصيل.
```

---

## 11. Implementation Roadmap

### Phase 1: Qualification Chat MVP

Build:

- website chat/form flow
- lead database
- rule-based classification
- exact statuses: rejected / needs_documents / ready_deposit / submitted / in_process / completed
- Ayoub intake dashboard
- message templates

Success metric:

```text
TikTok inquiries are captured and classified automatically.
```

### Phase 2: Ayoub → Hajras Handoff

Build:

- convert lead to client/request
- handoff checklist
- initial payment status
- document status
- internal notes/client-safe summary separation

Success metric:

```text
No qualified lead gets lost after Ayoub’s stage.
```

### Phase 3: Waafed Operations Tracker

Build:

- Waafed status field
- manual data-entry task
- waiting code status
- correction flow
- Hajras dashboard

Success metric:

```text
Hajras can track every Waafed case and code status from one screen.
```

### Phase 4: AI Assistant Layer

Build:

- AI summaries
- draft responses
- missing document checklist generation
- uncertainty detection that keeps cases in `needs_documents` until Ayoub clarifies them
- source-backed AI output

Success metric:

```text
AI reduces response and follow-up workload without sending unsafe messages.
```

### Phase 5: Client Portal / Uploads

Build later:

- client document upload
- status visibility
- missing documents
- client-safe updates

Success metric:

```text
Clients can self-serve basic status and document upload.
```

---

## 12. Immediate Decisions Needed

1. What are the exact service types LSR wants in the intake chat?
2. Does every case require sponsor clearance, or only some categories?
3. What are the approved price/duration messages?
4. Should rejected users still be saved as leads?
5. Which unclear cases should Ayoub decide manually while still stored as `needs_documents`?
6. Should Waafed form filling be a separate paid service?
7. What fields are mandatory before converting lead to client?

---

## 13. Definition of Done for Baseline MVP

- [ ] TikTok bio/auto-reply points to website chat.
- [ ] Chat collects required qualification answers.
- [ ] Lead record is saved.
- [ ] Lead is classified using the exact approved statuses: rejected / needs_documents / ready_deposit / submitted / in_process / completed.
- [ ] Ayoub can see daily leads and next action.
- [ ] Qualified leads can convert to client/request.
- [ ] Handoff to Hajras is structured.
- [ ] Hajras can track Waafed entry and code status.
- [ ] Internal notes and client-safe summaries are separate.
- [ ] AI can read structured data without guessing from free text.
