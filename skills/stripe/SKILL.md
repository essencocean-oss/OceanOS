---
name: stripe
description: Production-grade Stripe integration for OceanOS. Enables agents to create payments, subscriptions, and invoices with enforced security guardrails.
version: 0.2.0
author: OceanOS Team
tags: [payments, billing, commerce, finance]
---

# Stripe Skill for OceanOS

## Overview
This skill provides secure, production-ready Stripe capabilities for OceanOS agents. **All financial actions are now enforced through guardrails.**

## Key Principles
- **Security First**: No spend action executes without explicit approval via guardrails.
- **Test Mode by Default**: Encourages safe development.
- **Clear Audit Trail**: All actions are logged.
- **Enforced Guardrails**: Tools now actively check `pre_execution_check` before running.

## Environment Variables
```bash
STRIPE_SECRET_KEY=***          # Required
STRIPE_WEBHOOK_SECRET=***        # Recommended
STRIPE_MODE=test                       # test | live
```

## Available Tools

### Payment Tools
- `create_payment_intent`
- `create_checkout_session`
- `get_payment_status`

### Subscription Tools
- `create_subscription`
- `cancel_subscription`

### Invoice Tools
- `create_invoice`

## Guardrails
All money-moving tools now call `pre_execution_check()` before execution. If the guardrail blocks the action, the tool returns early with `requires_approval: True`.

## Improvements in v0.2.0
- Guardrails are now **enforced** (not just decorative)
- Added `cancel_subscription`
- Improved customer reuse (avoids duplicate customers)
- Better error handling

This skill forms the foundation for economic activity in OceanOS.