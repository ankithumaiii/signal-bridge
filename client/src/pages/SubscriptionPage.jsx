import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Check, AlertCircle, Sparkles, CreditCard,
  CheckCircle2, Clock, ArrowRight, RefreshCw, XCircle,
  HelpCircle, ShieldAlert, Users, PhoneCall, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export const SubscriptionPage = () => {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [billingInterval, setBillingInterval] = useState('month'); // 'month' | 'year'
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchSubscriptionData = async () => {
    try {
      const [plansRes, currentRes] = await Promise.all([
        api.getSubscriptionPlans().catch(() => ({ success: false, plans: [] })),
        api.getCurrentSubscription().catch(() => ({ success: false }))
      ]);

      if (plansRes.success) setPlans(plansRes.plans);
      if (currentRes.success) {
        setCurrentSub(currentRes.subscription);
        setEntitlements(currentRes.entitlements);
      }
    } catch (err) {
      console.warn('Subscription fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();

    // Dynamically load Razorpay checkout script if not present
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleUpgrade = async (planId) => {
    setProcessingPlan(planId);
    setPaymentNotice(null);

    try {
      // 1. Backend creates order using server-defined price
      const orderRes = await api.createPaymentOrder({ planId });
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Could not create payment order');
      }

      const orderData = orderRes.order;

      // 2. Check if Razorpay script is available
      if (window.Razorpay && orderData.keyId && !orderData.orderId.startsWith('order_demo_')) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Signal Bridge',
          description: orderData.plan.name,
          order_id: orderData.orderId,
          handler: async function (response) {
            setPaymentNotice({
              type: 'info',
              text: 'Verifying payment signature with banking gateway…'
            });

            try {
              const verifyRes = await api.verifyPayment({
                planId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.success) {
                setPaymentNotice({
                  type: 'success',
                  text: `✓ Payment verified successfully. ${orderData.plan.name} is now active!`
                });
                await fetchSubscriptionData();
              } else {
                throw new Error(verifyRes.message || 'Signature verification failed');
              }
            } catch (vErr) {
              setPaymentNotice({
                type: 'error',
                text: `Payment verification notice: ${vErr.message}`
              });
            } finally {
              setProcessingPlan(null);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: '#161616'
          },
          modal: {
            ondismiss: function () {
              setProcessingPlan(null);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setPaymentNotice({
            type: 'error',
            text: `Payment failed: ${response.error.description || 'Transaction cancelled or declined by bank'}`
          });
          setProcessingPlan(null);
        });
        rzp.open();
      } else {
        // Safe Demo Sandbox Checkout
        setPaymentNotice({
          type: 'info',
          text: 'Running safe test-mode verification (Demo sandbox active)…'
        });

        // Generate valid demo verification payload
        const demoPaymentId = `pay_demo_${Date.now()}`;
        const demoSignature = `demo_sig_valid_${Date.now()}`;

        setTimeout(async () => {
          try {
            const verifyRes = await api.verifyPayment({
              planId,
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: demoPaymentId,
              razorpay_signature: demoSignature
            });

            if (verifyRes.success) {
              setPaymentNotice({
                type: 'success',
                text: `✓ Test verification complete. ${orderData.plan.name} is now active!`
              });
              await fetchSubscriptionData();
            }
          } catch (err) {
            setPaymentNotice({ type: 'error', text: err.message });
          } finally {
            setProcessingPlan(null);
          }
        }, 800);
      }
    } catch (err) {
      setPaymentNotice({
        type: 'error',
        text: err.message || 'Payment initiation failed'
      });
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    const confirm = window.confirm(
      'Are you sure you want to cancel automatic renewal? You will retain all Plus benefits until the end of your current billing period.'
    );
    if (!confirm) return;

    setCancelling(true);
    try {
      const res = await api.cancelSubscription();
      if (res.success) {
        setPaymentNotice({
          type: 'info',
          text: res.message || 'Cancellation scheduled for end of period.'
        });
        await fetchSubscriptionData();
      }
    } catch (err) {
      setPaymentNotice({ type: 'error', text: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const activePlanId = currentSub?.planId || 'free';
  const isPaidActive = currentSub?.status === 'active' && activePlanId !== 'free';

  const selectedPlusPlanId = billingInterval === 'year' ? 'plus_annual' : 'plus_monthly';
  const selectedPlusPlan = plans.find((p) => p.id === selectedPlusPlanId) || {
    name: 'Signal Bridge Plus',
    displayPrice: billingInterval === 'year' ? '₹999' : '₹99',
    billingPeriod: billingInterval === 'year' ? 'Billed annually (~₹83/mo)' : 'Billed monthly',
    features: []
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* — Feedback Banner — */}
      {paymentNotice && (
        <div style={{
          background: paymentNotice.type === 'success'
            ? 'var(--color-safe-bg)'
            : paymentNotice.type === 'error'
            ? 'var(--color-emergency-bg)'
            : 'var(--color-surface-alt)',
          color: paymentNotice.type === 'success'
            ? 'var(--color-safe-text)'
            : paymentNotice.type === 'error'
            ? 'var(--color-emergency-text)'
            : 'var(--color-ink)',
          border: `1px solid ${
            paymentNotice.type === 'success'
              ? 'rgba(46, 125, 91, 0.25)'
              : paymentNotice.type === 'error'
              ? 'rgba(192, 57, 43, 0.25)'
              : 'var(--color-border)'
          }`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.15rem',
          fontSize: '0.86rem',
          fontWeight: 550,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {paymentNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{paymentNotice.text}</span>
          </div>
          <button
            onClick={() => setPaymentNotice(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         1. EDITORIAL HEADER & PHILOSOPHY
         ═══════════════════════════════════════════════════════════ */}
      <div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--color-ink-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.35rem'
        }}>
          Safety Membership & Billing
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(1.75rem, 3.4vw, 2.35rem)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          letterSpacing: '-0.035em',
          lineHeight: 1.15,
          margin: 0
        }}>
          Transparent Protection for You and Your Family
        </h1>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-ink-secondary)',
          marginTop: '0.35rem',
          marginBottom: 0,
          maxWidth: '680px',
          lineHeight: 1.5
        }}>
          Core emergency features and India ERSS 112 calling are always 100% free for all citizens.
          Upgrade to Signal Bridge Plus to expand your responder circle and automate family safety coordination.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         2. CURRENT SUBSCRIPTION STATUS CARD
         ═══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: isPaidActive ? 'var(--color-safe-bg)' : 'var(--color-surface-alt)',
            color: isPaidActive ? 'var(--color-safe)' : 'var(--color-ink-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {isPaidActive ? <Sparkles size={20} /> : <ShieldCheck size={20} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
                {isPaidActive ? (activePlanId === 'plus_annual' ? 'Signal Bridge Plus (Annual)' : 'Signal Bridge Plus (Monthly)') : 'Signal Bridge Core (Free)'}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                background: isPaidActive ? 'var(--color-safe-bg)' : 'var(--color-surface-alt)',
                color: isPaidActive ? 'var(--color-safe-text)' : 'var(--color-ink-muted)',
                border: `1px solid ${isPaidActive ? 'rgba(46, 125, 91, 0.25)' : 'var(--color-border)'}`
              }}>
                {isPaidActive ? (currentSub?.cancelAtPeriodEnd ? 'Cancels at Period End' : 'Active Plan') : 'Standard Access'}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', margin: '0.15rem 0 0 0' }}>
              {isPaidActive ? (
                <>
                  Valid through {currentSub?.currentPeriodEnd ? new Date(currentSub.currentPeriodEnd).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Active'} • {entitlements?.maxContacts || 20} contacts allowed
                </>
              ) : (
                'Free forever • Essential SOS activation • Manual 112 dialing • Up to 3 emergency contacts'
              )}
            </p>
          </div>
        </div>

        {isPaidActive && !currentSub?.cancelAtPeriodEnd && (
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}
          >
            {cancelling ? 'Updating…' : 'Cancel Auto-Renewal'}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         3. BILLING INTERVAL TOGGLE (MONTHLY VS. ANNUAL)
         ═══════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'var(--color-surface-alt)',
          padding: '3px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border)'
        }}>
          <button
            type="button"
            onClick={() => setBillingInterval('month')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              background: billingInterval === 'month' ? 'var(--color-surface)' : 'transparent',
              color: billingInterval === 'month' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
              border: billingInterval === 'month' ? '1px solid var(--color-border)' : '1px solid transparent',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: billingInterval === 'month' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval('year')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              background: billingInterval === 'year' ? 'var(--color-surface)' : 'transparent',
              color: billingInterval === 'year' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
              border: billingInterval === 'year' ? '1px solid var(--color-border)' : '1px solid transparent',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: billingInterval === 'year' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Annual Billing</span>
            <span style={{
              fontSize: '0.68rem',
              background: 'var(--color-safe-bg)',
              color: 'var(--color-safe-text)',
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700
            }}>
              Save 16%
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         4. PLAN COMPARISON COLUMNS (EDITORIAL, RESTRAINED)
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid-2" style={{ alignItems: 'stretch', gap: 'var(--space-6)' }}>

        {/* — Plan 1: Core (Free) — */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-ink-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Citizen Tier
            </div>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
              margin: '0.2rem 0 0.5rem 0'
            }}>
              Signal Bridge Core
            </h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)' }}>₹0</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>forever</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-secondary)', margin: '0 0 var(--space-5) 0', lineHeight: 1.45 }}>
              Fundamental emergency safety controls, continuous community hazard radar, and manual 112 dispatch.
            </p>

            <div style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              {[
                'Instant Emergency SOS press-and-hold trigger',
                'Direct one-tap phone link to India ERSS 112',
                'Up to 3 trusted emergency contacts',
                'Real-time community hazard radar and reporting',
                'Store-and-forward offline telemetry queue'
              ].map((feat) => (
                <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--color-ink)' }}>
                  <Check size={15} color="var(--color-safe)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{
              padding: '0.55rem',
              textAlign: 'center',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-ink-muted)',
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-sm)'
            }}>
              Included with Every Account
            </div>
          </div>
        </div>

        {/* — Plan 2: Signal Bridge Plus (Paid) — */}
        <div style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-accent)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: '0 4px 18px rgba(197, 107, 69, 0.08)'
        }}>
          {/* Top highlight ribbon */}
          <div style={{
            position: 'absolute',
            top: '-11px',
            right: '24px',
            background: 'var(--color-accent)',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.15rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {billingInterval === 'year' ? 'Best Value' : 'Most Flexible'}
          </div>

          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Enhanced Family Safety
            </div>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
              margin: '0.2rem 0 0.5rem 0'
            }}>
              {selectedPlusPlan.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                {selectedPlusPlan.displayPrice}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                {selectedPlusPlan.billingPeriod}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-secondary)', margin: '0 0 var(--space-5) 0', lineHeight: 1.45 }}>
              Expanded emergency circle, long-term immutable incident audit ledger, and multi-channel telemetry.
            </p>

            <div style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              {[
                `Up to ${billingInterval === 'year' ? '50' : '20'} trusted emergency contacts`,
                `${billingInterval === 'year' ? '365' : '90'}-day immutable incident audit ledger`,
                'Priority carrier SMS delivery routing & status logging',
                'Scheduled family safety check-in pings & reminders',
                'Emergency medical pass export with telemetry for 112 operators',
                ...(billingInterval === 'year' ? ['Multi-account Family Circle coverage (up to 5 members)'] : [])
              ].map((feat) => (
                <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--color-ink)' }}>
                  <Check size={15} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => handleUpgrade(selectedPlusPlanId)}
              disabled={processingPlan === selectedPlusPlanId || (isPaidActive && activePlanId === selectedPlusPlanId)}
              className="btn btn-lg"
              style={{
                width: '100%',
                background: isPaidActive && activePlanId === selectedPlusPlanId ? 'var(--color-safe)' : 'var(--color-accent)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.92rem',
                gap: '0.5rem',
                border: 'none',
                cursor: isPaidActive && activePlanId === selectedPlusPlanId ? 'default' : 'pointer'
              }}
            >
              {processingPlan === selectedPlusPlanId ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Preparing Secure Checkout…</span>
                </>
              ) : isPaidActive && activePlanId === selectedPlusPlanId ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Currently Active</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Upgrade to {billingInterval === 'year' ? 'Plus Annual' : 'Plus Monthly'}</span>
                </>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              marginTop: '0.5rem',
              fontSize: '0.72rem',
              color: 'var(--color-ink-muted)'
            }}>
              <span>Powered by Razorpay</span>
              <span>•</span>
              <span>UPI, Cards, NetBanking (INR)</span>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════
         5. NON-NEGOTIABLE SAFETY GUARANTEE NOTICE
         ═══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--color-surface-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-5)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-4)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--color-emergency-bg)',
          color: 'var(--color-emergency)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldAlert size={17} />
        </div>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '0.2rem' }}>
            Emergency Safety Is Never Gated Behind a Paywall
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-secondary)', margin: 0, lineHeight: 1.45 }}>
            Regardless of whether your subscription is Free, Active, Cancelled, or Expired: your ability to trigger an Emergency SOS,
            dial India ERSS 112, view live local hazards, and notify your emergency contacts remains permanently available.
          </p>
        </div>
      </div>

    </div>
  );
};
