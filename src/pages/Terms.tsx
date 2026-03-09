export default function Terms() {
  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p className="text-foreground font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
        <p>By accessing or using Traviso AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">2. Account Responsibilities</h2>
        <p>You are responsible for maintaining the security of your account credentials. You must provide accurate information and are responsible for all activity under your account.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">3. Creator Terms</h2>
        <p>Creators who publish trips agree to provide accurate, honest descriptions of their itineraries. Creators earn commission on bookings made through their published trips. Commission rates are set by Traviso AI and may be updated with notice.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">4. Booking & Payments</h2>
        <p>All bookings are subject to availability. Payments are processed securely through our payment provider. Refund policies vary by trip and are outlined at the time of booking.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">5. Prohibited Conduct</h2>
        <p>You may not use the platform to post misleading content, engage in fraud, harass other users, or violate any applicable laws. We reserve the right to suspend accounts that violate these terms.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">6. Intellectual Property</h2>
        <p>Content you create remains yours. By publishing on Traviso AI, you grant us a license to display and promote your content on the platform. The Traviso AI brand, design, and technology are our intellectual property.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">7. Limitation of Liability</h2>
        <p>Traviso AI provides a marketplace platform. We are not responsible for the quality or accuracy of individual trip itineraries. Travel involves inherent risks, and users are responsible for their own safety and travel insurance.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">8. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. Material changes will be communicated via email or platform notification.</p>
        
        <h2 className="font-display text-xl font-semibold text-foreground mt-8">9. Contact</h2>
        <p>Questions about these terms? Contact us at <a href="mailto:hello@traviso.ai" className="text-accent hover:underline">hello@traviso.ai</a>.</p>
      </div>
    </div>
  );
}
