import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  title,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-card p-4 text-ink shadow-soft",
        className
      )}
    >
      {title && <h2 className="mb-3 font-serif text-base text-ink">{title}</h2>}
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const colors = {
    default: "bg-surface text-body shadow-hairline",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", colors[variant])}>
      {children}
    </span>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover hover:shadow-elev active:translate-y-[0.5px]",
    secondary: "bg-card text-ink shadow-hairline hover:bg-surface hover:shadow-soft",
    outline: "border border-hairline bg-transparent text-ink hover:bg-surface",
    ghost: "text-body hover:bg-surface hover:text-ink",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  const sizes = {
    sm: "h-8 min-h-8 px-3 text-xs sm:min-h-8",
    md: "h-9 min-h-11 px-4 text-sm sm:min-h-9",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="flex h-9 w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink shadow-hairline placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      {...props}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="flex h-9 w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink shadow-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      {...props}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink shadow-hairline placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      rows={3}
      {...props}
    />
  );
}

export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-hairline bg-card shadow-soft", className)}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-surface/80 text-left text-muted-foreground">{children}</thead>;
}

export function TableRow({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr className={cn("border-t border-hairline/80 first:border-t-0", className)} {...props}>
      {children}
    </tr>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2.5 font-medium", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 text-ink", className)}>{children}</td>;
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-serif text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function IconButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
