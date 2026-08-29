import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import InstagramAccounts from "./pages/instagram/InstagramAccounts";

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: "40px" }}>
      <h1>{title}</h1>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Application Pages */}
        <Route
          path="/instagram-accounts"
          element={<InstagramAccounts />}
        />

        <Route
          path="/automations"
          element={<Placeholder title="Automations" />}
        />

        <Route
          path="/files"
          element={<Placeholder title="Files" />}
        />

        <Route
          path="/settings"
          element={<Placeholder title="Settings" />}
        />

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;