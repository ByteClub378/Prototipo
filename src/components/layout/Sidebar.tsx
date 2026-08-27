import { NavLink } from "react-router-dom";
import PlayerProfile from "../player/PlayerProfile";
import NewMissionButton from "../ui/NewMissionButton";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/mapa", label: "Mapa", icon: "🗺️" },   
  { to: "/medalhas", label: "Medalhas", icon: "🏅" },
  { to: "/dicionario", label: "Dicionário", icon: "📖" },
  { to: "/aventuras", label: "Aventuras", icon: "🧭" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">🧭</span>
        <span className="sidebar__logo-text">Aventura das Regiões</span>
      </div>

      <PlayerProfile name="Beto, o Explorador" level="Curumim" avatar="🧑‍🚀" />

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "sidebar__nav-item sidebar__nav-item--active" : "sidebar__nav-item"
            }
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <NewMissionButton />
      </div>
    </aside>
  );
}

export default Sidebar;
