import React from "react";

function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-beige bg-background p-4 dark:bg-background dark:border-light/20">
      <p className="text-xs uppercase tracking-[0.14em] text-dark/70 dark:text-light/80">{label}</p>
      <p className="mt-2 text-3xl font-black text-primary dark:text-primary">{value}</p>
    </article>
  );
}

export default React.memo(StatCard);
