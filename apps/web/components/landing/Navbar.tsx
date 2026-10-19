'use client';

import { useState } from "react";
import { Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";

const links = [
    ["Features", "#features"],
    ["How it works", "#how-it-works"],
    ["Integrity", "#integrity"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
];

export default function Navbar({ lightMode, onToggleTheme }: { lightMode: boolean; onToggleTheme: () => void }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="site-header">
            <nav className="navbar section-wrap" aria-label="Main navigation">
                <a className="brand" href="#top" aria-label="HackGuard AI home"><span className="brand-mark"><ShieldCheck size={18} /></span><span>hackguard<span>.ai</span></span></a>
                <div className="nav-links">{links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</div>
                <div className="nav-actions">
                    <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${lightMode ? "dark" : "light"} mode`} title={`Switch to ${lightMode ? "dark" : "light"} mode`}>{lightMode ? <Moon size={16} /> : <Sun size={16} />}</button>
                    <a className="sign-in" href="/sign-in">Sign in</a>
                    <a className="button button-primary nav-cta" href="#host">Host a Hackathon <span>↗</span></a>
                    <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
                </div>
            </nav>
            <div className={`mobile-nav ${menuOpen ? "mobile-nav-open" : ""}`} id="mobile-navigation" aria-hidden={!menuOpen}>
                {links.map(([label, href]) => <a key={label} href={href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{label}</a>)}
                <a className="mobile-sign-in" href="/sign-in" tabIndex={menuOpen ? 0 : -1}>Sign in</a>
                <a className="button button-primary" href="#host" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>Host a Hackathon <span>↗</span></a>
            </div>
        </header>
    );
}