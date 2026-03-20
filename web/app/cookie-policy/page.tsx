import { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy - 4uPDF",
  description:
    "Learn about how 4uPDF uses cookies and similar technologies to improve your experience.",
  alternates: {
    canonical: "https://4updf.com/cookie-policy",
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white mb-8">Cookie Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: March 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
              <p className="text-gray-300 leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. They help
                websites remember your preferences and improve your browsing experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Cookies</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Essential Cookies</h3>
              <p className="text-gray-300 leading-relaxed">
                These cookies are necessary for the website to function properly:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>User authentication and session management</li>
                <li>Security features and fraud prevention</li>
                <li>Load balancing and server optimization</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Functional Cookies</h3>
              <p className="text-gray-300 leading-relaxed">
                These cookies remember your preferences:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Language preferences</li>
                <li>Theme settings (dark/light mode)</li>
                <li>Recently used tools</li>
                <li>Processing preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Analytics Cookies</h3>
              <p className="text-gray-300 leading-relaxed">
                We use analytics cookies to understand how visitors interact with our website:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Pages visited and time spent</li>
                <li>Features used most frequently</li>
                <li>Error reports and performance data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Managing Cookies</h2>
              <p className="text-gray-300 leading-relaxed">
                Most browsers allow you to control cookies through their settings. You can view and
                delete existing cookies, block all cookies, or set preferences for specific websites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about our use of cookies? Contact us at:
              </p>
              <p className="text-gray-300 mt-2">
                Email:{" "}
                <a href="mailto:privacy@4updf.com" className="text-blue-400 hover:underline">
                  privacy@4updf.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
