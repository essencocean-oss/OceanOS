"""
OceanOS Stripe Tools
Production-grade Stripe integration with enforced guardrails.
"""

import os
import stripe
from typing import Dict, Any, Optional

# Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_MODE = os.getenv("STRIPE_MODE", "test")

# Import guardrails
try:
    from .guardrails import pre_execution_check
except ImportError:
    def pre_execution_check(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        return {"approved": True}


def _require_stripe_key() -> Optional[Dict[str, str]]:
    if not stripe.api_key:
        return {"error": "STRIPE_SECRET_KEY is not set in environment"}
    return None


def _log_action(action: str, details: Dict[str, Any]) -> None:
    """Simple logging hook for audit trail."""
    print(f"[Stripe][{STRIPE_MODE}] {action} | {details}")


def _check_guardrail(tool_name: str, args: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Run guardrail check before executing risky operations."""
    result = pre_execution_check(tool_name, args)
    if not result.get("approved", True):
        return {
            "success": False,
            "error": result.get("reason", "Action blocked by guardrails"),
            "requires_approval": True,
            "guardrail_response": result
        }
    return None


def _get_or_create_customer(email: str) -> Any:
    """Helper to find existing customer or create a new one."""
    customers = stripe.Customer.list(email=email, limit=1)
    if customers.data:
        return customers.data[0]
    return stripe.Customer.create(email=email)


# ==================== PAYMENT TOOLS ====================

def create_payment_intent(
    amount: int,
    currency: str = "usd",
    description: str = "",
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Create a PaymentIntent with guardrail enforcement."""
    if error := _require_stripe_key():
        return error

    args = {"amount": amount, "currency": currency}
    if guardrail := _check_guardrail("create_payment_intent", args):
        return guardrail

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency.lower(),
            description=description,
            metadata=metadata or {},
            automatic_payment_methods={"enabled": True},
        )
        _log_action("create_payment_intent", {"id": intent.id, "amount": amount})
        return {
            "success": True,
            "id": intent.id,
            "client_secret": intent.client_secret,
            "amount": intent.amount,
            "currency": intent.currency,
            "status": intent.status,
        }
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}


def create_checkout_session(
    price_id: str,
    success_url: str,
    cancel_url: str,
    mode: str = "payment",
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Create a Stripe Checkout session with guardrail enforcement."""
    if error := _require_stripe_key():
        return error

    args = {"price_id": price_id, "mode": mode}
    if guardrail := _check_guardrail("create_checkout_session", args):
        return guardrail

    try:
        session = stripe.checkout.Session.create(
            mode=mode,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata or {},
        )
        _log_action("create_checkout_session", {"id": session.id})
        return {
            "success": True,
            "id": session.id,
            "url": session.url,
            "status": session.status,
        }
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}


def get_payment_status(payment_intent_id: str) -> Dict[str, Any]:
    """Retrieve status of a PaymentIntent (no guardrail needed)."""
    if error := _require_stripe_key():
        return error

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {
            "success": True,
            "id": intent.id,
            "status": intent.status,
            "amount": intent.amount,
            "currency": intent.currency,
        }
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}


# ==================== SUBSCRIPTION TOOLS ====================

def create_subscription(
    customer_email: str,
    price_id: str,
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Create a recurring subscription with guardrail enforcement."""
    if error := _require_stripe_key():
        return error

    args = {"customer_email": customer_email, "price_id": price_id}
    if guardrail := _check_guardrail("create_subscription", args):
        return guardrail

    try:
        customer = _get_or_create_customer(customer_email)

        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price_id}],
            metadata=metadata or {},
        )
        _log_action("create_subscription", {"subscription_id": subscription.id})
        return {
            "success": True,
            "subscription_id": subscription.id,
            "customer_id": customer.id,
            "status": subscription.status,
        }
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}


def cancel_subscription(subscription_id: str) -> Dict[str, Any]:
    """Cancel an existing subscription."""
    if error := _require_stripe_key():
        return error

    args = {"subscription_id": subscription_id}
    if guardrail := _check_guardrail("cancel_subscription", args):
        return guardrail

    try:
        subscription = stripe.Subscription.cancel(subscription_id)
        _log_action("cancel_subscription", {"subscription_id": subscription_id})
        return {
            "success": True,
            "subscription_id": subscription.id,
            "status": subscription.status,
        }
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}


# ==================== INVOICE TOOLS ====================

def create_invoice(
    customer_email: str,
    amount: int,
    description: str,
    currency: str = "usd",
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Create and finalize an invoice with guardrail enforcement."""
    if error := _require_stripe_key():
        return error

    args = {"customer_email": customer_email, "amount": amount}
    if guardrail := _check_guardrail("create_invoice", args):
        return guardrail

    try:
        customer = _get_or_create_customer(customer_email)

        stripe.InvoiceItem.create(
            customer=customer.id,
            amount=amount,
            currency=currency.lower(),
            description=description,
        )
        invoice = stripe.Invoice.create(
            customer=customer.id,
            auto_advance=True,
        )
        finalized = stripe.Invoice.finalize_invoice(invoice.id)

        _log_action("create_invoice", {"invoice_id": finalized.id})
        return {
            "success": True,
            "invoice_id": finalized.id,
            "hosted_invoice_url": finalized.hosted_invoice_url,
            "status": finalized.status,
        }
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}


# Tool Registry
TOOLS = [
    {"name": "create_payment_intent", "handler": create_payment_intent},
    {"name": "create_checkout_session", "handler": create_checkout_session},
    {"name": "get_payment_status", "handler": get_payment_status},
    {"name": "create_subscription", "handler": create_subscription},
    {"name": "cancel_subscription", "handler": cancel_subscription},
    {"name": "create_invoice", "handler": create_invoice},
]