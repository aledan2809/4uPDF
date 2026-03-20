import { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service - 4uPDF",
  description:
    "Read the terms and conditions for using 4uPDF online PDF tools. Understand your rights and responsibilities.",
  alternates: {
    canonical: "https://4updf.com/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: March 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using 4uPDF.com (&quot;Service&quot;), you agree to be bound by these
                Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not
                use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-300 leading-relaxed">
                4uPDF provides online PDF tools including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>PDF merging, splitting, and compression</li>
                <li>File format conversion (PDF to Word, Excel, images, etc.)</li>
                <li>PDF editing and annotation</li>
                <li>OCR (Optical Character Recognition)</li>
                <li>Smart document processing tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
              <p className="text-gray-300 leading-relaxed">By using our Service, you agree to:</p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>Use the Service only for lawful purposes</li>
                <li>Not upload files containing malware or viruses</li>
                <li>Not upload illegal, harmful, or offensive content</li>
                <li>Not attempt to circumvent usage limits or security measures</li>
                <li>Not use automated tools to access the Service without permission</li>
                <li>Respect intellectual property rights of others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. File Upload and Processing</h2>
              <p className="text-gray-300 leading-relaxed">When you upload files to our Service:</p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>You retain full ownership of your files</li>
                <li>Files are processed on our secure servers</li>
                <li>Files are automatically deleted after 1 hour</li>
                <li>We do not access, view, or share your file contents</li>
                <li>You are responsible for maintaining backups of your original files</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer of Warranties</h2>
              <p className="text-gray-300 leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT
                GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. WE
                ARE NOT RESPONSIBLE FOR ANY LOSS OF DATA OR FILES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, 4UPDF SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE
                SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about these Terms? Contact us at:
              </p>
              <p className="text-gray-300 mt-2">
                Email:{" "}
                <a href="mailto:legal@4updf.com" className="text-blue-400 hover:underline">
                  legal@4updf.com
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
