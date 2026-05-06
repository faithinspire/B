export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p>Last updated: March 2024</p>
          <h2>1. Introduction</h2>
          <p>BraidMe ("we", "us", "our") operates the BraidMe platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service.</p>
          
          <h2>2. Information Collection</h2>
          <p>We collect information you provide directly, including:</p>
          <ul>
            <li>Account information (name, email, phone)</li>
            <li>Payment information (processed securely via Stripe)</li>
            <li>Location data (for service matching)</li>
            <li>Identity verification data (via Persona)</li>
          </ul>

          <h2>3. Data Usage</h2>
          <p>We use collected data to:</p>
          <ul>
            <li>Provide and maintain our service</li>
            <li>Process payments and transactions</li>
            <li>Send service-related notifications</li>
            <li>Verify user identity and prevent fraud</li>
            <li>Improve our platform</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data, including encryption, secure authentication, and regular security audits.</p>

          <h2>5. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at privacy@braidme.com</p>
        </div>
      </div>
    </div>
  );
}
