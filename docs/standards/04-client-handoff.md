# Client Handoff Document
<!--
  INSTRUCTIONS FOR USE
  ────────────────────
  Fill this document at the end of the project, before final payment is released.
  It serves two purposes:
  1. A deployment and go-live checklist for the agency.
  2. A reference document the client keeps after the project ends.

  The client should be able to use sections 3–6 without agency involvement.

  Store a copy at: docs/handoff.md in the project repository.
  Deliver a PDF version to the client at handoff.
-->

---

## 1. Project Summary

| Field | Value |
|---|---|
| **Project** | |
| **Client** | |
| **Agency** | |
| **Production URL** | |
| **Handoff date** | <!-- YYYY-MM-DD --> |
| **Support period ends** | <!-- YYYY-MM-DD — per contract --> |
| **Technical spec** | `docs/technical-spec.md` |
| **Charter** | `docs/charter.md` |

---

## 2. Pre-Launch Checklist

<!--
  Complete this section before handing over to the client.
  Every item must be checked before the final invoice is sent.
-->

### 2.1 Security

- [ ] All secrets rotated from development values to production values
- [ ] No API keys, passwords, or secrets committed to the repository
- [ ] `.env.example` is up to date with all required variables documented
- [ ] HTTPS enforced on all routes (no HTTP fallback)
- [ ] Authentication is enabled and tested in production
- [ ] Rate limiting is in place on public-facing endpoints (if any)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] `npm audit` run — all high/critical vulnerabilities addressed or documented

### 2.2 Functionality

- [ ] All deliverables from the charter (Section 5) tested in production
- [ ] Client acceptance testing (UAT) completed and signed off
- [ ] Edge cases documented and tested (see Section 7)
- [ ] Error states surface user-friendly messages, not stack traces
- [ ] Background tasks verified running in production (check scheduler dashboard)

### 2.3 Data

- [ ] All database migrations applied to production
- [ ] Seed data or initial data populated if required
- [ ] Data backup strategy confirmed and tested
- [ ] GDPR / data residency requirements met (if applicable)

### 2.4 Monitoring

- [ ] Error monitoring active (Sentry or equivalent) and receiving events
- [ ] Uptime monitoring configured and alerting the agency (during support period)
- [ ] Log retention configured appropriately
- [ ] At least one test error triggered to verify Sentry capture

### 2.5 Documentation

- [ ] This handoff document completed
- [ ] `README.md` in the repository is accurate and complete
- [ ] All ADRs up to date
- [ ] Technical spec reflects the final implementation
- [ ] Admin credentials transferred to client (see Section 4)

### 2.6 Access Transfer

- [ ] Client has admin access to the hosting platform
- [ ] Client has access to the domain registrar
- [ ] Client has access to the database (read-only at minimum)
- [ ] Client has access to error monitoring
- [ ] Agency access removed or downgraded per contract terms

---

## 3. System Overview (for the client)

<!--
  Write this section for a non-technical client.
  Explain what the system does and how it fits into their operations.
-->

### What the system does


### Who uses it and how


### What runs automatically vs. what requires manual action

| Action | Automatic / Manual | Frequency | Who is responsible |
|---|---|---|---|
| | | | |
| | | | |

---

## 4. Credentials & Access

<!--
  List every credential, API key, and account the client needs to operate the system.
  Do NOT include the actual values here — deliver those separately via a password manager
  or secure channel. This section is the inventory.
-->

> ⚠️ **Security note:** Share actual credentials via a password manager (1Password, Bitwarden) or encrypted channel. Never via email or chat in plaintext.

| System | Account type | Who holds it | Where to find it |
|---|---|---|---|
| Hosting platform (e.g., Vercel) | Admin | | |
| Database (e.g., Supabase) | Admin | | |
| AI API (e.g., Anthropic) | Owner | | |
| Domain registrar | Admin | | |
| Error monitoring (e.g., Sentry) | Admin | | |
| Background tasks (e.g., Trigger.dev) | Admin | | |
| Email service | Admin | | |

### 4.1 Environment Variables in Production

All environment variables are stored in the hosting platform's environment settings. The full list of required variables is documented in `.env.example` in the repository.

**Never** add or change environment variables through direct database access or shell commands — always use the hosting platform's UI to ensure variables are encrypted at rest and versioned.

---

## 5. Runbook — Common Operations

<!--
  Step-by-step instructions for tasks the client or a future developer
  will need to perform without agency involvement.
-->

### 5.1 How to restart the application

<!--
  e.g., "In the Vercel dashboard, navigate to Deployments and click Redeploy
  on the most recent deployment."
-->

### 5.2 How to run a database migration after a code update

<!--
  e.g., "After deploying new code that includes migration files,
  run: npm run db:migrate in the Vercel deployment pipeline,
  or manually via the Supabase SQL editor using the migration file in /drizzle/"
-->

### 5.3 How to add a new user

<!--
  e.g., "Navigate to /settings/users in the admin panel and click Add User."
-->

### 5.4 How to rotate an API key

1. Generate a new key in the provider's dashboard.
2. Update the environment variable in the hosting platform.
3. Trigger a new deployment to apply the change.
4. Verify the system is working correctly.
5. Revoke the old key in the provider's dashboard.

### 5.5 How to check if background tasks are running

<!--
  e.g., "Log in to trigger.dev, navigate to the project, and check the Runs tab.
  Tasks should show recent successful runs. A task in 'failed' state means it
  needs manual attention — check the error log and re-trigger from the dashboard."
-->

### 5.6 How to restore from a database backup

<!--
  Describe the backup tool and restore procedure.
-->

---

## 6. Troubleshooting Guide

<!--
  The most common problems and how to fix them.
  Add to this list during the UAT phase based on issues found.
-->

| Symptom | Likely cause | Fix |
|---|---|---|
| Background task stuck in "running" | Task timed out without updating status | Re-trigger from the task dashboard; if recurring, investigate logs for root cause |
| | | |
| | | |

### When to contact the agency

During the support period (until <!-- date -->), contact us for:
- Security vulnerabilities or data breaches (contact immediately)
- System is completely down and basic restart steps haven't resolved it
- A bug that was present at launch and not caught during UAT

After the support period, the system is the client's responsibility unless a new support agreement is signed.

**Agency contact during support period:**
- Email: <!-- -->
- Response time: <!-- e.g., business hours, within 4 hours for P0 -->

---

## 7. Known Limitations & Edge Cases

<!--
  Document behaviors that are intentional but non-obvious,
  and edge cases that were identified but are not handled.
  This prevents the client from reporting these as bugs.
-->

| Behavior | Explanation | Workaround |
|---|---|---|
| | | |
| | | |

---

## 8. Future Improvements

<!--
  Features or improvements that were discussed but not included in this contract.
  This is a reference for future project conversations, not a commitment.
-->

-
-
-

---

## 9. Post-Launch Support Terms

Per the project charter (Section 6), the support period covers:

- **Duration:** <!-- e.g., 30 days from handoff date -->
- **Coverage:** Bug fixes for issues present at launch. Does not cover new features, infrastructure changes, or third-party service outages.
- **Excluded:** Changes to scope, new integrations, design changes, performance optimization beyond spec.
- **Billing for out-of-scope requests:** <!-- hourly rate or retainer terms -->

---

## 10. Handoff Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Agency — delivered by | | | |
| Client — received by | | | |

*Both parties confirm that all deliverables listed in the charter have been delivered, tested, and accepted.*

---

*This document is part of the project deliverables. Store it alongside the project repository.*
