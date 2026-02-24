import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, User, LogOut, UserCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContext";

const THEME_KEY = "solutio-theme";

export const NavigationNew = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/browse", label: "Explore Problems" },
    { path: "/saved", label: "Saved" },
    { path: "/following", label: "Following" },
    { path: "/about", label: "About Us" },
  ];

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleContributeClick = () => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate("/contribute");
    }
  };

  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 py-0 transition-transform duration-300 ${
          showNav ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-full px-12 mx-auto flex items-center border-b border-gray-800 justify-between bg-gray-300/20 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="SolutioNet.al" className="w-30 h-14" />
            {/* <div className="text-2xl font-bold gradient-text">SolutioNet.al</div> */}
          </Link>

          <div className="glass rounded-full px-6 py-2">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-full px-2 py-1 flex items-center gap-3">
            <Button
              color="primary"
              onPress={handleContributeClick}
              className="rounded-full"
              startContent={<Plus className="h-4 w-4" />}
            >
              Contribute
            </Button>

            <Button
              isIconOnly
              variant="light"
              onPress={toggleTheme}
              className="rounded-full"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Dropdown placement="bottom-end" className="glass border-border">
              <DropdownTrigger>
                <Button isIconOnly variant="light" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                {user ? (
                  <>
                    <DropdownItem key="profile" startContent={<UserCircle className="h-4 w-4" />} onPress={handleProfileClick}>
                      Profile
                    </DropdownItem>
                    <DropdownItem key="logout" startContent={<LogOut className="h-4 w-4" />} onPress={handleLogout} className="text-danger" color="danger">
                      Logout
                    </DropdownItem>
                  </>
                ) : (
                  <DropdownItem key="login" startContent={<User className="h-4 w-4" />} onPress={() => navigate("/auth")}>
                    Login
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </nav>

    </>
  );
};
