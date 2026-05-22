import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AuthHub from "./pages/auth/AuthHub";
import CustomerAuth from "./pages/auth/CustomerAuth";
import PhotographerAuth from "./pages/auth/PhotographerAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerHome from "./pages/customer/CustomerHome";
import PhotographerHome from "./pages/photographer/PhotographerHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Authentication */}
        <Route path="/auth" element={<AuthHub />} />
        <Route path="/auth/customer" element={<CustomerAuth />} />
        <Route path="/auth/photographer" element={<PhotographerAuth />} />

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowRoles={["customer"]}>
              <CustomerHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/photographer"
          element={
            <ProtectedRoute allowRoles={["photographer"]}>
              <PhotographerHome />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
