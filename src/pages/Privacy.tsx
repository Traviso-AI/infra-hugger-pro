export default function Privacy() {
  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p className="text-foreground font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">1. Information We Collect</h2>
        <p>We collect information you provide directly: name, email address, profile information, and travel preferences. We also collect usage data including pages visited, features used, and device information.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
        <p>We use your information to provide and improve our services, personalize your experience, process bookings, communicate with you, and ensure platform security.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">3. Information Sharing</h2>
        <p>We do not sell your personal information. We may share information with service providers who assist in operating our platform, when required by law, or with your consent.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">4. Data Security</h2>
        <p>We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">5. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time through your account settings. You may also contact us to exercise your data rights.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies without your consent.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">7. Contact</h2>
        <p>For privacy-related questions, contact us at <a href="mailto:hello@traviso.ai" className="text-accent hover:underline">hello@traviso.ai</a>.</p>
      </div>
    </div>
  );
}
