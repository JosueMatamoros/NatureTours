// src/hooks/useConfirmExit.js
import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function useConfirmExit(when, onBlocked) {
  const blocker = useBlocker(when);
  const lastState = useRef(blocker.state);

  useEffect(() => {
    if (lastState.current !== "blocked" && blocker.state === "blocked") {
      onBlocked?.(blocker);
    }
    lastState.current = blocker.state;
  }, [blocker, onBlocked]);

  return blocker;
}
