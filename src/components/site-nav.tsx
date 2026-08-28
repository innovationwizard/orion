import NavBar from "@/components/nav-bar";
import Panel from "@/app/pabi/panel";

/**
 * Feature-flag switch between the Panel nav (default) and the legacy NavBar.
 * Set NEXT_PUBLIC_NAV_VARIANT=navbar and redeploy to roll back instantly if
 * Panel has an issue in production.
 */
export default function SiteNav() {
  const variant = process.env.NEXT_PUBLIC_NAV_VARIANT ?? "panel";
  return variant === "navbar" ? <NavBar /> : <Panel />;
}
