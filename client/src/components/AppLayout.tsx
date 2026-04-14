import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Shield, LayoutDashboard, Search, Trash2, Bell, Bot,
  Eye, Link2, BookOpen, Settings, LogOut, ChevronRight,
  Menu, X, User
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/brokers", icon: BookOpen, label: "Broker Catalog" },
  { href: "/breach-alerts", icon: Bell, label: "Breach Alerts", badge: true },
  { href: "/llm-assistant", icon: Bot, label: "AI Assistant" },
  { href: "/subscription", icon: Settings, label: "Subscription" },
];

export default function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: unreadCount } = trpc.breach.unreadCount.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Shield className="h-6 w-6 text-primary animate-pulse" />
          <span>Loading PrivacyShield...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Sign in to PrivacyShield</h2>
          <p className="text-muted-foreground mb-6">Protect your personal data online.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "p-4" : "p-4"}`}>
      <div className="flex items-center gap-2 mb-8 px-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-bold text-foreground">PrivacyShield</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.badge && unreadCount && unreadCount > 0 ? (
                <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email || ""}</div>
          </div>
        </div>
        {user?.role === "admin" && (
          <Link href="/admin" onClick={() => setSidebarOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground mb-1">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground text-sm">{title || "Dashboard"}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/breach-alerts">
              <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                {unreadCount && unreadCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                ) : null}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
