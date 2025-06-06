import type { Metadata } from "next";
import { Montserrat, Raleway } from "next/font/google";
import "./globals.css";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import PartnerLogos from "@/src/app/components/PartnerLogos";
import ApplyButton from "@/src/app/components/ApplyButton";
import Script from "next/script";

// Initialize fonts
const montserrat = Montserrat({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-montserrat',
});

const raleway = Raleway({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-raleway',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://epsilonhellas.com'),
  title: {
    default: "Epsilon Hellas | Dedicated, Quality Crew Management & Training",
    template: "%s | Epsilon Hellas"
  },
  description: "Epsilon Hellas provides dedicated crew management, manning and training services. We enhance operational efficiency through exceptional maritime talent management.",
  keywords: [
    "crew management",
    "maritime training",
    "crew manning",
    "shipping services",
    "maritime education",
    "seafaring",
    "vessel management"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://epsilonhellas.com",
    title: "Epsilon Hellas | Maritime Crew Management & Training",
    description: "Dedicated crew management, manning and training services for the maritime industry with a global presence.",
    siteName: "Epsilon Hellas",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Epsilon Hellas - Maritime Crew Management"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Epsilon Hellas | Maritime Crew Management",
    description: "Professional crew management, manning and training services",
    images: ["/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: "https://epsilonhellas.com"
  },
  authors: [{ name: "Epsilon Hellas" }],
  creator: "Epsilon Hellas",
  publisher: "Epsilon Hellas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${raleway.variable}`}>
      <body className="antialiased text-justify">
        {/* Google Tag Manager - Script */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MRCJH26R');
          `}
        </Script>

        {/* Google Tag Manager - NoScript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MRCJH26R"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>

        <Header />
        <main className="text-justify">
          {children}
        </main>
        <div className="h-12 sm:h-16"></div>
        <Footer />
        <div className="bg-white py-4 sm:py-6">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm sm:text-base mb-3 sm:mb-4">
              Epsilon operations powered by:
            </p>
            <PartnerLogos />
          </div>
        </div>
        <ApplyButton />

        {/* Structured data for organization */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Epsilon Hellas',
              url: 'https://epsilonhellas.com',
              logo: 'https://epsilonhellas.com/logo.png',
              sameAs: [
                'https://www.facebook.com/epsiloncrew'
              ],
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  telephone: '+357 25266050',
                  contactType: 'customer service',
                  areaServed: 'Worldwide',
                  availableLanguage: ['English', 'Greek']
                }
              ],
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'MITERA Building, 1st Floor, 113-115 Vasileos Konstantinou Str.',
                addressLocality: 'Limassol',
                postalCode: '3080',
                addressCountry: 'Cyprus'
              }
            })
          }}
        />
      </body>
    </html>
  );
}