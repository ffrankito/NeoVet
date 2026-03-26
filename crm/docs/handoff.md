# Client Handoff — NeoVet CRM

| Field | Value |
|---|---|
| **Project** | NeoVet CRM |
| **Client** | Paula Silveira |
| **Production URL** | <!-- TODO --> |
| **Handoff date** | <!-- YYYY-MM-DD --> |
| **Support period ends** | <!-- YYYY-MM-DD --> |

> This document is filled at project delivery. Most sections are placeholders until then.

---

## Pre-Launch Checklist

### Security
- [ ] All Supabase credentials rotated to production values
- [ ] No secrets committed to the repository
- [ ] `.env.example` up to date
- [ ] HTTPS enforced (Vercel default)
- [ ] Auth-protected routes verified in production
- [ ] `npm audit` run — no high/critical vulnerabilities

### Functionality
- [ ] All deliverables from charter tested in production
- [ ] Paula and team have completed UAT
- [ ] Data imported from Geovet with no data loss verified

### Data
- [ ] All migrations applied to production
- [ ] Geovet import completed and verified
- [ ] Supabase backup strategy confirmed

### Documentation
- [ ] This handoff document completed
- [ ] `README.md` accurate
- [ ] `technical-spec.md` reflects final implementation
- [ ] All ADRs up to date

### Access Transfer
- [ ] Paula has admin access to Vercel
- [ ] Paula has admin access to Supabase
- [ ] Agency access removed or downgraded per agreement

---

## System Overview (for Paula)

<!-- TODO: fill at handoff — explain what the system does in plain language -->

---

## Credentials

| System | Who holds it |
|---|---|
| Vercel | <!-- TODO --> |
| Supabase | <!-- TODO --> |

---

## Runbook

### How to add a new staff user
<!-- TODO: fill at handoff -->

### How to run a database migration after a code update
```bash
npm run db:migrate
```

### How to rotate a credential
1. Generate new key in the provider's dashboard
2. Update the environment variable in Vercel → Settings → Environment Variables
3. Trigger a new deployment
4. Verify the system works
5. Revoke the old key

---

## Known Limitations (v1)

| Behavior | Explanation |
|---|---|
| No chatbot integration | The CRM and chatbot are independent in v1. Integration is v2. |
| No automation | All appointment management is manual. Notifications are v2. |
| No reporting | Analytics and reporting are v3. |
