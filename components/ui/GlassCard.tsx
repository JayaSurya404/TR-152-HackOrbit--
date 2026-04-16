import { ReactNode } from "react";

type GlassCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function GlassCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: GlassCardProps) {
  return (
    <section
      className={`glass-panel rounded-[28px] p-5 md:p-6 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-white md:text-lg">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}