import type { Metadata } from "next";
import Link from "next/link";
import { SimplePageShell } from "@/components/SimplePageShell";

export const metadata: Metadata = {
  title: "Page not found - Car Compare",
};

export default function NotFound() {
  return (
    <SimplePageShell>
      <p className="text-amber-500 text-sm font-mono tracking-wide">404</p>
      <h1 className="text-3xl font-bold text-white mt-2">Page not found</h1>
      <p className="text-gray-300 mt-4">
        There is nothing at this address. The comparison table is on the home page.
      </p>
      <Link href="/" className="btn-accent inline-block px-4 py-2 rounded-lg text-sm mt-6">
        Go to CarCompare
      </Link>
    </SimplePageShell>
  );
}
