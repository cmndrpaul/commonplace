"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Search } from "lucide-react";

export function MobileNavigation({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="mobile-menu">
      <button
        className={`mobile-menu-toggle${isOpen ? " is-open" : ""}`}
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        className={`mobile-nav-panel${isOpen ? " is-open" : ""}`}
        id="mobile-navigation-panel"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="mobile-nav-links">
          <Link href="/" onClick={closeMenu}>Home</Link>
          <Link href="/explore" onClick={closeMenu}>Explore</Link>
          {isLoggedIn ? <Link href="/projects/new" onClick={closeMenu}>Create project</Link> : <Link className="mobile-nav-join" href="/auth/register" onClick={closeMenu}>Join the Community</Link>}
          {isLoggedIn && <form action={signOut}><button className="mobile-nav-link" type="submit">Log out</button></form>}
        </div>
        <form action="/explore" className="mobile-menu-search">
          <Search size={16} aria-hidden="true" />
          <label className="visually-hidden" htmlFor="mobile-nav-search">Search projects</label>
          <input id="mobile-nav-search" name="q" placeholder="Search projects" />
        </form>
      </nav>
    </div>
  );
}