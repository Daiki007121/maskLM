# MaskLM — Product Requirements Document

## Project
**MaskLM**
Privacy-first LLM middleware for document anonymization

## User Personas

### The Recruiter
An independent recruiter or HR professional who screens resumes daily and cannot send candidate PII to external APIs due to data privacy obligations.

### The Corporate Lawyer
A transactional attorney who reviews NDAs and contracts but cannot expose client names or deal values to third-party APIs.

### The Clinical Physician
A hospital doctor who summarizes patient records but is bound by HIPAA.

### The Compliance Officer
Audits internal documents under strict data governance policies.

### The Legal Operations Manager
Oversees AI tooling at scale and needs auditable, privacy-compliant workflows.

## User Stories

- As a recruiter, I want MaskLM to mask candidate PII in resumes before AI screening.
- As a recruiter, I want original candidate details re-injected into AI output.
- As a corporate lawyer, I want sensitive entities masked before contract summarization.
- As a clinical physician, I want patient info replaced with placeholders before LLM processing.
- As a compliance officer, I want to review anonymized docs before LLM submission.
- As a corporate lawyer, I want original values re-injected into the final summary.
- As a legal operations manager, I want to configure which entity types are masked per document category.
- As a clinical physician, I want MaskLM to support structured medical documents.
