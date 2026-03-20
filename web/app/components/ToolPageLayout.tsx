"use client";
import { ReactNode } from "react";
import Link from "next/link";
import FAQAccordion from "./FAQAccordion";
import FAQSchema from "./FAQSchema";
import AdsBanner, { SponsoredBanner } from "./AdsBanner";
import { UsageBanner } from "./UpgradePrompt";

interface FAQItem {
  question: string;
  answer: string;
}

interface RelatedTool {
  name: string;
  href: string;
  description: string;
}

interface HowItWorksStep {
  title: string;
  description: string;
}

interface ToolPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  howItWorks?: HowItWorksStep[];
  benefits?: string[];
  faqs?: FAQItem[];
  relatedTools?: RelatedTool[];
}

const defaultHowItWorks: HowItWorksStep[] = [
  {
    title: "Upload Your File",
    description: "Drag and drop your PDF file or click to browse. We support files up to 50MB.",
  },
  {
    title: "Process Your File",
    description: "Configure your settings and let our tool do the work. Processing takes just seconds.",
  },
  {
    title: "Download Result",
    description: "Your processed file is ready instantly. Download with a single click.",
  },
];

const defaultBenefits = [
  "100% free for basic usage",
  "No registration required",
  "Secure processing - files deleted after 1 hour",
  "Works on any device - desktop, tablet, or mobile",
  "Fast processing with powerful servers",
  "No software installation needed",
];

export default function ToolPageLayout({
  title,
  description,
  children,
  howItWorks = defaultHowItWorks,
  benefits = defaultBenefits,
  faqs = [],
  relatedTools = [],
}: ToolPageLayoutProps) {
  return (
    <>
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">{description}</p>
          </div>
        </div>
      </section>

      {/* Tool Upload Area */}
      <section className="py-8 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <UsageBanner />
          <AdsBanner placement="top" />
          {children}
          <SponsoredBanner />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Use 4uPDF */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Why Use 4uPDF?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-16 bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white text-center mb-10">
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={faqs} />
          </div>
        </section>
      )}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="py-16 bg-gray-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white text-center mb-10">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500 transition-colors group"
                >
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need More PDF Tools?</h2>
          <p className="text-blue-100 mb-6">
            Explore our complete suite of 40+ free PDF tools.
          </p>
          <Link
            href="/#tools"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            View All Tools
          </Link>
        </div>
      </section>
    </>
  );
}
