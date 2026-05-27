// app/admin/layout.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaShieldAlt,
  FaGlobe,
  FaSatelliteDish,
  FaUsers,
  FaUserShield,
  FaStore,
  FaSignOutAlt,
  FaBars,
  FaCog,
} from "react-icons/fa";
import s from "./admin.module.css";

// ── Nav config ───────────────────────────────────────────────
const NAV_ITEMS = [
  {
    section: "Configuration",
    links: [
      { href: "/admin/settings", Icon: FaGlobe,         label: "Site Settings"      },
      { href: "/admin/channels", Icon: FaSatelliteDish, label: "Channel Management" },
    ],
  },
  {
    section: "Management",
    links: [
      { href: "/admin/users",    Icon: FaUsers,         label: "User Management"    },
    ],
  },
  {
    section: "Personal",
    links: [
      { href: "/admin/account",  Icon: FaUserShield,    label: "Account Settings"   },
    ],
  },
];

const BOTTOM_NAV = [
  { href: "/admin/settings", Icon: FaGlobe,         label: "Site"     },
  { href: "/admin/channels", Icon: FaSatelliteDish, label: "Channels" },
  { href: "/admin/users",    Icon: FaUsers,         label: "Users"    },
  { href: "/admin/account",  Icon: FaUserShield,    label: "Account"  },
];

const PAGE_TITLES = {
  "/admin/settings": { title: "Site Settings",      Icon: FaGlobe         },
  "/admin/channels": { title: "Channel Management", Icon: FaSatelliteDish },
  "/admin/users":    { title: "User Management",    Icon: FaUsers         },
  "/admin/account":  { title: "Account Settings",   Icon: FaUserShield    },
};

// ── Layout ───────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = useMemo(() => PAGE_TITLES[pathname] ?? { title: "Admin Panel", Icon: FaCog }, [pathname]);
  const { Icon: PageIcon } = meta;

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close on route change
  useEffect(() => { closeSidebar(); }, [pathname, closeSidebar]);

  // Swipe-to-close
  useEffect(() => {
    let startX = 0;
    const onStart = (e) => { startX = e.touches[0].clientX; };
    const onEnd   = (e) => {
      if (startX - e.changedTouches[0].clientX > 60 && sidebarOpen) closeSidebar();
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend",   onEnd);
    };
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className={s.adminRoot}>

      {/* Backdrop */}
      <div
        className={`${s.sidebarBackdrop} ${sidebarOpen ? s.show : ""}`}
        onClick={closeSidebar}
      />

      {/* ════════════════════════
          SIDEBAR
      ════════════════════════ */}
      <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarOpen : ""}`}>

        <div className={s.sidebarLogo}>
          <div className={s.adminBadge}>
            <FaShieldAlt style={{ fontSize: 10 }} />
            Admin Panel
            <span>ADMIN</span>
          </div>
        </div>

        <div style={{ paddingTop: 6 }}>
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <div className={s.navSectionLabel}>{group.section}</div>
              {group.links.map(({ href, Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`${s.navItem} ${pathname === href ? s.active : ""}`}
                  style={{ textDecoration: "none" }}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  <Icon />
                  {label}
                </Link>
              ))}
            </div>
          ))}

          <div className={s.sidebarFooter}>
            <Link href="/" className={s.navItem} style={{ textDecoration: "none" }}>
              <FaStore /> View Store
            </Link>
            <button
              type="button"
              className={`${s.navItem} ${s.navDanger}`}
              style={{ width: "100%", background: "none", border: "none" }}
            >
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════
          MAIN
      ════════════════════════ */}
      <main className={s.main}>

        {/* Top Bar */}
        <div className={s.topBar}>
          <div className={s.topBarLeft}>
            <button
              type="button"
              className={s.menuToggle}
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Open menu"
            >
              <FaBars />
            </button>
            <div className={s.topBarTitle}>
              <PageIcon />
              <span>{meta.title}</span>
            </div>
          </div>

          <div className={s.topBarRight}>
            <span className={s.topBarAdminLabel}>Administrator</span>
            <div className={s.adminAvatar}>A</div>
          </div>
        </div>

        {children}
      </main>

      {/* ════════════════════════
          BOTTOM NAV (mobile)
      ════════════════════════ */}
      <nav className={s.bottomNav}>
        <div className={s.bottomNavInner}>
          {BOTTOM_NAV.map(({ href, Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`${s.bnavItem} ${pathname === href ? s.active : ""}`}
              style={{ textDecoration: "none" }}
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

    </div>
  );
}
