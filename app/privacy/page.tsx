import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & legal notice · EthiScore",
};

// GDPR art. 13 and the French LCEN (mentions légales) require the person responsible for
// the site to be identified.
const OPERATOR_NAME = "Jérémie O'BRIEN";
const LAST_UPDATED = "6 October 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-ink-primary">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-secondary">{children}</div>
    </section>
  );
}

function Mail({ address }: { address: string }) {
  return (
    <a href={`mailto:${address}`} className="font-medium text-ink-primary underline">
      {address}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold text-ink-primary">Privacy &amp; legal notice</h1>
      <p className="mb-10 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

      <Section title="In short">
        <ul className="list-disc space-y-1 pl-5">
          <li>We collect only what&rsquo;s needed to run your account: your email address and the criteria sets and evaluations you create.</li>
          <li>Your Anthropic API key stays in your browser. It is sent with each evaluation and never stored or logged on our servers.</li>
          <li>No advertising, no analytics, no tracking, and we never sell or share your data for marketing.</li>
          <li>You can ask us at any time to see, correct, export or delete your data.</li>
        </ul>
      </Section>

      <Section title="Who is responsible">
        <p>
          EthiScore is a personal, non-commercial project run by {OPERATOR_NAME}, an individual based in
          France, who is the data controller for the personal data described here.
        </p>
        <p>
          Privacy questions and requests: <Mail address="privacy@advitam.dev" />. General contact:{" "}
          <Mail address="hello@advitam.dev" />.
        </p>
      </Section>

      <Section title="What we collect and why">
        <p>
          <strong className="text-ink-primary">Your email address</strong>, to create your account and send
          you sign-in links. We email you only when you ask for a sign-in link: no newsletters or marketing.
        </p>
        <p>
          <strong className="text-ink-primary">Your criteria sets and evaluations</strong> (company names,
          criteria, scores, explanations and sources), so you can find them again. They are private to your
          account: other users cannot see them.
        </p>
        <p>
          <strong className="text-ink-primary">Technical data</strong> such as IP addresses, browser type and
          sign-in times, which our hosting, sign-in and email providers record in their logs for security
          and to keep the service running.
        </p>
        <p>
          Legal basis: providing the service you signed up for (GDPR art. 6(1)(b)), and our legitimate
          interest in keeping the service secure and free of abuse (art. 6(1)(f)) for technical logs and bot
          protection.
        </p>
      </Section>

      <Section title="Your Anthropic API key">
        <p>
          Evaluations run on your own Anthropic account. Your key is kept in your browser&rsquo;s storage: for
          the current tab only, or on this device if you tick &ldquo;remember on this device&rdquo;. It is sent
          over an encrypted connection with each evaluation, passed to Anthropic for that request, and never
          stored or logged by us. You can remove it at any time with &ldquo;Change or forget key&rdquo;.
        </p>
        <p>
          When you run an evaluation, the company name and your criteria are sent to Anthropic using your
          key, under your own agreement with Anthropic. Its handling of that data is governed by Anthropic&rsquo;s
          terms and privacy policy, not ours.
        </p>
      </Section>

      <Section title="Cookies and browser storage">
        <p>
          We use only what&rsquo;s strictly necessary for the site to work, so no consent banner is required:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sign-in cookies, which keep you signed in.</li>
          <li>Browser storage for your API key (see above) and for an unfinished evaluation form, so it survives moving between pages.</li>
          <li>Cloudflare Turnstile, which checks that sign-in requests come from a person rather than a bot.</li>
        </ul>
      </Section>

      <Section title="Who processes your data">
        <p>We rely on these providers to run EthiScore:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-ink-primary">Supabase</strong>: database and sign-in. Data stored in Ireland (EU).</li>
          <li><strong className="text-ink-primary">Vercel</strong>: website hosting.</li>
          <li><strong className="text-ink-primary">Amazon Web Services (Amazon SES)</strong>: sending sign-in emails, from Sweden (EU).</li>
          <li><strong className="text-ink-primary">Cloudflare</strong>: domain name, email forwarding and bot protection.</li>
        </ul>
        <p>
          Some of these companies are based in the United States and may access data from there. Such
          transfers rely on the EU–US Data Privacy Framework or the European Commission&rsquo;s standard
          contractual clauses.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Your account and its data are kept until you ask us to delete them. We act on deletion requests
          within 30 days. Providers&rsquo; technical logs are kept for the short periods set by each provider.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask to access, correct, export or delete your data, or object to or restrict how it is
          used, by writing to <Mail address="privacy@advitam.dev" />. We reply within one month.
        </p>
        <p>
          If you believe your data is being mishandled, you can complain to the French data-protection
          authority, the CNIL (
          <a href="https://www.cnil.fr" className="underline" target="_blank" rel="noreferrer">
            cnil.fr
          </a>
          ), or to the authority in your own EU country.
        </p>
        <p>EthiScore is not intended for anyone under 15.</p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, we update this page and the date at the top. For significant changes, we
          will tell you by email.
        </p>
      </Section>

      <Section title="Legal notice (mentions légales)">
        <p>
          <strong className="text-ink-primary">Publisher:</strong> {OPERATOR_NAME}, individual, France.
          Contact: <Mail address="hello@advitam.dev" />.
        </p>
        <p>
          <strong className="text-ink-primary">Host:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina,
          CA 91723, United States (vercel.com).
        </p>
      </Section>
    </main>
  );
}
