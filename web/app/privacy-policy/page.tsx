import { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy - 4uPDF",
  description:
    "Learn how 4uPDF collects, uses, and protects your personal information. Your privacy is our priority.",
  alternates: {
    canonical: "https://4updf.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: March 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                At 4uPDF.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to
                protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you visit our website and use our PDF tools.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <h3 className="text-xl font-medium text-white mt-6 mb-3">Files You Upload</h3>
              <p className="text-gray-300 leading-relaxed">
                When you use our PDF tools, you upload files to our servers for processing. These files
                are:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Processed securely on our servers</li>
                <li>Automatically deleted after 1 hour</li>
                <li>Never shared with third parties</li>
                <li>Never used for training AI models</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Usage Information</h3>
              <p className="text-gray-300 leading-relaxed">
                We automatically collect certain information when you visit our website, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>IP address (anonymized for analytics)</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent</li>
                <li>Referring website</li>
                <li>Device type and operating system</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Account Information</h3>
              <p className="text-gray-300 leading-relaxed">
                If you create an account, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Email address</li>
                <li>Name (optional)</li>
                <li>Payment information (processed securely via Stripe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-gray-300 leading-relaxed">We use the collected information to:</p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Provide and maintain our PDF tools</li>
                <li>Process your uploaded files</li>
                <li>Improve our services and user experience</li>
                <li>Send important service updates</li>
                <li>Respond to customer support requests</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>SSL/TLS encryption for all data transfers</li>
                <li>Secure server infrastructure</li>
                <li>Regular security audits</li>
                <li>Limited employee access to user data</li>
                <li>Automatic file deletion after processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-gray-300 leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
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
