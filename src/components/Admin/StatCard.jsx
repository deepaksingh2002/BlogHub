import React from "react";

function StatCard({ label, value, description }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-beige bg-background p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-background dark:border-light/20">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-80" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dark/55 dark:text-light/65">
        {label}
      </p>
      <p className="mt-3 text-3xl sm:text-4xl font-black text-dark dark:text-light">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-dark/65 dark:text-light/75">
          {description}
        </p>
      ) : null}
    </article>
  );
}

export default React.memo(StatCard);
