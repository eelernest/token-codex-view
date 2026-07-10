"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchHealth } from "@/lib/api";

const POLL_INTERVAL = 30000;
const MAX_FAILURES = 3;

export function useHealth() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState(0);

  const check = useCallback(async () => {
    const result = await fetchHealth();
    if (result?.status === "ok") {
      setOnline(true);
      setFailures(0);
    } else {
      setFailures((f) => f + 1);
      if (failures >= MAX_FAILURES - 1) {
        setOnline(false);
      }
    }
    setLoading(false);
  }, [failures]);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const retry = useCallback(() => {
    setFailures(0);
    setLoading(true);
    check();
  }, [check]);

  return { online, loading, retry };
}
