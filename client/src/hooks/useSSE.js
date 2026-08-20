import { useEffect, useRef, useCallback } from 'react';

/**
 * React hook that connects to the server SSE stream and calls handlers
 * when events arrive.
 *
 * @param {object} handlers   Map of eventName → callback(data)
 * @param {boolean} enabled   Set false to temporarily disable (e.g. when no server)
 */
export function useSSE(handlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers; // always up-to-date without resubscribing

  const connect = useCallback(() => {
    if (!enabled) return null;

    const es = new EventSource('/api/events');

    es.onopen = () => {
      console.log('[SSE] Connected');
    };

    es.onerror = () => {
      // Browser auto-reconnects on error; just log it
      console.warn('[SSE] Connection error — browser will retry');
    };

    // Listen for all named events registered in handlers
    const attach = (name) => {
      es.addEventListener(name, (event) => {
        try {
          const data = JSON.parse(event.data);
          const fn = handlersRef.current[name];
          if (typeof fn === 'function') fn(data);
        } catch (e) {
          console.warn('[SSE] Failed to parse event:', name, e);
        }
      });
    };

    // Register all handlers provided at call time
    Object.keys(handlers).forEach(attach);

    return es;
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const es = connect();
    return () => {
      if (es) {
        es.close();
        console.log('[SSE] Disconnected');
      }
    };
  }, [connect]);
}
