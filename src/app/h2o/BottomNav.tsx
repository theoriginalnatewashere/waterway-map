import { Link } from "@tanstack/react-router";
import { Map, Droplets, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const items = [
  { to: "/", labelKey: "navigation.map", icon: Map },
  { to: "/dispensers", labelKey: "navigation.dispensers", icon: Droplets },
  { to: "/report", labelKey: "navigation.report", icon: PlusCircle },
  { to: "/profile", labelKey: "navigation.profile", icon: User },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur"
      aria-label={t("navigation.primary")}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-medium text-muted-foreground",
                "data-[status=active]:text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
