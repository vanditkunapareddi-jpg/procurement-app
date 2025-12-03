// components/AppLayout.js
import Sidebar from "./Sidebar";

export default function AppLayout({ children, active }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active={active} />
      <div className="flex-1">
        {/* children = page content */}
        {children}
      </div>
    </div>
  );
}
