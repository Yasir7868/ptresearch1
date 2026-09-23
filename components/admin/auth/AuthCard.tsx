import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="soft-card p-6 md:p-8">
      <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      {description && <div className="mt-2 text-[14px] leading-relaxed text-ink-muted">{description}</div>}
      {children && <div className="mt-6">{children}</div>}
      {footer && <div className="mt-6 border-t border-hairline/70 pt-4 text-[13px] text-ink-muted">{footer}</div>}
    </div>
  );
}

export function ConfigProblem({ message }: { message: string }) {
  return (
    <AuthCard
      title="The admin panel isn't configured yet"
      description={<p role="alert">{message}</p>}
      footer="See the Admin panel section of README.md for the environment variables."
    />
  );
}
