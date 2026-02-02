/**
 * PropertySelector Component
 * Dropdown for switching between multiple PMS properties
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PMSInstance } from '@/lib/pms/types';

interface PropertySelectorProps {
    currentInstance: PMSInstance;
    allInstances: PMSInstance[];
}

export function PropertySelector({ currentInstance, allInstances }: PropertySelectorProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Only show if multiple properties
    if (allInstances.length <= 1) {
        return null;
    }

    const handleSelect = (instance: PMSInstance) => {
        setIsOpen(false);
        if (instance.slug !== currentInstance.slug) {
            router.push(`/pms/${instance.slug}`);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 
          border border-gray-700/50 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-2">
                    {currentInstance.branding.logo ? (
                        <img
                            src={currentInstance.branding.logo}
                            alt={currentInstance.name}
                            className="h-6 w-6 rounded object-cover"
                        />
                    ) : (
                        <div
                            className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: currentInstance.branding.primaryColor }}
                        >
                            {currentInstance.name.charAt(0)}
                        </div>
                    )}
                    <span className="text-sm font-medium text-white">{currentInstance.name}</span>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 z-50
          bg-gray-900/95 backdrop-blur-md border border-gray-700/50 
          rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-700/50">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Switch Property</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {allInstances.map((instance) => (
                            <button
                                key={instance.slug}
                                onClick={() => handleSelect(instance)}
                                className={`w-full flex items-center gap-3 px-3 py-3 text-left
                  transition-colors ${instance.slug === currentInstance.slug
                                        ? 'bg-blue-500/20 text-white'
                                        : 'text-gray-300 hover:bg-gray-800/50'
                                    }`}
                            >
                                {instance.branding.logo ? (
                                    <img
                                        src={instance.branding.logo}
                                        alt={instance.name}
                                        className="h-8 w-8 rounded object-cover"
                                    />
                                ) : (
                                    <div
                                        className="h-8 w-8 rounded flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: instance.branding.primaryColor }}
                                    >
                                        {instance.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div className="font-medium">{instance.name}</div>
                                    <div className="text-xs text-gray-500">{instance.slug}</div>
                                </div>
                                {instance.slug === currentInstance.slug && (
                                    <svg className="w-5 h-5 ml-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t border-gray-700/50">
                        <button
                            onClick={() => router.push('/pms/portfolio')}
                            className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white 
                hover:bg-gray-800/50 rounded transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            View Portfolio Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
