import { useCallback, useEffect, useRef, useState } from 'react';

const isEmptyResult = (data) => data == null || (Array.isArray(data) && data.length === 0);

/**
 * Runs an async loader and exposes its lifecycle:
 *   status: 'loading' | 'success' | 'empty' | 'error'
 * - Stale responses are ignored (unmount, changed deps, or a newer retry), so a slow
 *   earlier request can never overwrite newer state.
 * - retry() re-runs the loader and is a no-op while a request is already in flight,
 *   so rapid clicks cannot fire duplicate requests.
 * `loader` should be stable (useCallback) or change only when its inputs change.
 */
export function useAsync(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const requestId = useRef(0);
  const inFlight = useRef(false);

  const run = useCallback(() => {
    const id = ++requestId.current;
    inFlight.current = true;
    setState({ status: 'loading', data: null, error: null });
    loader()
      .then((data) => {
        if (id !== requestId.current) return;
        setState({ status: isEmptyResult(data) ? 'empty' : 'success', data, error: null });
      })
      .catch((error) => {
        if (id !== requestId.current) return;
        setState({ status: 'error', data: null, error });
      })
      .finally(() => {
        if (id === requestId.current) inFlight.current = false;
      });
  }, [loader]);

  useEffect(() => {
    run();
    return () => {
      requestId.current += 1;
      inFlight.current = false;
    };
  }, [run]);

  const retry = useCallback(() => {
    if (!inFlight.current) run();
  }, [run]);

  return { ...state, retry };
}
