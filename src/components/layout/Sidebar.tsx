import { useState } from "react";
import { NavLink } from "react-router-dom";
import betoExplorer from "../../assets/beto-explorer.webp";
import PlayerProfile from "../player/PlayerProfile";
import NewMissionButton from "../ui/NewMissionButton";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/mapa", label: "Mapa", icon: "map" },
  { to: "/manual", label: "Manual", icon: "book" },
  { to: "/medalhas", label: "Medalhas", icon: "medal" },
  { to: "/dicionario", label: "Dicionário", icon: "book" },
  { to: "/creditos", label: "Créditos", icon: "info" },
] as const;

function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "map":
      return (
        <svg {...common}>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
          <path d="M9 3v15M15 6v15" />
        </svg>
      );
    case "medal":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="5" />
          <path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="m16 3 5 5-4 1-4 4-1 5-2-2-4 4-2-2 4-4-2-2 5-1 4-4 1-4Z" />
        </svg>
      );
    default:
      return null;
  }
}

function Sidebar() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;

  return (
    <aside
      className={`sidebar ${expanded ? "sidebar--expanded" : ""} ${
        pinned ? "sidebar--pinned" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__brand-icon" aria-hidden="true">
            <Icon name="compass" />
          </span>
          <span className="sidebar__brand-name">
            Aventura <strong>das Regiões</strong>
          </span>
        </div>

        <button
          className="sidebar__pin"
          type="button"
          onClick={() => setPinned((value) => !value)}
          aria-label={pinned ? "Desafixar menu" : "Fixar menu aberto"}
          aria-pressed={pinned}
          title={pinned ? "Desafixar menu" : "Fixar menu aberto"}
        >
          <Icon name="pin" />
        </button>
      </header>

      <PlayerProfile
        name="Beto, o Explorador"
        level="Curumim"
        avatar={betoExplorer}
      />

      <nav className="sidebar__nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={!expanded ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar__nav-item ${
                isActive ? "sidebar__nav-item--active" : ""
              }`
            }
          >
            <span className="sidebar__nav-icon">
              <Icon name={item.icon} />
            </span>
            <span className="sidebar__nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <footer className="sidebar__footer">
        <NewMissionButton />
      </footer>
    </aside>
  );
}

export default Sidebar;
