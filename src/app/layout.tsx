import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Car Compare - Find Cars That Fit Your Garage",
  description: "Compare cars by dimensions, price, fuel type, and more. Find vehicles that fit your garage and family needs.",
  metadataBase: new URL("https://krool.github.io/CarCompare"),
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SXG8M67HPV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SXG8M67HPV');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
