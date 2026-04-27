import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { jwtDecode, type JwtPayload } from "jwt-decode";

// 1. Define the shape of your User (add whatever is in your JWT)
interface MyUser extends JwtPayload {
  id?: string;
  email?: string;
  role?: string;
}

// 2. Define the shape of the Context itself
interface AuthContextType {
  token: string | null;
  user: MyUser | null;
  login: (token: string) => void;
  logout: () => void;
}

// 3. Fix the "supply a value" error by providing 'undefined' and a Type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// 4. Add types to the props ({ children }: { children: ReactNode })
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<MyUser | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<MyUser>(token); // Tell jwt-decode what to expect
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp < now) {
          logout();
        } else {
          setUser(decoded); // Put the actual decoded data in state
        }
      } catch {
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};