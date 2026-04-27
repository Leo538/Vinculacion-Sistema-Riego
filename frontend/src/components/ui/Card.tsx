interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md";
}

const paddingClass = { sm: "p-3", md: "p-3.5" };

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <section
      className={`dashboard-card group rounded-xl border border-slate-700/40 bg-[#111D2C] shadow-lg shadow-black/30 backdrop-blur-sm transition duration-200 hover:border-slate-600/45 hover:shadow-[0_0_22px_rgba(59,130,246,0.12)] ${paddingClass[padding]} ${className}`}
    >
      {children}
    </section>
  );
}
