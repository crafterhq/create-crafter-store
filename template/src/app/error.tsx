'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="status-page">
      <h1>Something went wrong</h1>
      <p>The store could not be loaded right now.</p>
      <div className="actions">
        <button type="button" className="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </section>
  );
}
