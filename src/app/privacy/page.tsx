import type { Metadata } from "next";
import { SimplePageShell } from "@/components/SimplePageShell";

export const metadata: Metadata = {
  title: "Privacy - Car Compare",
  description: "What the Car Compare site stores in your browser and which third parties it contacts.",
  alternates: { canonical: "https://krool.github.io/CarCompare/privacy" },
};

const h2 = "text-lg font-semibold text-amber-400 mt-8 mb-2";
const link = "text-amber-500 hover:text-amber-400 underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <SimplePageShell>
      <h1 className="text-3xl font-bold text-white">Privacy</h1>
      <p className="text-gray-500 text-sm mt-1">Last updated: 2026-11-10</p>

      <div className="text-gray-300 text-sm leading-relaxed space-y-3 mt-6">
        <p>
          Car Compare is a free static website made by Krool. It has no accounts, no sign-in, no
          forms that send data to us, and no server of our own. This page lists what the site does
          with data.
        </p>

        <h2 className={h2}>Saved in your browser</h2>
        <p>
          The site keeps your settings in your browser's local storage so they are still there on
          your next visit. They stay on your device and are not sent to us:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>favorite cars and the compare list</li>
          <li>filters, visible columns and the mirror buffer setting</li>
          <li>the baseline car</li>
          <li>garage dimensions entered in the Garage Fit tool</li>
          <li>a flag that the setup wizard has been shown</li>
        </ul>
        <p>Clearing this site's data in your browser removes all of it.</p>

        <h2 className={h2}>Google Analytics</h2>
        <p>
          Every page loads Google Analytics (GA4) to count visits. It runs without a consent
          prompt. It sets cookies in your browser (named _ga and similar) and Google receives
          standard session data: the page
          address, referrer, device and browser type, and an approximate location derived from
          your IP address. The site sends no custom events.
        </p>
        <p>
          The page address includes the part after the question mark, which encodes the current
          view so it can be shared: filters, sort order, baseline, compare list, visible columns
          and any text in the search box. Analytics can therefore receive those values.
        </p>
        <p>
          A browser extension or setting that blocks analytics does not affect how the site works.
          Google's description of how it uses this data:{" "}
          <a
            className={link}
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            policies.google.com/technologies/partner-sites
          </a>
          .
        </p>

        <h2 className={h2}>Car images</h2>
        <p>
          Car pictures are loaded by your browser directly from IMAGIN.studio servers
          (cdn-01 to cdn-09.imagin.studio). Each request names the make, model, model year and
          powertrain of the car shown, and like any web request it reveals your IP address and
          browser type to IMAGIN.studio. Their policy:{" "}
          <a className={link} href="https://www.imagin.studio/privacy-policy" target="_blank" rel="noopener noreferrer">
            imagin.studio/privacy-policy
          </a>
          .
        </p>

        <h2 className={h2}>Hosting</h2>
        <p>
          The site is served by GitHub Pages. GitHub receives your IP address and request details
          as part of serving the pages. Fonts are served from the same host, not from Google
          Fonts.
        </p>

        <h2 className={h2}>Outbound links</h2>
        <p>
          The car detail view links to listing and search sites (Cars.com, Autotrader, CarGurus,
          Edmunds, KBB, TrueCar, CarMax, Google). Nothing is sent to them unless you click a link.
        </p>

        <h2 className={h2}>What the site does not do</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No accounts, names, email addresses or payment details are collected.</li>
          <li>No ads are shown.</li>
          <li>CSV export and the share link are created in your browser.</li>
        </ul>

        <h2 className={h2}>Changes</h2>
        <p>If this page changes, the date at the top changes with it.</p>

        <h2 className={h2}>Contact</h2>
        <p>
          Questions:{" "}
          <a className={link} href="mailto:kroolworld@proton.me">
            kroolworld@proton.me
          </a>
        </p>
      </div>
    </SimplePageShell>
  );
}
