"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, ShoppingCart, Store, ArrowRight, LayoutGrid, Utensils, Building2, Briefcase, BookOpen, Zap } from "lucide-react";
import { isPartnerContext } from "@/lib/env";

const INDUSTRY_PACKS = [
  {
    title: "General Store",
    icon: <Store className="w-6 h-6 text-sky-400" />,
    color: "sky",
    href: "/crypto-payments/general-store",
    desc: "Universal point of sale for retail and service businesses. Flexible setup without industry-specific overhead.",
    touchpoints: ["Universal POS", "Products & Services", "Global Payments"],
  },
  {
    title: "Restaurant & Cafe",
    icon: <Utensils className="w-6 h-6 text-red-500" />,
    color: "red",
    href: "/crypto-payments/restaurants",
    desc: "Full-scale POS with table management, kitchen display systems, order modifiers, and dietary tags.",
    touchpoints: ["Kitchen Display System", "Order Modifiers", "Table Management"],
  },
  {
    title: "Retail & Apparel",
    icon: <ShoppingCart className="w-6 h-6 text-indigo-400" />,
    color: "indigo",
    href: "/crypto-payments/retail",
    desc: "Retail POS with inventory variants, barcode scanning, and multi-location stock management.",
    touchpoints: ["Inventory Variants", "Barcode Scanning", "Stock Alerts"],
  },
  {
    title: "Hotel & Accommodation",
    icon: <Building2 className="w-6 h-6 text-violet-400" />,
    color: "violet",
    href: "/crypto-payments/hotels",
    desc: "Property Management System with room inventory, housekeeping tracking, and guest booking.",
    touchpoints: ["Room Inventory", "Guest Booking", "Housekeeping Status"],
  },
  {
    title: "Freelancer & Services",
    icon: <Briefcase className="w-6 h-6 text-amber-500" />,
    color: "amber",
    href: "/crypto-payments/freelancers",
    desc: "Service business manager for flexible pricing, invoicing, project tracking, and client retainers.",
    touchpoints: ["Invoicing & Retainers", "Project Tracking", "Flexible Packages"],
  },
  {
    title: "Publishing & Bookstore",
    icon: <BookOpen className="w-6 h-6 text-fuchsia-400" />,
    color: "fuchsia",
    href: "/crypto-payments/publishing-bookstores",
    desc: "Digital bookstore and writer's workshop with manuscript management and direct reader integration.",
    touchpoints: ["Manuscript Management", "Osiris USBN", "Direct Royalties"],
  },
  {
    title: "Cannabis Dispensary",
    icon: <Leaf className="w-6 h-6 text-emerald-400" />,
    color: "emerald",
    href: "/cannabis",
    desc: "Fully compliant checkout with native METRC v2 and BioTrack integrations. No extra compliance fees.",
    touchpoints: ["Seed-to-Sale Tracking", "Automated METRC Sync", "Transfer Manifests"],
  },
  {
    title: "All Apps Included. Free.",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    color: "yellow",
    href: "/crypto-payments",
    desc: "Stop paying extra for compliance, table management, or inventory add-ons. Every industry tool is built-in and 100% free.",
    touchpoints: ["Zero Monthly Fees", "Unlimited Features", "No Upcharges"],
  },
];

export default function IndustryTouchpointsSection() {
  if (isPartnerContext()) return null;

  return (
    <section className="mt-8 relative py-12">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/[0.03] blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-pp-secondary w-fit mb-6">
            <LayoutGrid className="w-4 h-4" />
            Industry Packs
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Specialized solutions for every vertical.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Whether you&apos;re running a highly regulated dispensary, a high-volume restaurant, or a global e-commerce storefront, we provide targeted apps and touchpoints built exactly for your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {INDUSTRY_PACKS.map((pack, idx) => (
            <motion.div
              key={pack.title}
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="glass-pane rounded-[2rem] border border-white/10 p-6 flex flex-col group relative overflow-hidden shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                {pack.icon}
              </div>
              
              <h3 className="text-xl font-bold mb-2 tracking-tight">{pack.title}</h3>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed flex-grow">
                {pack.desc}
              </p>

              <div className="space-y-2 mb-6">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Key Touchpoints</div>
                {pack.touchpoints.map((tp, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-medium text-white/80">
                    <div className="w-1 h-1 rounded-full bg-white/30" />
                    {tp}
                  </div>
                ))}
              </div>

              <Link
                href={pack.href}
                className="inline-flex items-center gap-2 text-xs font-bold mt-auto group-hover:gap-3 transition-all text-white hover:text-white/80"
              >
                Explore {pack.title.split(' ')[0]}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
