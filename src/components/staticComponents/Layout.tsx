import { useState, type FC } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import SessionWarningModal from "../SessionWarningModal";
import FloatingActionButton from "../ui/FloatingActionButton";

const Layout: FC = () => {
    const [sidebarVisible, setSidebarVisible] = useState(true);

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar isExpanded={sidebarVisible} onToggleSidebar={toggleSidebar} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar sidebarToggled={sidebarVisible} />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            <SessionWarningModal />
            <FloatingActionButton />
        </div>
    );
};

export default Layout;
