interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md";
}

const paddingClass = { sm: "p-3", md: "p-3.5" };

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <section
      className={`dashboard-card group rounded-xl border border-[#CBDDF5] bg-[#F8FBFF] text-slate-900 shadow-[0_8px_22px_rgba(30,64,175,0.1)] backdrop-blur-sm transition duration-200 hover:border-sky-300/80 hover:shadow-[0_0_20px_rgba(37,99,235,0.12)] dark:border-slate-700/40 dark:bg-[#111D2C] dark:text-slate-100 dark:shadow-lg dark:shadow-black/30 dark:hover:border-slate-600/45 dark:hover:shadow-[0_0_22px_rgba(59,130,246,0.12)] ${paddingClass[padding]} ${className}`}
    >
      {children}
    </section>
  );
}
