import StageShell from "./StageShell";
import { ArrowLeft } from "lucide-react";

const faqItems = [
  {
    question: "What is REACHOUT for?",
    answer:
      "REACHOUT is a tool for community organising, campaigning, and member outreach. It helps people send personalised texts, WhatsApp messages, emails, and make phone calls to supporters, neighbours, tenants, or members. It is designed for relational organising rather than mass spam. The idea is that conversations between real people matter. A message from a volunteer, organiser, or fellow member is often far more effective than an automated blast.",
  },
  {
    question: "Who is REACHOUT built for?",
    answer:
      "REACHOUT is mainly designed for grassroots organisations, tenants' unions, campaign groups, and volunteer-led organising projects. It works best for groups that want to coordinate outreach while still keeping a human, conversational approach. It is especially useful for phonebanks, turnout work, follow-ups, surveys, member check-ins, and local campaigns.",
  },
  {
    question: "Who built REACHOUT?",
    answer:
      "REACHOUT was built independently by a Living Rent member after years of organising and campaigning work. It was designed around the practical realities of grassroots organising, especially the need for tools that are low-cost, easy to use, and do not require large technical teams or expensive infrastructure.",
  },
  {
    question: "How do the pre-filled links work?",
    answer:
      "REACHOUT uses compressed pre-filled links to transfer outreach sessions between devices. When you create a session on desktop, the contact data and message templates are compressed into a link which can then be opened on a phone or shared with volunteers. This avoids the need for accounts, logins, or a large backend system, and keeps the tool lightweight and cheap to run.",
  },
  {
    question: "What happens to my contact data?",
    answer:
      "REACHOUT is designed to avoid storing large amounts of organiser data on central servers. In most cases, the data is transferred directly through the pre-filled links themselves. However, this does mean the links contain the underlying data in compressed form. They are not magically secure or encrypted to a military standard. Anyone with access to the link may be able to access the session data. Organisers should be careful about where links are shared, only send them to trusted people, and ask volunteers to delete links after use. Sensitive or high-risk personal data should be handled with particular care.",
  },
  {
    question: "Why not just build a fully centralised system?",
    answer:
      "Partly because of cost. Fully centralised outreach systems with accounts, databases, syncing, and secure infrastructure are expensive to run and maintain. Keeping REACHOUT lightweight means it can remain free or very low-cost for organisers and grassroots groups. But it is also a political and organising choice. REACHOUT is built around the idea that outreach should feel human. Instead of replacing organisers with automation, it tries to support conversations between real people and strengthen relationships within campaigns and communities.",
  },
  {
    question: "How do I send a phonebank to my phone?",
    answer:
      "Once you have set up your outreach session on desktop, REACHOUT generates a pre-filled link or QR code. Open the link on your phone, or scan the QR code, and the contacts and templates will load into the mobile version of the tool. From there, you can text, message, or call people directly from your phone.",
  },
  {
    question: "Can I use REACHOUT with a group?",
    answer:
      "Yes. Outreach sessions can be shared with volunteers or organisers using the generated links. Many groups use REACHOUT for distributed phonebanks, textbanks, turnout drives, and local organising. If you are sharing sessions with others, make sure everyone understands how the links work and handles supporter data responsibly.",
  },
];

export default function FaqPage({ onBack }) {
  return (
    <StageShell
      stageNumLabel="FAQ"
      title="FREQUENTLY ASKED QUESTIONS"
      accentPhrase="QUESTIONS"
      accentVariant={1}
      subtitle="How does this work?"
      allowOverflow
    >
      {onBack && (
        <button type="button" onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to REACHOUT
        </button>
      )}
      <div style={styles.list}>
        {faqItems.map((item) => (
          <article key={item.question} style={styles.item}>
            <h3 style={styles.question}>{item.question}</h3>
            <p style={styles.answer}>{item.answer}</p>
          </article>
        ))}
      </div>
    </StageShell>
  );
}

const styles = {
  backBtn: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--ta-green)",
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.35)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  item: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "16px",
  },
  question: {
    color: "var(--ta-green)",
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    margin: "0 0 8px",
  },
  answer: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.5,
    margin: 0,
  },
};
