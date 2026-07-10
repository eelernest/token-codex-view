"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchHealth } from "@/lib/api";

const POLL_INTERVAL = 30000;
const MAX_FAILURES = 3;

export function useHealth() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const failuresRef = useRef(0);

  const check = useCallback(async () => {
    const result = await fetchHealth();
    if (result?.status === "ok") {
      setOnline(true);
      failuresRef.current = 0;
    } else {
      failuresRef.current++;
      if (failuresRef.current >= MAX_FAILURES) {
        setOnline(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  const retry = useCallback(() => {
    failuresRef.current = 0;
    setOnline(false);
    setLoading(true);
    check();
  }, [check]);

  return { online, loading, retry };
}
