# Stripe Skill for OceanOS

Production-grade Stripe integration that enables OceanOS agents to earn, spend, and manage real money with strong security guardrails.

## Features

- **Enforced Guardrails**: All financial actions go through approval checks
- **Test vs Live Mode**: Smart behavior based on `STRIPE_MODE`
- **Customer Reuse**: Avoids duplicate customer creation
- **Full Toolset**:
  - Payments (`create_payment_intent`, `create_checkout_session`)
  - Subscriptions (`create_subscription`, `cancel_subscription`)
  - Invoices (`create_invoice`)
  - Status checks (`get_payment_status`)

## Installation

1. Add your Stripe key:
   ```bash
   export STRIPE_SECRET_KEY=sk_test_...
   export STRIPE_MODE=test
   ```

2. The skill is automatically discovered by OceanOS when placed in `skills/stripe/`.

## Guardrails

The skill uses a dedicated `guardrails.py` module:

- **Test mode**: Actions are allowed with logging
- **Live mode**: All money-moving actions require explicit approval
- Amount validation between $0.50 – $1,000 by default

## Usage Example

```python
from skills.stripe.stripe_tools import create_checkout_session

result = create_checkout_session(
    price_id="price_xxx",
    success_url="https://example.com/success",
    cancel_url="https://example.com/cancel"
)
```

## Security

- No action executes without passing guardrail checks
- All actions are logged
- API key is never exposed to agents

## Version

- Current: v0.2.0 (Guardrails enforced + customer reuse)