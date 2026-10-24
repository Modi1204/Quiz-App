import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsync', () => {
  it('starts loading then resolves to success', async () => {
    const loader = vi.fn().mockResolvedValue({ a: 1 });
    const { result } = renderHook(() => useAsync(loader));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual({ a: 1 });
  });

  it.each([[[]], [null], [undefined]])('reports empty for %j', async (value) => {
    const loader = () => Promise.resolve(value);
    const { result } = renderHook(() => useAsync(loader));
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('reports errors and recovers on retry', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useAsync(loader));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error.message).toBe('boom');

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toBe('ok');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('ignores retry while a request is in flight', async () => {
    const d = deferred();
    const loader = vi.fn(() => d.promise);
    const { result } = renderHook(() => useAsync(loader));
    act(() => {
      result.current.retry();
      result.current.retry();
    });
    expect(loader).toHaveBeenCalledTimes(1);
    await act(async () => d.resolve('x'));
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('ignores a stale response after the loader changes', async () => {
    const slow = deferred();
    const fast = deferred();
    const slowLoader = () => slow.promise;
    const fastLoader = () => fast.promise;
    const { result, rerender } = renderHook(({ loader }) => useAsync(loader), { initialProps: { loader: slowLoader } });
    rerender({ loader: fastLoader });
    await act(async () => fast.resolve('fast'));
    await act(async () => slow.resolve('slow'));
    expect(result.current.data).toBe('fast');
  });

  it('does not update state after unmount', async () => {
    const d = deferred();
    const loader = () => d.promise;
    const { unmount } = renderHook(() => useAsync(loader));
    unmount();
    await expect(act(async () => d.resolve('late'))).resolves.not.toThrow();
  });
});
