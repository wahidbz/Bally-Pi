// ============================================================
// PI NETWORK INTEGRATION HOOK
// Full payment flow: createPayment → server approval → completion
// Anti-replay protection via localStorage txid storage
// ============================================================
import { useCallback, useRef } from 'react';
import { PI_CONFIG } from '../constants/gameConstants';
import { hasTransaction, saveTransaction } from '../utils/storage';

// ---- Simulated backend endpoints ----
// In production: replace these with real backend calls to:
//   POST /api/pi/approve   → calls Pi Platform API: POST /v2/payments/{id}/approve
//   POST /api/pi/complete  → calls Pi Platform API: POST /v2/payments/{id}/complete
// Both endpoints must verify the payment server-side before returning success.

async function serverApprove(paymentId) {
  // PRODUCTION: await fetch('/api/pi/approve', { method: 'POST', body: JSON.stringify({ paymentId }), headers: {'Content-Type':'application/json'} })
  console.log('[Pi] Server approve called for paymentId:', paymentId);
  // Simulate network delay
  await new Promise(r => setTimeout(r, 300));
  return { success: true, paymentId };
}

async function serverComplete(paymentId, txid) {
  // PRODUCTION: await fetch('/api/pi/complete', { method: 'POST', body: JSON.stringify({ paymentId, txid }), headers: {'Content-Type':'application/json'} })
  console.log('[Pi] Server complete called for paymentId:', paymentId, 'txid:', txid);
  await new Promise(r => setTimeout(r, 300));
  return { success: true, paymentId, txid };
}

export function usePiNetwork() {
  const pendingPaymentRef = useRef(null);

  // ---- Authenticate user ----
  const authenticate = useCallback(async () => {
    if (!window.piSdkReady || typeof Pi === 'undefined') {
      console.warn('[Pi] SDK not available');
      return null;
    }
    try {
      const authResult = await Pi.authenticate(
        ['payments'],
        async (incompletePayment) => {
          // Handle incomplete payments from previous sessions
          if (incompletePayment) {
            console.log('[Pi] Incomplete payment found:', incompletePayment.identifier);
            try {
              await serverComplete(incompletePayment.identifier, incompletePayment.transaction?.txid || '');
            } catch (e) {
              console.error('[Pi] Failed to complete incomplete payment:', e);
            }
          }
        }
      );
      return authResult;
    } catch (e) {
      console.error('[Pi] Authentication error:', e);
      return null;
    }
  }, []);

  // ---- Create payment for power-up recharge ----
  const createRechargePayment = useCallback((powerupId, onSuccess, onFailure) => {
    if (!window.piSdkReady || typeof Pi === 'undefined') {
      console.warn('[Pi] Pi SDK not available — running outside Pi Browser');
      if (onFailure) onFailure(new Error('Pi SDK not available'));
      return;
    }

    const paymentData = {
      amount: PI_CONFIG.rechargeCost,
      memo: `${PI_CONFIG.paymentMemo} (${powerupId})`,
      metadata: {
        powerupId,
        timestamp: Date.now(),
        game: 'bally-pi',
        version: '1.0.0',
      },
    };

    const callbacks = {
      // Phase I: SDK has payment ID — send to server for approval
      onReadyForServerApproval: async (paymentId) => {
        console.log('[Pi] onReadyForServerApproval:', paymentId);
        pendingPaymentRef.current = paymentId;
        try {
          const result = await serverApprove(paymentId);
          if (!result.success) {
            console.error('[Pi] Server approval failed');
          }
        } catch (e) {
          console.error('[Pi] Approval network error:', e);
        }
      },

      // Phase III: User submitted blockchain tx — complete on server
      onReadyForServerCompletion: async (paymentId, txid) => {
        console.log('[Pi] onReadyForServerCompletion:', paymentId, txid);

        // Anti-replay: reject duplicate txids
        if (hasTransaction(txid)) {
          console.warn('[Pi] Duplicate transaction detected, rejecting:', txid);
          if (onFailure) onFailure(new Error('Duplicate transaction'));
          return;
        }

        try {
          const result = await serverComplete(paymentId, txid);

          if (result.success) {
            // Save txid BEFORE granting reward (prevent double-grant)
            saveTransaction(txid);
            pendingPaymentRef.current = null;

            // ✅ Only grant reward AFTER confirmed server completion
            if (onSuccess) onSuccess({ paymentId, txid, powerupId });
          } else {
            console.error('[Pi] Server completion failed — reward NOT granted');
            if (onFailure) onFailure(new Error('Server completion failed'));
          }
        } catch (e) {
          console.error('[Pi] Completion network error:', e);
          if (onFailure) onFailure(e);
        }
      },

      onCancel: (paymentId) => {
        console.log('[Pi] Payment cancelled:', paymentId);
        pendingPaymentRef.current = null;
        if (onFailure) onFailure(new Error('Payment cancelled'));
      },

      onError: (error, payment) => {
        console.error('[Pi] Payment error:', error, payment);
        pendingPaymentRef.current = null;
        if (onFailure) onFailure(error);
      },
    };

    try {
      Pi.createPayment(paymentData, callbacks);
    } catch (e) {
      console.error('[Pi] createPayment threw:', e);
      if (onFailure) onFailure(e);
    }
  }, []);

  return {
    authenticate,
    createRechargePayment,
    pendingPaymentRef,
  };
}
