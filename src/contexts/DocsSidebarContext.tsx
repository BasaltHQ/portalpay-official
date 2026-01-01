"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DocsSidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

const DocsSidebarContext = createContext<DocsSidebarContextType | undefined>(undefined);

export function DocsSidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <DocsSidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            {children}
        </DocsSidebarContext.Provider>
    );
}

export function useDocsSidebar() {
    const context = useContext(DocsSidebarContext);
    if (context === undefined) {
        throw new Error("useDocsSidebar must be used within a DocsSidebarProvider");
    }
    return context;
}
