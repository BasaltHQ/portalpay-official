"use client";

import { ReactNode } from "react";
import { useDocsSidebar } from "@/contexts/DocsSidebarContext";

interface DashboardContentWrapperProps {
    children: ReactNode;
}

export function DashboardContentWrapper({ children }: DashboardContentWrapperProps) {
    const { isCollapsed } = useDocsSidebar();

    return (
        <main className="pt-[176px] transition-all duration-300">
            <div
                className={`mx-auto max-w-4xl px-8 py-12 xl:mr-64 transition-all duration-300 ${isCollapsed ? "md:ml-24" : "md:ml-[17rem]"
                    }`}
            >
                {children}
            </div>
        </main>
    );
}
