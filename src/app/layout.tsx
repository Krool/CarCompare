import type { Metadata } from "next";
import { Outfit, DM_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Car Compare - Find Cars That Fit Your Garage",
  description: "Compare cars by dimensions, price, fuel type, and more. Find vehicles that fit your garage and family needs.",
  metadataBase: new URL("https://krool.github.io/CarCompare"),
  alternates: { canonical: "https://krool.github.io/CarCompare/" },
  openGraph: {
    type: "website",
    url: "https://krool.github.io/CarCompare/",
    title: "Car Compare - Find Cars That Fit Your Garage",
    description: "Compare cars by dimensions, price, fuel type, and more. Find vehicles that fit your garage and family needs.",
    images: [{ url: "/og-preview.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Compare - Find Cars That Fit Your Garage",
    description: "Compare cars by dimensions, price, fuel type, and more. Find vehicles that fit your garage and family needs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${dmMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context":"https://schema.org","@type":"WebApplication","name":"Car Compare","url":"https://krool.github.io/CarCompare/","description":"Compare cars by dimensions, price, fuel type, and more. Find vehicles that fit your garage and family needs.","applicationCategory":"UtilityApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SXG8M67HPV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SXG8M67HPV', { content_group: 'Car Compare' });
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
