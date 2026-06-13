---
name: guardrails-approval
description: Enforce command approval, secret redaction, and PII hashing rules.
author: OceanOS
tags:
  - security
  - privacy
  - governance
price_cents: 0
license_key_required: false
entrypoints:
  - command: python registery/guardrails.py
    port: 8010
    protocol: http
---

# Guardrails / Approval Skill

This skill configures Hermes runtime guardrails for command approval and privacy redaction:
- approvals.mode: smart|manual|off
- security.redact_secrets: true|false
- privacy.redact_pii: true|false
- website_blocklist: optional list
