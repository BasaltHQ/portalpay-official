"use client";

import { ReactNode } from "react";
import { useDocsSidebar } from "@/contexts/DocsSidebarContext";

interface DocsContentWrapperProps {
    children: ReactNode;
}

export function DocsContentWrapper({ children }: DocsContentWrapperProps) {
    const { isCollapsed } = useDocsSidebar();

    return (
        <main className="pt-[232px] md:pt-[176px] transition-all duration-300">
            <div
                className={`mx-auto max-w-7xl px-4 md:px-8 py-12 xl:pr-64 transition-all duration-300 ${isCollapsed ? "md:pl-24" : "md:pl-[17rem]"
                    }`}
            >
                {children}
            </div>
        </main>
    );
}
