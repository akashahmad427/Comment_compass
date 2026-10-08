import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";

const faqs = [
  {
    category: "Getting started",
    items: [
      { q: "Is Comment Compass free to use?", a: "Yes! The free plan gives you 5 analyses per day with up to 500 comments per video. No credit card required to sign up." },
      { q: "How do I analyze a video?", a: "Simply paste any YouTube video URL into the analyzer on your dashboard and click 'Analyze comments'. Results are ready in under 60 seconds." },
      { q: "Do I need a YouTube account?", a: "No. You only need a Comment Compass account. We use the YouTube Data API to fetch comments — you don't need to connect your YouTube channel." },
    ],
  },
  {
    category: "Analysis & results",
    items: [
      { q: "How does the sentiment analysis work?", a: "We use VADER (Valence Aware Dictionary and sEntiment Reasoner), a rule-based sentiment analysis tool specifically tuned for social media text. It's fast, free, and works well for short comments." },
      { q: "How many comments are analyzed?", a: "The free plan analyzes up to 500 comments per video. The Pro plan goes up to 2,000. Comments are fetched by relevance (most-liked first) so you always get the most impactful ones." },
      { q: "Are results cached?", a: "Yes. If you analyze the same video within 24 hours, we return the cached result to save your daily quota. This also makes repeat lookups instant." },
      { q: "Can I analyze any YouTube video?", a: "You can analyze any public video with comments enabled. Videos with comments turned off, private videos, or age-restricted videos cannot be analyzed." },
    ],
  },
  {
    category: "Account & billing",
    items: [
      { q: "What happens when I hit the daily limit?", a: "On the free plan, you can run 5 analyses per 24-hour window. The counter resets at the same time you ran your first analysis. Upgrade to Pro for unlimited analyses." },
      { q: "Can I cancel my Pro subscription anytime?", a: "Yes, you can cancel at any time from your account settings. You'll keep Pro access until the end of your billing period." },
      { q: "Is my data secure?", a: "Yes. We store only the analysis results, not the raw comments. All data is encrypted at rest and in transit. We never sell your data." },
    ],
  },
  {
    category: "Technical",
    items: [
      { q: "What YouTube API quota does this use?", a: "Each video analysis uses approximately 10 YouTube API quota units (1 for metadata + up to 5 for comment pages). The free YouTube API quota is 10,000 units/day, which supports ~1,000 analyses." },
      { q: "Can I use Comment Compass via API?", a: "API access is available on the Agency plan. Contact us for documentation and rate limits." },
      { q: "Does it work with YouTube Shorts?", a: "Yes! We support all YouTube URL formats including Shorts, live streams, and standard videos." },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)}>
        {q}
        <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>
      <div className={`faq-answer${open ? " open" : ""}`}>
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="badge badge-accent mb-3">FAQ</div>
          <h1 style={{ marginBottom: "1rem" }}>Frequently asked <span className="grad">questions</span></h1>
          <p style={{ maxWidth: "44ch", margin: "0 auto", fontSize: "1.05rem" }}>
            Everything you need to know about Comment Compass. Can't find your answer?{" "}
            <Link to="/contact" style={{ color: "var(--accent2)", fontWeight: 600 }}>Contact us.</Link>
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          {faqs.map(group => (
            <div key={group.category} style={{ marginBottom: "2.5rem" }}>
              <h3 style={{ marginBottom: "1rem", color: "var(--accent2)", fontSize: ".9rem", textTransform: "uppercase", letterSpacing: ".06em" }}>
                {group.category}
              </h3>
              {group.items.map(item => <FaqItem key={item.q} {...item} />)}
            </div>
          ))}

          <div className="cta-section" style={{ marginTop: "3rem" }}>
            <h3 style={{ marginBottom: ".5rem" }}>Still have questions?</h3>
            <p style={{ marginBottom: "1.5rem" }}>Our team is happy to help.</p>
            <Link to="/contact" className="btn btn-primary">
              Contact us <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
