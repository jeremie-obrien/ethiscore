import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & legal notice",
};

// GDPR art. 13 and the French LCEN (mentions légales) require the person responsible for
// the site to be identified.
const OPERATOR_NAME = "Jérémie O'BRIEN";
const LAST_UPDATED = "8 October 2026";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-20">
      <h2 className="mb-2 text-lg font-semibold tracking-tight">{title}</h2>
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
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Privacy &amp; legal notice</h1>
      <p className="mb-10 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

      <Section title="In short">
        <ul className="list-disc space-y-1 pl-5">
          <li>We collect only what&rsquo;s needed to run your account: your email address and the criteria sets and evaluations you create.</li>
          <li>Each month you get a few free evaluations; after that, you can use your own Anthropic API key, which stays in your browser and is never stored or logged on our servers.</li>
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
          <strong className="text-ink-primary">Free evaluation records</strong>, to stop the free allowance from
          being abused (for example with many accounts). For each free evaluation we record when it happened and
          scrambled (keyed-hash) versions of your email address, your network address (your IP address, or for
          IPv6 the block your provider assigned) and a random browser identifier. These can&rsquo;t be read back as
          the original values. They are deleted after about two months.
        </p>
        <p>
          Legal basis: providing the service you signed up for (GDPR art. 6(1)(b)), and our legitimate
          interest in keeping the service secure and free of abuse (art. 6(1)(f)) for technical logs, bot
          protection and free evaluation records.
        </p>
      </Section>

      <Section title="Evaluations and your Anthropic API key">
        <p>
          <strong className="text-ink-primary">Free evaluations</strong> run on EthiScore&rsquo;s own Anthropic
          account: the company name and your criteria are sent to Anthropic, which processes them on our behalf to
          produce the evaluation.
        </p>
        <p>
          <strong className="text-ink-primary">With your own key</strong>, evaluations run on your Anthropic
          account. Your key is kept in your browser&rsquo;s storage: for
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

      <Section id="cookies" title="Cookies and browser storage">
        <p>
          We use only what&rsquo;s strictly necessary for the site to work and to keep it secure, so no consent
          is required. No analytics, advertising or tracking cookies.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sign-in cookies, which keep you signed in.</li>
          <li>
            A random browser identifier (<code>es_bid</code>, kept up to 400 days), used only to prevent abuse of free
            evaluations.
          </li>
          <li>Browser storage for your API key (see above), an unfinished evaluation form, and whether you&rsquo;ve dismissed the cookie notice.</li>
          <li>Cloudflare Turnstile, which checks that sign-in requests come from a person rather than a bot.</li>
        </ul>
      </Section>

      <Section title="Who processes your data">
        <p>We rely on these providers to run EthiScore:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-ink-primary">Supabase</strong>: database and sign-in. Data stored in Ireland (EU).</li>
          <li><strong className="text-ink-primary">Vercel</strong>: website hosting.</li>
          <li><strong className="text-ink-primary">Amazon Web Services (Amazon SES)</strong>: sending sign-in emails, from Sweden (EU).</li>
          <li><strong className="text-ink-primary">Anthropic</strong>: running free evaluations (company names and criteria only).</li>
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
          within 30 days. Free evaluation records are deleted after about two months. Providers&rsquo; technical
          logs are kept for the short periods set by each provider.
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
