import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
import "./App.css";
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Booking = lazy(() => import("./pages/Booking"));
const Payment = lazy(() => import("./pages/Payment"));
const Admin = lazy(() => import("./pages/Admin"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!isAdminRoute && <Navbar />}
      <div style={{ flex: 1, paddingTop: isAdminRoute ? 0 : "76px" }}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/transactions" element={<TransactionHistory />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/payment/:id" element={<Payment />} />
          </Routes>
        </Suspense>
      </div>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
