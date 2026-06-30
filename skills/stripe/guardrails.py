"""
Stripe Guardrails for OceanOS
Enforced security layer with practical configuration options.
"""

import os
from typing import Dict, Any

STRIPE_MODE = os.getenv("STRIPE_MODE", "test")


def requires_approval(tool_name: str, args: Dict[str, Any]) -> bool:
    """Returns True if this action should require explicit approval."""
    risky_tools = [
        "create_payment_intent",
        "create_subscription",
        "create_invoice",
        "create_checkout_session",
        "cancel_subscription"
    ]
    return tool_name in risky_tools


def validate_amount(amount: int) -> bool:
    """Basic validation to prevent obviously wrong amounts."""
    return 50 <= amount <= 100000  # $0.50 to $1000


def pre_execution_check(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run before any Stripe tool executes.
    
    Behavior:
    - In test mode: Only block if amount is out of range
    - In live mode: Always require approval for risky tools
    """
    # Amount validation (applies to both modes)
    if "amount" in args and not validate_amount(args["amount"]):
        return {
            "approved": False,
            "reason": "Amount outside allowed range ($0.50 - $1000)",
            "requires_confirmation": True
        }

    # Risky tool check
    if requires_approval(tool_name, args):
        if STRIPE_MODE == "test":
            # In test mode, allow but flag for logging
            return {
                "approved": True,
                "reason": "Test mode - action allowed with logging",
                "test_mode": True
            }
        else:
            # In live mode, require explicit approval
            return {
                "approved": False,
                "reason": "Financial action requires explicit approval in live mode",
                "requires_confirmation": True
            }

    return {"approved": True}