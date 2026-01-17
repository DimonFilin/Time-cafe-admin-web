export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))]">
      <div className="mx-auto max-w-[1224px] px-4 py-6 text-xs text-[rgb(var(--tc-muted))]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} TimeCaffe</span>
          <span className="font-mono">admin-web</span>
        </div>
      </div>
    </footer>
  );
}
