'use client';

/**
 * useSyncStatus
 *
 * Hook to check if there are pending offline operations waiting to be synced.
 * Returns the count of pending operations and a function to check status.
 */

import { useState, useEffect } from 'react';
import { getPendingOps, hasPendingOps } from '@/app/lib/db';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const checkPendingOps = async () => {
    try {
      setIsChecking(true);
      const hasPending = await hasPendingOps();
      if (hasPending) {
        const ops = await getPendingOps();
        setPendingCount(ops.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Error checking pending operations:', error);
      setPendingCount(0);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkPendingOps();
    // Check periodically every 10 seconds
    const interval = setInterval(checkPendingOps, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    pendingCount,
    isChecking,
    hasPending: pendingCount > 0,
    refresh: checkPendingOps,
  };
}
