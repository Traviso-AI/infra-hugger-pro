import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout, AppLayoutNoFooter } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BetaGate } from "@/components/BetaGate";
import { AdminGate } from "@/components/AdminGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import TripDetail from "./pages/TripDetail";
import CreateTrip from "./pages/CreateTrip";
import Dashboard from "./pages/Dashboard";
import MyTrips from "./pages/MyTrips";
import AiPlanner from "./pages/AiPlanner";
import Leaderboard from "./pages/Leaderboard";
import Booking from "./pages/Booking";
import BookingSuccess from "./pages/BookingSuccess";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import EditTrip from "./pages/EditTrip";
import Collections from "./pages/Collections";
import Install from "./pages/Install";
import BetaWaitlist from "./pages/BetaWaitlist";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes — no beta gate */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/about" element={<About />} />
                <Route path="/install" element={<Install />} />

                {/* Public browsing routes — beta gated */}
                <Route path="/explore" element={<BetaGate><ErrorBoundary><Explore /></ErrorBoundary></BetaGate>} />
                <Route path="/leaderboard" element={<BetaGate><ErrorBoundary><Leaderboard /></ErrorBoundary></BetaGate>} />
                <Route path="/trip/:id" element={<BetaGate><ErrorBoundary><TripDetail /></ErrorBoundary></BetaGate>} />
                <Route path="/profile/:username" element={<BetaGate><ErrorBoundary><PublicProfile /></ErrorBoundary></BetaGate>} />

                {/* Protected + beta gated routes */}
                <Route path="/dashboard" element={<ProtectedRoute><BetaGate><ErrorBoundary><Dashboard /></ErrorBoundary></BetaGate></ProtectedRoute>} />
                <Route path="/my-trips" element={<ProtectedRoute><BetaGate><ErrorBoundary><MyTrips /></ErrorBoundary></BetaGate></ProtectedRoute>} />
                <Route path="/create-trip" element={<ProtectedRoute><BetaGate><ErrorBoundary><CreateTrip /></ErrorBoundary></BetaGate></ProtectedRoute>} />
                <Route path="/edit-trip/:id" element={<ProtectedRoute><BetaGate><ErrorBoundary><EditTrip /></ErrorBoundary></BetaGate></ProtectedRoute>} />
                <Route path="/booking/success" element={<ProtectedRoute><BetaGate><BookingSuccess /></BetaGate></ProtectedRoute>} />
                <Route path="/booking/:tripId" element={<ProtectedRoute><BetaGate><ErrorBoundary><Booking /></ErrorBoundary></BetaGate></ProtectedRoute>} />
                <Route path="/collections" element={<ProtectedRoute><BetaGate><ErrorBoundary><Collections /></ErrorBoundary></BetaGate></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><BetaGate><ErrorBoundary><Profile /></ErrorBoundary></BetaGate></ProtectedRoute>} />

                {/* Admin — protected + admin gated */}
                <Route path="/admin" element={<ProtectedRoute><AdminGate><Admin /></AdminGate></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Route>

              {/* No footer layout */}
              <Route element={<AppLayoutNoFooter />}>
                <Route path="/ai-planner" element={<ProtectedRoute><BetaGate><ErrorBoundary><AiPlanner /></ErrorBoundary></BetaGate></ProtectedRoute>} />
              </Route>

              {/* Beta waitlist — standalone, no navbar */}
              <Route path="/beta-waitlist" element={<BetaWaitlist />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
