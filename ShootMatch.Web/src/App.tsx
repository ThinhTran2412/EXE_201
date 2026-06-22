import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminBookings from "./pages/admin/AdminBookings";
import AuthHub from "./pages/auth/AuthHub";
import CustomerAuth from "./pages/auth/CustomerAuth";
import PhotographerAuth from "./pages/auth/PhotographerAuth";
import StaffAuth from "./pages/auth/StaffAuth";
import StaffLogin from "./pages/auth/StaffLogin";
import StaffRegister from "./pages/auth/StaffRegister";
import InstallPage from "./pages/InstallPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerHome from "./pages/customer/CustomerHome";
import PhotographerHome from "./pages/photographer/PhotographerHome";
import StaffDashboard from "./pages/staff/StaffDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/install" element={<InstallPage />} />

        {/* Authentication */}
        <Route path="/auth" element={<AuthHub />} />
        <Route path="/auth/customer" element={<CustomerAuth />} />
        <Route path="/auth/photographer" element={<PhotographerAuth />} />
        <Route path="/auth/staff" element={<StaffAuth />} />
        <Route path="/auth/staff/login" element={<StaffLogin />} />
        <Route path="/auth/staff/register" element={<StaffRegister />} />

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

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
