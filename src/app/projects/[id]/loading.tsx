export default function ProjectLoading() {
  return (
    <section className="page-width app-page detail-page loading-page" aria-busy="true" aria-label="Loading project details">
      <span className="visually-hidden">Loading project details…</span>
      <div className="skeleton skeleton-back" />
      <div className="loading-heading">
        <div className="skeleton skeleton-tag" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-byline" />
      </div>
      <div className="skeleton skeleton-hero" />
      <div className="loading-content">
        <div>
          <div className="skeleton skeleton-subtitle" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
        <div className="skeleton skeleton-author" />
      </div>
    </section>
  );
}