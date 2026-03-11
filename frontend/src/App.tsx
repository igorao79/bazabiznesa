import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import CreateRequestPage from "./pages/CreateRequestPage";
import DispatcherPanel from "./pages/DispatcherPanel";
import MasterPanel from "./pages/MasterPanel";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("create");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Default page based on role; master cannot access create
  const defaultPage = user.role === "dispatcher" ? "create" : "master";
  const currentPage =
    page === "create" && user.role === "dispatcher" ? "create" :
    page === "dispatcher" && user.role === "dispatcher" ? "dispatcher" :
    page === "master" && user.role === "master" ? "master" :
    defaultPage;

  return (
    <Layout currentPage={currentPage} onNavigate={setPage}>
      {currentPage === "create" && user.role === "dispatcher" && <CreateRequestPage />}
      {currentPage === "dispatcher" && <DispatcherPanel />}
      {currentPage === "master" && <MasterPanel />}
    </Layout>
  );
}
