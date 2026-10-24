"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link className="wordmark" href="/" aria-label="Commonplace home"><span className="brand-symbol" aria-hidden="true">c</span><span>commonplace<span className="brand-period">.</span></span></Link>
        <nav className="desktop-nav" aria-label="Main navigation"><Link href="/explore" className={isActive("/explore") ? "active" : undefined}>Explore</Link><Link href="/#categories" className={pathname === "/" && hash === "#categories" ? "active" : undefined}>Categories</Link></nav>
        <form action="/explore" className="header-search"><Search size={16} aria-hidden="true" /><label className="visually-hidden" htmlFor="nav-search">Search projects</label><input id="nav-search" name="q" placeholder="Search projects" /></form>
        <div className="header-actions desktop-header-actions">
          <ThemeToggle />
          {user ? <><Link className={`header-login ${isActive("/dashboard") ? "active" : ""}`.trim()} href="/dashboard">Dashboard</Link><form action={signOut}><button className="header-login header-logout" type="submit">Log out</button></form><Link className={`button button-primary header-join ${isActive("/projects/new") ? "active" : ""}`.trim()} href="/projects/new">Create project</Link></> : <><Link className={`header-login ${isActive("/auth/login") ? "active" : ""}`.trim()} href="/auth/login">Log in</Link><Link className={`button button-primary header-join ${isActive("/auth/register") ? "active" : ""}`.trim()} href="/auth/register">Join the community</Link></>}
        </div>
        <div className="mobile-header-controls">
          <ThemeToggle />
          <Link className="mobile-login-button" href={user ? "/dashboard" : "/auth/login"}>{user ? "Dashboard" : "Log in"}</Link>
          <MobileNavigation isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}