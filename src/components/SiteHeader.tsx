import Link from "next/link";
import { Search } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { getAuthenticatedContext } from "@/lib/auth";

export async function SiteHeader() {
  const { user } = await getAuthenticatedContext();
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link className="wordmark" href="/" aria-label="Commonplace home"><span className="brand-symbol" aria-hidden="true">c</span><span>commonplace<span className="brand-period">.</span></span></Link>
        <nav className="desktop-nav" aria-label="Main navigation"><Link href="/explore">Explore</Link><Link href="/#categories">Categories</Link></nav>
        <form action="/explore" className="header-search"><Search size={16} aria-hidden="true" /><label className="visually-hidden" htmlFor="nav-search">Search projects</label><input id="nav-search" name="q" placeholder="Search projects" /></form>
        <div className="header-actions">{user ? <><Link className="header-login" href="/dashboard">Dashboard</Link><form action={signOut}><button className="header-login header-logout" type="submit">Log out</button></form><Link className="button button-primary header-join" href="/projects/new">Create project</Link></> : <><Link className="header-login" href="/auth/login">Log in</Link><Link className="button button-primary header-join" href="/auth/register">Join the community</Link></>}</div>
        <details className="mobile-menu"><summary aria-label="Open navigation menu"><span /><span /></summary><nav aria-label="Mobile navigation"><Link href="/explore">Explore projects</Link><Link href="/#categories">Categories</Link>{user ? <><Link href="/dashboard">Dashboard</Link><Link href="/projects/new">Create project</Link><form action={signOut}><button type="submit">Log out</button></form></> : <><Link href="/auth/login">Log in</Link><Link href="/auth/register">Create an account</Link></>}</nav></details>
      </div>
    </header>
  );
}