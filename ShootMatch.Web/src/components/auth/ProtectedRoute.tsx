import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import type { UserRole } from "../../store/useAuthStore";

export default function ProtectedRoute({
  children,
  allowRoles,
}: {
  children: React.ReactNode;
  allowRoles?: UserRole[];
}) {
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const role = useAuthStore((state) => state.role);
  const isReady = useAuthStore((state) => state.isReady);

  if (!isReady) return null;

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (allowRoles && role && !allowRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return <>{children}</>;
}
