# MaskLM Testing Data

All names, emails, phone numbers, and organizations below are
**fictional**. Copy any block into MaskLM to test masking.

---

## 1. Medical referral letter (doctor → specialist)

```
Dear Dr. Thompson,

I am referring my patient, Sarah Mitchell, for further evaluation
of her chronic migraines. Sarah is a 34-year-old woman employed at
Greenfield Technologies who has been experiencing severe headaches
for the past six months. She can be reached at
sarah.mitchell@greenfield.io or 415-867-5309.

Her insurance is through Blue Horizon Health, policy number
BHH-2024-88432. Please contact my office at Northwest Medical
Group if you need any additional records.

Best regards,
Dr. James Whitfield
Northwest Medical Group
j.whitfield@nwmedical.org
503-555-0142
```

## 2. Legal case summary (attorney notes)

```
Case: Rodriguez v. Apex Construction LLC

Client Maria Rodriguez (DOB 03/15/1988) alleges wrongful
termination from Apex Construction LLC on January 12, 2026.
Ms. Rodriguez was employed as a project manager for 4 years.

Opposing counsel: David Chen, partner at Sterling & Associates.
Contact: d.chen@sterlinglaw.com, 212-555-0198.

Client contact: maria.r@gmail.com, 646-555-0173.
Emergency contact: her brother Carlos Rodriguez at 646-555-0174.

Key witness: Emily Park, former HR director at Apex Construction,
now at Meridian Staffing Solutions. Reached at emily.park@meridian.co.
```

## 3. Recruitment email (HR → hiring manager)

```
Hi Kevin,

Just wanted to flag three strong candidates for the Senior
Engineer role at CloudNova Systems:

1. Priya Sharma — currently at Amazon Web Services, 8 years
   experience. Email: priya.sharma@outlook.com, phone 650-555-0136.

2. Michael Okonkwo — staff engineer at Dataflow Inc., PhD from
   MIT. Email: m.okonkwo@dataflow.io, phone 408-555-0291.

3. Lisa Chen — tech lead at Stripe, strong systems background.
   Email: lisa.chen@protonmail.com, phone 415-555-0184.

All three have cleared the initial screen. Let me know who you'd
like to bring in for the on-site.

Thanks,
Rachel Kim
Talent Acquisition, CloudNova Systems
rachel.kim@cloudnova.com
```

## 4. Short simple test

```
John Smith works at Microsoft. His email is john.smith@microsoft.com
and his phone number is 555-123-4567.
```

## 5. Multiple mentions of same person

```
Alice Johnson submitted her report to Acme Corp on Monday.
Alice Johnson's manager at Acme Corp reviewed it the same day.
You can reach Alice Johnson at alice.j@acme.com or 310-555-0199.
Alice Johnson will present the findings at the Acme Corp all-hands.
```

## 6. No PII (should return unchanged)

```
The weather forecast for tomorrow shows partly cloudy skies with
a high of 72°F. There is a 30% chance of rain in the afternoon.
Winds will be light from the southwest at 5-10 mph.
```

## 7. Mixed languages (edge case — English PII in Chinese context)

```
我的律师 David Wang 建议我联系 Sunrise Legal Partners 处理这个案子。
他的邮箱是 david.wang@sunriselegal.com，电话是 415-555-0267。
请尽快回复，谢谢。
```

## 8. Dense PII (stress test)

```
Patient intake form:
Name: Robert Chen
Employer: Pacific Healthcare Group
Email: robert.chen@pacifichg.org
Phone: 628-555-0143
Emergency contact: Jennifer Chen, wife, 628-555-0144,
jennifer.chen@gmail.com
Referred by: Dr. Anna Kowalski at Bay Area Neurology Associates,
a.kowalski@bayaneurology.com, 415-555-0256
Insurance: United Health Partners, member ID UHP-99283746
```
