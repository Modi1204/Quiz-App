import Button from './Button';

/**
 * Renders the right view for an async result so pages never show a blank or broken screen.
 * Props: status/error/retry from useAsync, children render only on success,
 * plus optional copy for the loading and empty views.
 */
export default function AsyncState({
  status,
  error,
  onRetry,
  loadingText = 'Loading…',
  emptyTitle = 'Nothing here yet',
  emptyText = 'There is no content to show.',
  children,
}) {
  if (status === 'loading') {
    return (
      <div className="state state-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>{loadingText}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="state state-error" role="alert">
        <h2>Something went wrong</h2>
        <p>{error?.message || 'An unexpected error occurred.'}</p>
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="state state-empty" role="status">
        <h2>{emptyTitle}</h2>
        <p>{emptyText}</p>
        {onRetry && <Button onClick={onRetry}>Refresh</Button>}
      </div>
    );
  }

  return children;
}
