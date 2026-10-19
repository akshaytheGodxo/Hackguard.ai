"use client";

import { useState } from "react";
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Boxes,
    Check,
    ChevronDown,
    CircleHelp,
    ClipboardCheck,
    Code2,
    FileCheck2,
    FileSearch2,
    Gauge,
    HeartHandshake,
    LockKeyhole,
    Play,
    ScanSearch,
    Shield,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
    Video,
    Waypoints,
    Workflow,
    Zap,
} from "lucide-react";
import Navbar from "./landing/Navbar";

const Github = Code2;

const pipelineTabs = ["Code", "Sandbox", "Integrity", "Pitch deck", "Video"] as const;
type PipelineTab = (typeof pipelineTabs)[number];

const pipelineContent: Record<PipelineTab, { icon: typeof Code2; label: string; title: string; copy: string; lines: string[]; result: string }> = {
    Code: {
        icon: Code2,
        label: "REPOSITORY ANALYSIS",
        title: "A reviewer for every repo.",
        copy: "Architecture, code quality, and technical originality assessed against your rubric.",
        lines: ["$ hackguard analyze ./submission", "Scanning 148 files across 12 modules...", "Architecture clarity       91 / 100", "Test coverage              86 / 100", "Originality signals        94 / 100"],
        result: "Analysis complete",
    },
    Sandbox: {
        icon: Boxes,
        label: "ISOLATED EXECUTION",
        title: "Run it. Don’t risk it.",
        copy: "Each submission builds inside a disposable, network-restricted environment.",
        lines: ["$ sandbox run --submission #042", "Allocating isolated container...", "Dependencies installed       4.2s", "Test suite            38 passed", "Peak memory               128 MB"],
        result: "Build passed",
    },
    Integrity: {
        icon: ScanSearch,
        label: "INTEGRITY REVIEW",
        title: "Signals, not accusations.",
        copy: "Surface similarities and suspicious commit patterns for a human to review.",
        lines: ["$ hackguard integrity --team 042", "Comparing against 327 submissions...", "Code similarity             8.3%", "Commit cadence          consistent", "Review flags                  none"],
        result: "No flags raised",
    },
    "Pitch deck": {
        icon: FileCheck2,
        label: "DOCUMENT REVIEW",
        title: "The story behind the build.",
        copy: "Evaluate clarity, problem framing, and feasibility without losing the human story.",
        lines: ["$ hackguard review pitch.pdf", "Extracting 12 slides...", "Problem definition       4.8 / 5", "Solution feasibility     4.4 / 5", "Impact narrative         4.7 / 5"],
        result: "Deck reviewed",
    },
    Video: {
        icon: Video,
        label: "DEMO REVIEW",
        title: "See the product in motion.",
        copy: "Transcribe and analyze product demos for completeness, usability, and delivery.",
        lines: ["$ hackguard review demo.mp4", "Transcribing 02:14 demo...", "Core flow demonstrated      yes", "Accessibility signals       6 found", "Demo completeness        92 / 100"],
        result: "Demo reviewed",
    },
};

const features = [
    { icon: Sparkles, title: "Multi-modal AI scoring", copy: "One consistent review across code, pitch decks, and demo videos, mapped to your rubric." },
    { icon: Boxes, title: "Isolated execution sandboxes", copy: "Build, test, and measure submissions in disposable environments that keep your infrastructure safe." },
    { icon: ScanSearch, title: "Integrity signals", copy: "Review code similarity and commit history with transparent flags, never unexplained verdicts." },
    { icon: SlidersIcon, title: "Rubrics that fit your event", copy: "Set weighted criteria for technical depth, design, impact, and originality." },
    { icon: Activity, title: "Live leaderboards", copy: "Give teams and judges a clear view of standings as verified reviews come in." },
    { icon: Workflow, title: "One event portal", copy: "Manage registration, team matching, mentor check-ins, submissions, and prizes together." },
];

const problems = [
    { number: "01", icon: Users, title: "Judge overload", copy: "Hundreds of projects, a handful of judges, and no reliable way to keep scoring consistent." },
    { number: "02", icon: FileSearch2, title: "Unclear originality", copy: "Pre-built work and copied code are hard to spot when every repo needs a manual review." },
    { number: "03", icon: Waypoints, title: "Tool sprawl", copy: "Forms, spreadsheets, chat threads, and submission portals that never quite connect." },
];

const steps = [
    { number: "01", icon: ClipboardCheck, title: "Set up your event", copy: "Create your event, add tracks, and tune a weighted judging rubric." },
    { number: "02", icon: Users, title: "Bring teams together", copy: "Participants register, find teammates, check in with mentors, and submit." },
    { number: "03", icon: Zap, title: "Review every entry", copy: "Automated checks analyze each repository, build, deck, and demo." },
    { number: "04", icon: Trophy, title: "Decide and celebrate", copy: "Judges review evidence, finalize results, and publish the leaderboard." },
];

const faqs = [
    { question: "Does AI make the final decision?", answer: "No. HackGuard AI organizes evidence, scores against the rubric, and flags items for review. Organizers and judges make every final decision." },
    { question: "How do you keep submitted code safe?", answer: "Code runs in isolated, disposable sandboxes with restricted network access. A submission cannot access other teams’ environments or your event data." },
    { question: "Can we use our own judging criteria?", answer: "Yes. Build a weighted rubric around your event’s priorities, such as technical complexity, usability, impact, and originality." },
    { question: "Is HackGuard AI suitable for smaller events?", answer: "Absolutely. Use the same event portal and evaluation workflow for a campus weekend or a multi-track global competition." },
];

function SlidersIcon({ size = 20 }: { size?: number }) {
    return <Gauge size={size} />;
}

export default function Landing() {
    const [lightMode, setLightMode] = useState(false);
    const [activeTab, setActiveTab] = useState<PipelineTab>("Code");
    const activePipeline = pipelineContent[activeTab];
    const PipelineIcon = activePipeline.icon;

    return (
        <div className="landing" data-theme={lightMode ? "light" : "dark"}>
            <Navbar lightMode={lightMode} onToggleTheme={() => setLightMode((current) => !current)} />

            <main>
                <section className="hero section-wrap" id="top">
                    <div className="hero-copy">
                        <div className="eyebrow"><span className="eyebrow-pulse" /> AI-POWERED JUDGING, HUMAN-APPROVED DECISIONS</div>
                        <h1>Host hackathons you can trust.<br /><span>Judge them in minutes.</span></h1>
                        <p className="hero-description">One platform for secure submissions and faster, fairer evaluation. Run code in isolated sandboxes, review every format with AI, and keep final decisions with your judges.</p>
                        <div className="hero-actions">
                            <a className="button button-primary" href="#host">Host a Hackathon <ArrowRight size={16} /></a>
                            <a className="button button-secondary" href="#pipeline"><Play size={15} fill="currentColor" /> View Live Demo</a>
                        </div>
                        <div className="hero-proof"><div className="avatar-stack"><span>U</span><span>⚡</span><span>&lt;/&gt;</span><span>+</span></div><p><strong>Built for the builders behind the build.</strong><br />Universities, startups, and developer communities</p></div>
                    </div>

                    <div className="dashboard-wrap" aria-label="HackGuard evaluation dashboard preview">
                        <div className="dashboard-glow" />
                        <div className="dashboard-card">
                            <div className="dashboard-topbar"><div className="window-dots"><i /><i /><i /></div><span>HACKGUARD / EVENT OVERVIEW</span><button aria-label="More dashboard options"><span /><span /><span /></button></div>
                            <div className="dashboard-heading"><div><span className="mono-label">NORTHSTAR BUILD WEEKEND</span><h2>Live evaluation</h2></div><span className="live-pill"><i /> LIVE</span></div>
                            <div className="dashboard-metrics"><div><span>SUBMISSIONS</span><strong>128 <small>/ 146</small></strong><em><ArrowUpRight size={12} /> 12 today</em></div><div><span>REVIEWED</span><strong>86<small>%</small></strong><em><Activity size={12} /> 18 in queue</em></div><div><span>JUDGES ONLINE</span><strong>24</strong><em className="metric-neutral"><Users size={12} /> across 4 tracks</em></div></div>
                            <div className="dashboard-content">
                                <div className="leaderboard-panel"><div className="panel-title"><strong>Leaderboard</strong><span>ALL TRACKS <ChevronDown size={12} /></span></div><div className="leader-row leader-head"><span>TEAM</span><span>SCORE</span><span>CHANGE</span></div>
                                    <div className="leader-row"><b className="rank rank-first">01</b><span className="team-name"><i className="team-dot dot-cyan" />Synthexis</span><strong>94.8</strong><em className="rise"><ArrowUpRight size={13} /> 2</em></div>
                                    <div className="leader-row"><b className="rank">02</b><span className="team-name"><i className="team-dot dot-blue" />orbit.dev</span><strong>92.1</strong><em className="rise"><ArrowUpRight size={13} /> 1</em></div>
                                    <div className="leader-row"><b className="rank">03</b><span className="team-name"><i className="team-dot dot-orange" />Patchwork</span><strong>89.6</strong><em className="fall"><ArrowDownRight size={13} /> 1</em></div>
                                </div>
                                <div className="rubric-panel"><div className="panel-title"><strong>Rubric breakdown</strong><button aria-label="Rubric details"><CircleHelp size={13} /></button></div><div className="radar-chart"><div className="radar-grid radar-grid-outer" /><div className="radar-grid radar-grid-inner" /><div className="radar-axis axis-one" /><div className="radar-axis axis-two" /><div className="radar-axis axis-three" /><div className="radar-area" /><span className="radar-label radar-top">TECH</span><span className="radar-label radar-right">IMPACT</span><span className="radar-label radar-bottom">DESIGN</span><span className="radar-label radar-left">ORIGINAL</span></div></div>
                            </div>
                            <div className="dashboard-footer"><span className="sandbox-pill"><ShieldCheck size={13} /> Sandbox build: passed</span><span className="dashboard-sync"><i /> Updated just now</span></div>
                        </div>
                        <div className="float-chip chip-score"><span><Sparkles size={13} /></span><div><strong>Rubric aligned</strong><small>4 criteria evaluated</small></div><Check size={15} /></div>
                    </div>
                </section>

                <section className="trust-strip section-wrap" aria-label="Designed for a range of event organizers"><p>THE PEOPLE POWERING THE NEXT BIG IDEA</p><div className="trust-logos"><span><Boxes size={15} /> campus<span className="logo-light">labs</span></span><span className="logo-bold">NORTHSTAR<span> / </span>BUILD</span><span><Code2 size={17} /> dev<span className="logo-light">collective</span></span><span className="logo-serif">Open<span>Foundry</span></span><span><Zap size={15} /> launch<span className="logo-light">week</span></span></div></section>

                <section className="problems section-wrap section-space" id="features">
                    <div className="section-heading split-heading"><div><span className="section-kicker">THE CHALLENGE</span><h2>Hackathons don’t scale.<br /><span>Evaluation breaks first.</span></h2></div><p>Big ideas deserve a process that can keep up. Most event workflows weren’t built for the moment submissions start pouring in.</p></div>
                    <div className="problem-grid">{problems.map((problem) => { const Icon = problem.icon; return <article className="problem-card" key={problem.number}><div className="problem-meta"><span>{problem.number}</span><Icon size={19} /></div><h3>{problem.title}</h3><p>{problem.copy}</p></article>; })}</div>
                </section>

                <section className="features section-wrap section-space" id="integrity">
                    <div className="section-heading centered-heading"><span className="section-kicker">ONE PLATFORM. EVERY STAGE.</span><h2>Everything between <span>idea and award.</span></h2><p>Less operational drag for your team. More thoughtful feedback for every builder.</p></div>
                    <div className="feature-grid">{features.map((feature) => { const Icon = feature.icon; return <article className="feature-card" key={feature.title}><div className="feature-icon"><Icon size={19} /></div><h3>{feature.title}</h3><p>{feature.copy}</p><ArrowUpRight className="feature-arrow" size={16} /></article>; })}</div>
                </section>

                <section className="how section-wrap section-space" id="how-it-works">
                    <div className="section-heading split-heading"><div><span className="section-kicker">FROM KICKOFF TO WINNERS</span><h2>Four steps. <span>One less spreadsheet.</span></h2></div><p>Keep the experience simple for participants and the review process focused for judges.</p></div>
                    <div className="steps-grid">{steps.map((step, index) => { const Icon = step.icon; return <article className="step-card" key={step.number}><div className="step-top"><span>{step.number}</span><Icon size={19} />{index < steps.length - 1 && <div className="step-connector" />}</div><h3>{step.title}</h3><p>{step.copy}</p></article>; })}</div>
                </section>

                <section className="pipeline section-wrap section-space" id="pipeline">
                    <div className="pipeline-shell"><div className="pipeline-intro"><span className="section-kicker">THE EVALUATION PIPELINE</span><h2>Every submission.<br /><span>Seen from every angle.</span></h2><p>AI does the first pass across every artifact, so judges can spend their time on the work that deserves a closer look.</p><div className="pipeline-human"><span><HeartHandshake size={17} /></span><p><strong>People stay in the loop.</strong><br />Scores guide. Humans decide.</p></div></div>
                        <div className="pipeline-demo"><div className="pipeline-tabs" role="tablist" aria-label="Evaluation pipeline examples">{pipelineTabs.map((tab) => <button key={tab} className={activeTab === tab ? "pipeline-tab active" : "pipeline-tab"} id={`tab-${tab.toLowerCase().replace(" ", "-")}`} role="tab" aria-selected={activeTab === tab} aria-controls="pipeline-panel" onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
                            <div className="pipeline-panel" id="pipeline-panel" role="tabpanel" aria-labelledby={`tab-${activeTab.toLowerCase().replace(" ", "-")}`}><div className="pipeline-panel-copy"><div className="pipeline-icon"><PipelineIcon size={19} /></div><span className="mono-label">{activePipeline.label}</span><h3>{activePipeline.title}</h3><p>{activePipeline.copy}</p><a href="#host">Explore the platform <ArrowRight size={14} /></a></div><div className="terminal"><div className="terminal-head"><span><i /><i /><i /></span><small>evaluation.log</small><span className="terminal-lock"><LockKeyhole size={12} /></span></div><div className="terminal-lines">{activePipeline.lines.map((line, index) => <div className={index === 0 ? "terminal-command" : index === activePipeline.lines.length - 1 ? "terminal-highlight" : ""} key={line}>{line}</div>)}</div><div className="terminal-result"><Check size={12} /> {activePipeline.result}</div></div></div>
                        </div>
                    </div>
                </section>

                <section className="integrity-band section-wrap section-space">
                    <div className="integrity-mark"><Shield size={29} /></div><div className="integrity-copy"><span className="section-kicker">BUILT FOR TRUST, NOT BLACK BOXES</span><h2>AI should help judges<br />see more. <span>Not decide more.</span></h2><p>Every score comes with context. Every flag is reviewable. Final decisions belong to the people who understand the moment, the mission, and the work.</p><a className="text-link" href="#faq">Our approach to responsible evaluation <ArrowRight size={15} /></a></div><div className="principles"><div><BadgeCheck size={17} /><span>Transparent scoring</span><Check size={14} /></div><div><LockKeyhole size={17} /><span>Isolated by default</span><Check size={14} /></div><div><HeartHandshake size={17} /><span>Human-led decisions</span><Check size={14} /></div><div><Github size={17} /><span>Evidence you can inspect</span><Check size={14} /></div></div>
                </section>

                <section className="pricing section-wrap section-space" id="pricing">
                    <div className="section-heading centered-heading"><span className="section-kicker">PRICING THAT SCALES WITH YOUR EVENT</span><h2>Make room for <span>more good ideas.</span></h2><p>Whether it’s your first campus event or your tenth global challenge, let’s find the right setup.</p></div>
                    <div className="pricing-row"><div className="pricing-copy"><span className="pricing-label"><Sparkles size={14} /> FOR EVENT ORGANIZERS</span><h3>One thoughtful platform.<br />A better event end to end.</h3><p>Get a plan shaped around your audience, submission volume, and judging workflow.</p><div className="pricing-points"><span><Check size={15} /> Flexible event capacity</span><span><Check size={15} /> Custom weighted rubrics</span><span><Check size={15} /> Dedicated event onboarding</span></div></div><div className="pricing-contact"><span>LET’S TALK ABOUT YOUR EVENT</span><strong>Built around <br />your next big thing.</strong><a className="button button-primary" href="mailto:hello@hackguard.ai?subject=HackGuard%20AI%20event%20planning">Plan your event <ArrowRight size={16} /></a><small>No pressure. Just a useful conversation.</small></div></div>
                </section>

                <section className="faq section-wrap section-space" id="faq">
                    <div className="faq-heading"><span className="section-kicker">GOOD QUESTIONS</span><h2>Clarity before<br /><span>the kickoff.</span></h2><p>Still wondering how it works? We’ve got you.</p><a href="mailto:hello@hackguard.ai">Ask us directly <ArrowRight size={14} /></a></div><div className="faq-list">{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}<ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div>
                </section>

                <section className="final-cta section-wrap" id="host"><div className="cta-pattern" /><span className="section-kicker">YOUR NEXT EVENT CAN RUN DIFFERENTLY</span><h2>Make the hard part<br /><span>feel easy.</span></h2><p>Bring your community together. We’ll help make every project count.</p><a className="button button-primary" href="mailto:hello@hackguard.ai?subject=Host%20a%20Hackathon%20with%20HackGuard">Host a Hackathon <ArrowRight size={16} /></a><span className="cta-note"><ShieldCheck size={14} /> Built for fair, secure, human-led evaluation</span></section>
            </main>

            <footer className="footer section-wrap"><a className="footer-brand" href="#top"><span className="brand-mark"><ShieldCheck size={18} /></span><span>hackguard<span>.ai</span></span></a><span className="footer-note">A little more signal. A lot more building.</span><div className="footer-links"><a href="#features">Features</a><a href="#integrity">Integrity</a><a href="#pricing">Contact</a></div><span className="footer-copy">© 2026 HackGuard AI</span></footer>
        </div>
    );
}