import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { RoleSelection } from "./pages/RoleSelection";
import { ServiceListing } from "./pages/ServiceListing";
import { ProviderProfile } from "./pages/ProviderProfile";
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { ProviderDashboard } from "./pages/ProviderDashboard";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "role-selection", Component: RoleSelection },
      {
        path: "services/:category?",
        Component: ServiceListing,
      },
      { path: "provider/:id", Component: ProviderProfile },
      {
        path: "customer/dashboard",
        Component: CustomerDashboard,
      },
      {
        path: "provider/dashboard",
        Component: ProviderDashboard,
      },
    ],
  },
]);