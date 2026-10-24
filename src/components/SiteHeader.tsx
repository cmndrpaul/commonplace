import Link from "next/link";
import { Search } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAuthenticatedContext } from "@/lib/auth";

export async function SiteHeader() {
  const { user } = await getAuthenticatedContext();
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link className="wordmark" href="/" aria-label="Commonplace home"><span className="brand-symbol" aria-hidden="true">c</span><span>commonplace<span className="brand-period">.</span></span></Link>
        <nav className="desktop-nav" aria-label="Main navigation"><Link href="/explore">Explore</Link><Link href="/#categories">Categories</Link></nav>
        <form action="/explore" className="header-search"><Search size={16} aria-hidden="true" /><label className="visually-hidden" htmlFor="nav-search">Search projects</label><input id="nav-search" name="q" placeholder="Search projects" /></form>
        <div className="header-actions desktop-header-actions">
          <ThemeToggle />
          {user ? <><Link className="header-login" href="/dashboard">Dashboard</Link><form action={signOut}><button className="header-login header-logout" type="submit">Log out</button></form><Link className="button button-primary header-join" href="/projects/new">Create project</Link></> : <><Link className="header-login" href="/auth/login">Log in</Link><Link className="button button-primary header-join" href="/auth/register">Join the community</Link></>}
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