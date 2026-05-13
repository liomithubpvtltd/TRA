"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAVIGATION } from "@/constants/navigation";

import { useState } from "react";
import { LogOut, Briefcase, ListOrdered, LayoutDashboard, User, FileText } from "lucide-react";
import { API } from "@/api/axios";
import { useAuthStore } from "@/store/authStore";

export default function Sidebar() {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await API.post("/api/auth/logout/");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      API.clearAuthTokens();
      localStorage.removeItem('tlm_selected_date_v2');
      setShowLogoutConfirm(false);
      window.location.replace("/login");
    }
  };

  return (
    <>
      <aside className={`hidden md:flex ${isCollapsed ? "w-20" : "w-55"} bg-gray-900 text-white flex-col h-screen sticky top-0 border-r border-gray-800 relative transition-all duration-300 z-50`}>
        <div className={`h-16 flex items-center ${isCollapsed ? "justify-center px-2" : "justify-start px-6"} border-b border-gray-800`}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-tight text-emerald-400">TimelessMoney</h1>
          )}
        </div>

        {/* Toggle Button on Right Border in the Middle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer transition-all duration-200"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="text-[10px] font-bold">{isCollapsed ? ">" : "<"}</span>
        </button>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {SIDEBAR_NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isRestricted = !user?.has_active_subscription;

            return (
              <Link
                key={item.name}
                href={isRestricted ? "#" : item.href}
                onClick={(e) => {
                  if (isRestricted) {
                    e.preventDefault();
                  }
                }}
                className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : isRestricted 
                      ? "text-gray-600 cursor-not-allowed opacity-50"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                title={isRestricted ? "Subscription Required" : item.name}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : isRestricted ? "text-gray-600" : "text-gray-400 group-hover:text-white"}`} />
                {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
          {!user?.has_active_subscription && (
             <Link
               href="/plans"
               className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg transition-colors group ${
                 pathname === "/plans" ? "bg-teal-500/10 text-teal-400" : "bg-teal-500/5 text-teal-500/60 hover:text-teal-400 hover:bg-teal-500/10"
               }`}
             >
               <LayoutDashboard className="w-5 h-5" />
               {!isCollapsed && <span className="font-bold text-sm italic">Upgrade Plan</span>}
             </Link>
          )}
        </nav>

        <div className={`p-4 border-t border-gray-800 flex flex-col ${isCollapsed ? "items-center" : ""} gap-2`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2`} title={user?.username || "User"}>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate w-32">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || "User Account"}
                </span>
                <span className={`text-xs font-bold ${user?.has_active_subscription ? "text-teal-500" : "text-amber-500"}`}>
                   {user?.has_active_subscription ? "Pro Plan" : "No Active Plan"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg transition-colors text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full font-medium text-sm`}
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-900 flex justify-between items-center py-2 px-6 z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
        {/* 1. Portfolio */}
        <Link 
          href={!user?.has_active_subscription ? "#" : "/portfolio"}
          onClick={(e) => !user?.has_active_subscription && e.preventDefault()}
          className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors ${pathname === "/portfolio" ? "text-teal-400" : "text-zinc-400"} ${!user?.has_active_subscription && "opacity-20 cursor-not-allowed"}`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[9px] font-medium tracking-wider">Portfolio</span>
        </Link>

        {/* 2. Order */}
        <Link 
          href={!user?.has_active_subscription ? "#" : "/orders"}
          onClick={(e) => !user?.has_active_subscription && e.preventDefault()}
          className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors ${pathname === "/orders" ? "text-teal-400" : "text-zinc-400"} ${!user?.has_active_subscription && "opacity-20 cursor-not-allowed"}`}
        >
          <ListOrdered className="w-5 h-5" />
          <span className="text-[9px] font-medium tracking-wider">Orders</span>
        </Link>

        {/* 3. Dashboard (middle and big) */}
        {!user?.has_active_subscription ? (
          <Link 
            href="/plans"
            className={`flex flex-col items-center justify-center -mt-6 bg-teal-500 border-2 w-14 h-14 rounded-full shadow-[0_4px_15px_rgba(20,184,166,0.3)] transition-all duration-200 text-zinc-950 border-teal-400`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[8px] font-bold tracking-wider mt-0.5">Plans</span>
          </Link>
        ) : (
          <Link 
            href="/home"
            className={`flex flex-col items-center justify-center -mt-6 bg-zinc-900 border-2 w-14 h-14 rounded-full shadow-[0_4px_15px_rgba(20,184,166,0.3)] transition-all duration-200 ${pathname === "/home" ? "text-teal-400 border-teal-500/50" : "text-zinc-300 border-zinc-800"}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[8px] font-bold tracking-wider mt-0.5">Home</span>
          </Link>
        )}

        {/* 4. Reports */}
        <Link 
          href={!user?.has_active_subscription ? "#" : "/reports"}
          onClick={(e) => !user?.has_active_subscription && e.preventDefault()}
          className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors ${pathname === "/reports" ? "text-teal-400" : "text-zinc-400"} ${!user?.has_active_subscription && "opacity-20 cursor-not-allowed"}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px] font-medium tracking-wider">Reports</span>
        </Link>

        {/* 5. Profile */}
        <Link 
          href={!user?.has_active_subscription ? "#" : "/profile"}
          onClick={(e) => !user?.has_active_subscription && e.preventDefault()}
          className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors ${pathname === "/profile" ? "text-teal-400" : "text-zinc-400"} ${!user?.has_active_subscription && "opacity-20 cursor-not-allowed"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-medium tracking-wider">Profile</span>
        </Link>

      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            <p className="text-sm text-gray-500 mt-2">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
