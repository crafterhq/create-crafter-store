import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="status-page">
      <h1>Not found</h1>
      <p>This page or product does not exist.</p>
      <div className="actions">
        <Link href="/" className="button">
          Browse products
        </Link>
      </div>
    </section>
  );
}
