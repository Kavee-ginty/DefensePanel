export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="no-print border-t border-zinc-800/80 bg-zinc-950 py-6 text-center"
      role="contentinfo"
    >
      <p className="text-xs text-zinc-500">
        Defense Panel · © {year}
      </p>
    </footer>
  );
}
