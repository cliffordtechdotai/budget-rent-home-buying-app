export const metadata = {
  title: 'Privacy Policy | House Planner',
  description: 'Our privacy policy and data practices.',
};

export default function Privacy() {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <div className="hint" style={{ margin: '0 0 32px', fontSize: '15px', lineHeight: '1.7' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div className="writeup" style={{ fontSize: '14px', lineHeight: '1.8', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>1. Overview</h2>
        <p>
          <strong>House Planner is built on a simple principle: your financial data is yours alone.</strong> All calculations run entirely in your browser. We don't store your data, send it to our servers, or track you across the web. This policy explains how the site works and what limited data practices may apply.
        </p>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>2. What Data We Collect</h2>
        <p>
          <strong>Client-side calculations:</strong> When you use the calculator, all inputs (income, expenses, debt, goals, mortgage details) stay on your device. We cannot see them.
        </p>
        <p>
          <strong>Browser storage:</strong> The app saves your inputs to your browser's local storage so you can reload the page and continue where you left off. This file is never sent to a server and is only accessible by you on that device.
        </p>
        <p>
          <strong>File downloads/uploads:</strong> You can save and load your data as JSON files on your computer. This is your file—we have no access to it.
        </p>
        <p>
          <strong>Server logs:</strong> Our hosting provider (Vercel) may log that you visited the site (standard HTTP logs: IP, timestamp, page requested). These logs are not used for tracking you personally and are retained per Vercel's standard practices.
        </p>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>3. What We Do NOT Do</h2>
        <ul style={{ marginLeft: '20px' }}>
          <li>We do not use analytics, tracking pixels, or third-party trackers.</li>
          <li>We do not store or process your financial inputs on a server.</li>
          <li>We do not sell or share your data with anyone.</li>
          <li>We do not use cookies for tracking. (Standard session cookies for site function only, if any.)</li>
          <li>We do not build a profile of your behavior or send data to ad networks.</li>
        </ul>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>4. Ads and Affiliate Links (Future)</h2>
        <p>
          House Planner may display ads or affiliate links in the future to support development. When that happens:
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Ads will be served by a third-party network (likely Google AdSense or similar).</li>
          <li>That network may use cookies or other tracking to personalize ads and measure performance.</li>
          <li>Affiliate links may set cookies to track clicks and purchases for commission purposes.</li>
          <li>We will update this policy with specifics before that goes live. Your data from the calculator will not be shared with ad networks.</li>
        </ul>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>5. Security</h2>
        <p>
          Because we don't store your data, there's no database to hack or breach. Your information is only at risk if someone gains physical access to your device or network. We recommend:
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Use a modern, up-to-date browser.</li>
          <li>Visit over HTTPS (which you are; look for the lock icon in your browser).</li>
          <li>If saving data to a file, keep that file secure like any sensitive document.</li>
        </ul>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>6. Third-Party Links</h2>
        <p>
          This site may link to external resources (articles, calculators, financial institutions). We are not responsible for their privacy practices. Always read their policies before entering any data.
        </p>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>7. Changes to This Policy</h2>
        <p>
          If we make material changes to how we handle data, we'll update this page and note the date above. Major changes will be announced clearly.
        </p>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>8. Disclaimer</h2>
        <p>
          <strong>This calculator is a planning tool, not financial or tax advice.</strong> Estimates are based on current tax brackets, rates, and assumptions that may change. Always consult a tax professional or financial advisor before making major decisions.
        </p>

        <h2 style={{ marginTop: '32px', fontSize: '18px', fontWeight: '600' }}>9. Questions?</h2>
        <p>
          If you have questions about this privacy policy or how House Planner works, reach out via our{' '}
          <a href="https://github.com/cliffordtechdotai/budget-rent-home-buying-app/issues" target="_blank" rel="noopener noreferrer">
            GitHub issues
          </a>.
        </p>
      </div>
    </div>
  );
}
