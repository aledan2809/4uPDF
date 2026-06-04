import type { Metadata } from "next";

// The dashboard is a per-user, auth-gated page — keep it out of search indexes.
// Pass-through layout (no chrome of its own; the page renders Navbar/Footer)
// so this does not double the chrome (cf. L208).
export const metadata: Metadata = {
  title: "Dashboard — 4uPDF",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
