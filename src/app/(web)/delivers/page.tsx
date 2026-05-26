"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { client, chain, getWallets } from "@/lib/thirdweb/client";
import { usePortalThirdwebTheme } from "@/lib/thirdweb/theme";
import { 
  User, 
  MapPin, 
  Search, 
  Sliders, 
  X, 
  Check, 
  ShoppingBag, 
  Phone, 
  Mail, 
  Compass, 
  ArrowLeft, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  Map as MapIcon,
  Navigation,
  Flame,
  Store,
  Home,
  Bike,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  Star,
  Globe,
  ChevronRight,
  Utensils
} from "lucide-react";

const ConnectButton = dynamic(() => import("thirdweb/react").then((m) => m.ConnectButton), { ssr: false });
const AWSLocationMap = dynamic(() => import("@/components/AWSLocationMap"), { ssr: false });

interface Shop {
  slug: string;
  name: string;
  description?: string;
  wallet: string;
  deliveryFee?: number;
  rating?: number;
  category?: string;
  theme?: {
    brandLogoUrl?: string;
    primaryColor?: string;
  };
}

interface InventoryItem {
  id: string;
  name: string;
  priceUsd: number;
  description?: string;
  category?: string;
  images?: string[];
  deliveryEnabled?: boolean;
}

interface CartItem {
  item: InventoryItem;
  quantity: number;
}

interface ShopperProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  searchRadius: number; // km
}

export default function DeliversStorefront() {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const twTheme = usePortalThirdwebTheme();

  // Guest login / auto-login state
  const [guestWallet, setGuestWallet] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pp:delivers:guest_wallet");
    }
    return null;
  });

  const activeAddress = account?.address || guestWallet || "";

  // Shopper Profile
  const [profile, setProfile] = useState<ShopperProfile>({
    name: "",
    phone: "",
    email: "",
    address: "",
    searchRadius: 10
  });

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Home view tab selector (dishes vs. kitchens)
  const [homeTab, setHomeTab] = useState<"dishes" | "restaurants">("dishes");
  const [globalDishes, setGlobalDishes] = useState<InventoryItem[]>([]);
  const [loadingGlobalDishes, setLoadingGlobalDishes] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingItemToAdd, setPendingItemToAdd] = useState<any | null>(null);

  // Connection & onboarding tabs
  const [loginTab, setLoginTab] = useState<"wallet" | "mobile">("wallet");
  const [mobileCredential, setMobileCredential] = useState("");
  const [isLoggingInMobile, setIsLoggingInMobile] = useState(false);

  const [wallets, setWallets] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Search & dynamic radius filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(10); // default km
  const [mapHoveredShop, setMapHoveredShop] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Checkout, Payment, & Order Tracking State
  const [checkingOut, setCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);

  // Load Thirdweb Wallets
  useEffect(() => {
    getWallets()
      .then((w) => setWallets(w as any[]))
      .catch(() => setWallets([]));
  }, []);

  // Load Persisted Shopper Profile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pp:delivers:shopper_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setSearchRadius(parsed.searchRadius || 10);
          if (parsed.name) setCustomerName(parsed.name);
          if (parsed.address) {
            setCustomerAddress(parsed.address);
            setSearchAddressInput(parsed.address);
            if (parsed.lat && parsed.lng) {
              setCustomerCoords({ lat: parsed.lat, lng: parsed.lng });
            } else {
              // Standardize coordinate resolution via backend AWS Location Service geocoder
              fetch("/api/delivers/geocode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: parsed.address })
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data.ok && data.coordinates) {
                    setCustomerCoords({
                      lat: data.coordinates.latitude,
                      lng: data.coordinates.longitude
                    });
                  }
                })
                .catch(() => {});
            }
          }
          if (parsed.phone) setCustomerPhone(parsed.phone);
        } catch (e) {
          console.error("Failed to load shopper profile:", e);
        }
      }
    }
  }, [activeAddress]);

  // Fetch shops with delivery enabled
  useEffect(() => {
    if (!activeAddress) return;

    async function loadShops() {
      try {
        setLoadingShops(true);
        const res = await fetch("/api/delivers/shops");
        const data = await res.json();
        if (data.ok) {
          // Map properties and add ratings deterministically if missing
          const mappedShops = (data.shops || []).map((s: any, idx: number) => ({
            ...s,
            rating: s.rating || Number((4.2 + (idx % 8) * 0.1).toFixed(1)),
            category: s.category || (idx % 3 === 0 ? "Italian" : idx % 3 === 1 ? "Mexican/Kitchen" : "Gourmet Burgers")
          }));
          setShops(mappedShops);
        }
      } catch (err) {
        console.error("Failed to load delivery shops:", err);
      } finally {
        setLoadingShops(false);
      }
    }
    loadShops();
  }, [activeAddress]);

  // Fetch global dishes across all kitchens
  useEffect(() => {
    if (!activeAddress) return;
    async function loadGlobalDishes() {
      try {
        setLoadingGlobalDishes(true);
        const res = await fetch("/api/delivers/items");
        const data = await res.json();
        if (data.ok) {
          setGlobalDishes(data.items);
        }
      } catch (err) {
        console.error("Failed to load global dishes:", err);
      } finally {
        setLoadingGlobalDishes(false);
      }
    }
    loadGlobalDishes();
  }, [activeAddress]);

  // Fetch items when a shop is selected
  useEffect(() => {
    if (!selectedShop) {
      setItems([]);
      setCart([]);
      return;
    }
    const slug = selectedShop.slug;

    async function loadItems() {
      try {
        setLoadingItems(true);
        const res = await fetch(`/api/delivers/items?shopSlug=${slug}`);
        const data = await res.json();
        if (data.ok) {
          setItems(data.items);
        }
      } catch (err) {
        console.error("Failed to load delivery items:", err);
      } finally {
        setLoadingItems(false);
      }
    }
    loadItems();
    setCart([]);
  }, [selectedShop]);

  // Direct checkout payment confirmation postMessage listener
  useEffect(() => {
    const handlePortalMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && (msg.type === "portalpay-card-success" || msg.type === "gateway-card-success")) {
        if (activeReceipt && msg.receiptId === activeReceipt.receiptId) {
          // Success! Transition out of payment iframe and proceed immediately
          setShowPaymentPortal(false);
          // Artificially push active receipt state so map tracker kicks off
          setActiveReceipt((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              localDelivery: {
                ...prev.localDelivery,
                deliveryStatus: "accepted" // Transition past pending immediately!
              }
            };
          });
        }
      }
    };

    window.addEventListener("message", handlePortalMessage);
    return () => window.removeEventListener("message", handlePortalMessage);
  }, [activeReceipt]);

  // Poll active order status & driver coordinate updates
  useEffect(() => {
    if (!activeReceipt) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/drive/jobs`);
        const data = await res.json();
        if (data.ok) {
          const currentJob = data.jobs.find((j: any) => j.receiptId === activeReceipt.receiptId);
          if (currentJob) {
            // Auto transition past payment if order status has updated from pending
            if (showPaymentPortal && currentJob.localDelivery?.deliveryStatus !== "pending") {
              setShowPaymentPortal(false);
            }
            setActiveReceipt(currentJob);
          }
        }
      } catch (err) {
        console.error("Error polling order status:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeReceipt, showPaymentPortal]);

  // Dynamic shopper location coordinates and autocomplete states
  const [customerCoords, setCustomerCoords] = useState({ lat: 34.0522, lng: -118.2437 });
  const [searchAddressInput, setSearchAddressInput] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  const handleAddressSearchChange = async (val: string) => {
    setSearchAddressInput(val);
    if (val.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const res = await fetch("/api/delivers/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: val })
      });
      const data = await res.json();
      if (data.ok) {
        setAddressSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Suggestions fetch error:", e);
    }
  };

  const handleSelectAddressSuggestion = async (addressText: string) => {
    setSearchAddressInput(addressText);
    setAddressSuggestions([]);
    setCustomerAddress(addressText);
    
    // Save to shopper profile
    setProfile(prev => {
      const updated = { ...prev, address: addressText };
      localStorage.setItem("pp:delivers:shopper_profile", JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch("/api/delivers/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addressText })
      });
      const data = await res.json();
      if (data.ok && data.coordinates) {
        const coords = { lat: data.coordinates.latitude, lng: data.coordinates.longitude };
        setCustomerCoords(coords);
        
        // Persist coordinates inside profile too
        setProfile(prev => {
          const updated = { ...prev, lat: coords.lat, lng: coords.lng };
          localStorage.setItem("pp:delivers:shopper_profile", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error("Geocoding fetch error:", e);
    }
  };

  const getShopCoords = (slug: string | null | undefined) => {
    const safeSlug = typeof slug === "string" ? slug : "";
    const hash = safeSlug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Disperse coords elegantly across a wider boundary so pins do not clump
    const latOffset = ((hash % 100) - 50) / 420; 
    const lngOffset = (((hash * 17) % 100) - 50) / 420;
    return {
      lat: customerCoords.lat + latOffset,
      lng: customerCoords.lng + lngOffset
    };
  };

  const getDistanceKm = (slug: string | null | undefined) => {
    if (!slug) return 999.9; // Return out of range distance to filter it out safely
    const coords = getShopCoords(slug);
    const dy = coords.lat - customerCoords.lat;
    const dx = coords.lng - customerCoords.lng;
    // 1 degree is roughly 111km
    return Number((Math.sqrt(dx * dx + dy * dy) * 111).toFixed(1));
  };

  // SVG Map Coordinates Converter
  // ViewBox is 400x400. Customer is centered at (200, 200)
  const getMapCoords = (slug: string | null | undefined) => {
    if (!slug) return { x: 200, y: 200 };
    const coords = getShopCoords(slug);
    const latDiff = coords.lat - customerCoords.lat;
    const lngDiff = coords.lng - customerCoords.lng;
    
    // Scale factor: 1 degree ~ 3000px on grid
    const scale = 2500;
    const x = 200 + lngDiff * scale;
    const y = 200 - latDiff * scale; // SVG Y is inverted
    return { x, y };
  };

  // Dynamic SVG Radius in Pixels
  const getRadiusPixels = (radiusKm: number) => {
    // 1 km = 2500 scale / 111 = 22.5 pixels
    return radiusKm * 22.5;
  };

  // Filtered Shops List (Radius + Search query keywords + Category)
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (!shop || !shop.slug) return false;
      const distance = getDistanceKm(shop.slug);
      const matchesRadius = distance <= searchRadius;
      
      const query = searchQuery.toLowerCase().trim();
      const matchesKeyword = !query || 
        shop.name.toLowerCase().includes(query) ||
        (shop.description && shop.description.toLowerCase().includes(query)) ||
        (shop.category && shop.category.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === "All" ||
        (shop.category && shop.category.toLowerCase().includes(selectedCategory.toLowerCase()));
        
      return matchesRadius && matchesKeyword && matchesCategory;
    });
  }, [shops, searchRadius, searchQuery, selectedCategory]);

  // Filtered Global Dishes List (Radius + Search query keywords + Category filtering based on the shop's category)
  const filteredDishes = useMemo(() => {
    return globalDishes.filter((dish) => {
      const shopSlug = (dish as any).shopSlug || "";
      const distance = getDistanceKm(shopSlug);
      const matchesRadius = distance <= searchRadius;

      const query = searchQuery.toLowerCase().trim();
      const matchesKeyword = !query || 
        dish.name.toLowerCase().includes(query) ||
        (dish.description && dish.description.toLowerCase().includes(query));

      const shop = shops.find((s) => s.slug === shopSlug);
      const matchesCategory = selectedCategory === "All" ||
        (shop && shop.category && shop.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchesRadius && matchesKeyword && matchesCategory;
    });
  }, [globalDishes, shops, searchRadius, searchQuery, selectedCategory]);

  // Cart operations
  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleAddGlobalDish = (item: InventoryItem, itemShopSlug: string) => {
    const targetShop = shops.find((s) => s.slug === itemShopSlug);
    if (!targetShop) return;

    if (cart.length > 0 && selectedShop && selectedShop.slug !== itemShopSlug) {
      setPendingItemToAdd({ item, shop: targetShop });
      setShowConflictModal(true);
      return;
    }

    // Otherwise, direct add is safe
    setSelectedShop(targetShop);
    addToCart(item);
  };

  const handleResolveConflict = () => {
    if (pendingItemToAdd) {
      setCart([]);
      setSelectedShop(pendingItemToAdd.shop);
      // Wait for React state to cycle
      setTimeout(() => {
        addToCart(pendingItemToAdd.item);
      }, 50);
      setShowConflictModal(false);
      setPendingItemToAdd(null);
    }
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.item.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  // Calculations
  const subtotal = cart.reduce((acc, curr) => acc + curr.item.priceUsd * curr.quantity, 0);
  const deliveryFee = selectedShop?.deliveryFee || 5.00;
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax + deliveryFee).toFixed(2));
  const platformFee = Number((total * 0.01).toFixed(2));

  // Handle mobile guest credential logins (Frictionless Web2 style auto-login)
  const handleMobileLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileCredential.trim()) return;
    
    setIsLoggingInMobile(true);
    // Simulate brief high-fidelity latency animation
    setTimeout(() => {
      const cred = mobileCredential.trim();
      const hash = cred.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mockWalletAddress = `0xGuest_${hash.toString(16).padEnd(6, "f")}_${Date.now().toString().slice(-4)}`;
      
      setGuestWallet(mockWalletAddress);
      if (typeof window !== "undefined") {
        localStorage.setItem("pp:delivers:guest_wallet", mockWalletAddress);
      }

      // Populate basic shopper profile
      const updatedProfile = {
        ...profile,
        phone: cred.includes("@") ? "" : cred,
        email: cred.includes("@") ? cred : "",
        name: profile.name || "Sleek Delivery Guest"
      };
      
      setProfile(updatedProfile);
      if (typeof window !== "undefined") {
        localStorage.setItem("pp:delivers:shopper_profile", JSON.stringify(updatedProfile));
      }
      
      if (updatedProfile.name) setCustomerName(updatedProfile.name);
      if (updatedProfile.phone) setCustomerPhone(updatedProfile.phone);

      setIsLoggingInMobile(false);
    }, 1200);
  };

  // Disconnect / Log out
  const handleSignOut = () => {
    if (guestWallet) {
      setGuestWallet(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("pp:delivers:guest_wallet");
      }
    } else if (activeWallet) {
      disconnect(activeWallet);
    }
    // Clear storefront selectors
    setSelectedShop(null);
    setCart([]);
    setActiveReceipt(null);
  };

  // Save changes to Shopper Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileChanges(profile);
    setShowProfileDrawer(false);
  };

  const saveProfileChanges = (newProfile: ShopperProfile) => {
    setProfile(newProfile);
    if (newProfile.name) setCustomerName(newProfile.name);
    if (newProfile.address) {
      setCustomerAddress(newProfile.address);
      setSearchAddressInput(newProfile.address);
      // Dynamically geocode the new primary address to refresh coordinates and radar scattering
      fetch("/api/delivers/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newProfile.address })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.coordinates) {
            const coords = { lat: data.coordinates.latitude, lng: data.coordinates.longitude };
            setCustomerCoords(coords);
            const savedProfile = { ...newProfile, lat: coords.lat, lng: coords.lng };
            localStorage.setItem("pp:delivers:shopper_profile", JSON.stringify(savedProfile));
          }
        })
        .catch(() => {});
    }
    if (newProfile.phone) setCustomerPhone(newProfile.phone);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp:delivers:shopper_profile", JSON.stringify(newProfile));
    }
  };

  // Handle Checkout Submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerAddress) {
      alert("Please fill out name and delivery address.");
      return;
    }

    try {
      setIsSubmittingOrder(true);
      const slug = selectedShop?.slug || "";
      const res = await fetch("/api/delivers/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: slug,
          items: cart.map((i) => ({ itemId: i.item.id, quantity: i.quantity })),
          customerName,
          customerAddress,
          customerPhone,
          deliveryInstructions
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setActiveReceipt(data.receipt);
        setCart([]);
        setCheckingOut(false);
        setShowPaymentPortal(true); // Open the Payment Portal iframe checkout experience
      } else {
        alert(data.error || "Failed to place delivery order");
      }
    } catch (err) {
      console.error(err);
      alert("Error placing order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Local development bypass to skip payment and start delivery
  const handleSkipPayment = async () => {
    if (!activeReceipt) return;
    try {
      const res = await fetch("/api/drive/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "location",
          receiptId: activeReceipt.receiptId,
          location: { lat: 34.0522, lng: -118.2437 } // Los Angeles coords
        })
      });
      const data = await res.json();
      if (data.ok) {
        setShowPaymentPortal(false);
      }
    } catch (err) {
      console.error("Bypass error:", err);
    }
  };

  // Driver Active Location and Routing Vector Calculations for SVG
  const mapTrackingPath = useMemo(() => {
    if (!activeReceipt) return null;
    const shopSlug = activeReceipt.shopSlug;
    const shopCoords = getMapCoords(shopSlug);
    
    // Customer is always centered at (200, 200)
    const customerCoords = { x: 200, y: 200 };
    return { shopCoords, customerCoords };
  }, [activeReceipt]);

  // Compute Animated Driver 🛵 coordinate on SVG map during transit
  const driverPercentProgress = useMemo(() => {
    if (!activeReceipt) return 0;
    const status = activeReceipt.localDelivery?.deliveryStatus || "pending";
    if (status === "accepted") return 0.25;
    if (status === "in_transit") return 0.65;
    if (status === "completed") return 1.00;
    return 0;
  }, [activeReceipt]);

  const animatedDriverCoords = useMemo(() => {
    const path = mapTrackingPath;
    if (!path) return { x: 0, y: 0 };
    
    const dx = path.customerCoords.x - path.shopCoords.x;
    const dy = path.customerCoords.y - path.shopCoords.y;
    return {
      x: path.shopCoords.x + dx * driverPercentProgress,
      y: path.shopCoords.y + dy * driverPercentProgress
    };
  }, [mapTrackingPath, driverPercentProgress]);

  // --- CINEMATIC DUAL-MODE CUSTOMER LOGIN PANEL (If not authenticated) ---
  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-[#090b10] text-[#f4f4f7] font-sans antialiased flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glowing plexus plasma effects */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#35ff7c]/5 rounded-full filter blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-blue-500/5 rounded-full filter blur-[150px] pointer-events-none" />
        
        {/* Dynamic decorative backdrop grids */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#11121a]/85 backdrop-blur-2xl border border-white/[0.05] rounded-[36px] p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-6">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-[#35ff7c] to-blue-500" />
          
          {/* Brand Logo Header (Using Surge.png asset with fallback) */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#35ff7c] to-blue-500 p-[1.5px] flex items-center justify-center shadow-lg shadow-[#35ff7c]/10 relative overflow-hidden group">
              <div className="absolute inset-[1px] bg-[#0a0b10] rounded-[22px] flex items-center justify-center">
                <img 
                  src="/Surge.png" 
                  alt="Surge Logo" 
                  className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    // Show styled fallback inside slot
                    const fallbackEl = document.getElementById("surge-fallback");
                    if (fallbackEl) fallbackEl.style.display = 'flex';
                  }}
                />
                <div id="surge-fallback" className="hidden w-full h-full items-center justify-center font-bold text-[#35ff7c] text-3xl">S</div>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-4">Basalt<span className="text-[#35ff7c]">Delivers</span></h1>
            <p className="text-xs font-mono text-[#35ff7c] uppercase tracking-widest">Commission-free Local Delivery</p>
          </div>

          {/* Interactive Login Mode Switcher Tabs */}
          <div className="p-1 rounded-2xl bg-black/40 border border-white/5 flex gap-1 relative z-10">
            <button
              onClick={() => setLoginTab("wallet")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                loginTab === "wallet" ? "bg-white/10 text-white shadow-inner" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Web3 Wallet</span>
            </button>
            <button
              onClick={() => setLoginTab("mobile")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                loginTab === "mobile" ? "bg-white/10 text-white shadow-inner" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Guest</span>
            </button>
          </div>

          <div className="min-h-[140px] flex flex-col justify-center">
            {/* Wallet tab connect button panel */}
            {loginTab === "wallet" ? (
              <div className="space-y-4 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  Connect your smart Ethereum / Base Web3 wallet to authorize payments and browse commission-free restaurant kitchens instantly.
                </p>
                <div className="pt-2 flex justify-center w-full">
                  {wallets.length > 0 ? (
                    <ConnectButton
                      client={client}
                      chain={chain}
                      wallets={wallets}
                      connectButton={{
                        label: "CONNECT SMART WALLET",
                        className: "!text-black !bg-[#35ff7c] !rounded-2xl !px-6 !py-4 !h-auto !w-full !font-sans !text-xs !tracking-widest !font-extrabold !border-none !shadow-xl !shadow-[#35ff7c]/10 transition-all hover:bg-[#35ff7c]/80 active:scale-95",
                      }}
                      connectModal={{ size: "compact", showThirdwebBranding: false }}
                      theme={twTheme}
                    />
                  ) : (
                    <div className="w-full h-12 bg-white/5 animate-pulse rounded-2xl" />
                  )}
                </div>
              </div>
            ) : (
              /* Mobile tab phone/email guest login form */
              <form onSubmit={handleMobileLoginSubmit} className="space-y-4">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Enter your Phone Number or Email address to enter as a guest. No gas fees or sign-ups required to browse menus.
                </p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. (555) 019-9233 or user@gmail.com"
                      className="w-full h-12 px-4 rounded-2xl bg-black/30 border border-white/10 text-sm text-white placeholder-muted-foreground/60 focus:border-[#35ff7c]/50 focus:ring-0 focus:outline-none transition-all duration-300 font-semibold"
                      value={mobileCredential}
                      onChange={(e) => setMobileCredential(e.target.value)}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoggingInMobile}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#35ff7c] to-emerald-500 text-black font-extrabold text-xs tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[#35ff7c]/10 active:scale-[0.99]"
                  >
                    {isLoggingInMobile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>ENTERING GATEWAY...</span>
                      </>
                    ) : (
                      <span>BROWSE LOCAL KITCHENS</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="border-t border-white/[0.05] pt-4 text-center">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">SECURED BY PORTALPAY ENCRYPTED BRIDGE</span>
          </div>
        </div>
      </div>
    );
  }

  // --- IFRAME-EMBEDDED SECURE PAYMENT PORTAL CHECKOUT ---
  if (showPaymentPortal && activeReceipt) {
    return (
      <div className="min-h-screen bg-[#090b10] text-[#f4f4f7] py-8 px-4 flex justify-center items-center">
        <div className="max-w-2xl w-full bg-[#11121a]/85 backdrop-blur-xl border border-white/[0.05] rounded-[36px] p-6 md:p-8 shadow-2xl relative space-y-6">
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Complete Secure Payment</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Please pay to authorize your delivery order.</p>
            </div>
            <button
              onClick={handleSkipPayment}
              className="text-[10px] px-3.5 py-1.5 rounded-full bg-[#35ff7c]/10 border border-[#35ff7c]/20 hover:bg-[#35ff7c]/20 text-[#35ff7c] font-semibold transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Local Dev: Skip Payment</span>
            </button>
          </div>

          {/* Secure Payment Portal Embed */}
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#161722] relative h-[520px]">
            <iframe
              src={`/portal/${activeReceipt.receiptId}?fs=1`}
              className="w-full h-full border-none"
              title="Secure Payment Portal"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
            <span>SECURE PAYMENT BY PORTALPAY</span>
            <span className="animate-pulse text-[#35ff7c] flex items-center gap-1">● WAITING FOR TRANSACTION CONFIRMATION</span>
          </div>
        </div>
      </div>
    );
  }

  // --- LIVE ORDER TRACKER PANEL ---
  if (activeReceipt) {
    const delivery = activeReceipt.localDelivery || {};
    const status = delivery.deliveryStatus || "pending";
    const statusSteps = ["pending", "accepted", "in_transit", "completed"];
    const statusLabels = ["Preparing Menu", "Driver Dispatched", "Out for Delivery", "Delivered"];
    const currentStepIndex = statusSteps.indexOf(status);

    return (
      <div className="min-h-screen bg-[#090b10] text-[#f4f4f7] font-sans antialiased py-8 px-4 flex justify-center items-center">
        <div className="max-w-2xl w-full bg-[#11121a]/85 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Dynamic background lights */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#35ff7c]/5 rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Navigation className="w-6 h-6 text-[#35ff7c] animate-pulse" />
                <span>Local Delivery Tracking</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Receipt ID: <span className="font-mono text-[#35ff7c]">{activeReceipt.receiptId}</span></p>
            </div>
            <button
              onClick={() => {
                setActiveReceipt(null);
                setSelectedShop(null);
              }}
              className="text-xs px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-semibold"
            >
              Order Again
            </button>
          </div>

          {/* High-Fidelity Active Map / SVG Tracker Map (Centered) */}
          <div className="w-full h-56 bg-[#0c0d13] rounded-3xl border border-white/[0.05] relative overflow-hidden mb-6 flex items-center justify-center">
            {process.env.NEXT_PUBLIC_AWS_MAP_API_KEY ? (
              <AWSLocationMap
                customerCoords={customerCoords}
                shops={shops}
                searchRadius={searchRadius}
                selectedShop={selectedShop}
                onSelectShop={setSelectedShop}
                activeReceipt={activeReceipt}
                getShopCoords={getShopCoords}
                getDistanceKm={getDistanceKm}
                showControls={true}
              />
            ) : (
              <>
                {/* Holographic grids lines */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090b10] to-[#090b10] opacity-80" />
                
                {/* SVG Canvas Map Overlay */}
                {mapTrackingPath && (
                  <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 400 220">
                    {/* Radial grid waves */}
                    <circle cx="200" cy="110" r="45" fill="none" stroke="#35ff7c" strokeWidth="0.5" strokeDasharray="3,6" className="opacity-20" />
                    <circle cx="200" cy="110" r="90" fill="none" stroke="#35ff7c" strokeWidth="0.5" strokeDasharray="3,6" className="opacity-20" />
                    
                    {/* Visual Route Path Line */}
                    <path
                      d={`M ${mapTrackingPath.shopCoords.x} ${mapTrackingPath.shopCoords.y} L 200 110`}
                      fill="none"
                      stroke="url(#routeGlow)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="4,4"
                      className="opacity-70 animate-[dash_20s_linear_infinite]"
                    />
                    
                    <defs>
                      <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#35ff7c" />
                      </linearGradient>
                    </defs>
                    
                    {/* Kitchen Pin */}
                    <g transform={`translate(${mapTrackingPath.shopCoords.x - 10}, ${mapTrackingPath.shopCoords.y - 20})`}>
                      <circle cx="10" cy="10" r="14" fill="#3b82f6" className="opacity-15" />
                      <g transform="translate(10, 10)">
                        <rect x="-5" y="-5" width="10" height="10" rx="1.5" fill="#3b82f6" />
                        <polygon points="-3,2 0,-3 3,2" fill="#ffffff" />
                      </g>
                    </g>
                    
                    {/* Customer Home Pin */}
                    <g transform="translate(190, 95)">
                      <circle cx="10" cy="10" r="14" fill="#35ff7c" className="opacity-20 animate-ping" />
                      <circle cx="10" cy="10" r="10" fill="#35ff7c" className="opacity-20" />
                      <g transform="translate(10, 10)">
                        <rect x="-5" y="-2" width="10" height="7" rx="1" fill="#35ff7c" />
                        <polygon points="-7,-2 0,-8 7,-2" fill="#35ff7c" />
                      </g>
                    </g>
                    
                    {/* Animated Driver Pin */}
                    {status !== "pending" && status !== "completed" && (
                      <g transform={`translate(${animatedDriverCoords.x - 10}, ${animatedDriverCoords.y - 10})`}>
                        <circle cx="10" cy="10" r="10" fill="#35ff7c" className="animate-ping opacity-30" />
                        <circle cx="10" cy="10" r="7" fill="#35ff7c" />
                        <g transform="translate(10, 10) scale(0.6)">
                          <circle cx="-3" cy="3" r="3" fill="#000000" />
                          <circle cx="3" cy="3" r="3" fill="#000000" />
                          <path d="M -3,0 L 3,-2 L 2,-6 L -1,-6 Z" fill="#ffffff" />
                        </g>
                      </g>
                    )}
                  </svg>
                )}
                
                <div className="absolute bottom-3 left-4 text-[9px] text-[#35ff7c] font-mono uppercase tracking-widest z-20 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35ff7c] animate-ping" />
                  <span>RADAR STREAMING: {status === "in_transit" ? "TRANSIT_PATH" : "CALCULATING_ROUTE"}</span>
                </div>
                
                <div className="absolute bottom-3 right-4 text-[9px] text-muted-foreground font-mono z-20 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                  EST. TIME: {status === "completed" ? "0 MIN" : status === "in_transit" ? "4 MIN" : "12 MIN"}
                </div>
              </>
            )}
          </div>

          {/* Stepper Progress */}
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-2">
              {statusLabels.map((lbl, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={`step-${lbl}-${idx}`} className="flex flex-col items-center text-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent ? "bg-[#35ff7c] text-black shadow-lg shadow-[#35ff7c]/30 scale-105" : isActive ? "bg-[#35ff7c]/20 text-[#35ff7c] border border-[#35ff7c]/30" : "bg-white/5 text-white/30 border border-white/10"
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] md:text-xs mt-2 font-medium tracking-tight ${
                      isActive ? "text-white" : "text-muted-foreground/60"
                    }`}>{lbl}</span>
                  </div>
                );
              })}
            </div>

            {/* Driver Profile Panel */}
            {delivery.driverWallet && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-[#35ff7c] p-[1px] flex items-center justify-center shadow-inner">
                    <div className="w-full h-full bg-[#11121a] rounded-xl flex items-center justify-center">
                      <Bike className="w-5 h-5 text-[#35ff7c]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{delivery.driverName || "Assigned Driver"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Wallet: {delivery.driverWallet.slice(0, 6)}...{delivery.driverWallet.slice(-4)}</div>
                  </div>
                </div>
                {delivery.driverPhone && (
                  <a 
                    href={`tel:${delivery.driverPhone}`}
                    className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-semibold text-white gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>Call Driver</span>
                  </a>
                )}
              </div>
            )}

            {/* Proof of Delivery Image */}
            {delivery.photoUrl && (
              <div className="mt-4 rounded-2xl border border-[#35ff7c]/20 p-4 bg-[#35ff7c]/5 flex flex-col items-center text-center">
                <div className="text-xs font-semibold text-[#35ff7c] uppercase tracking-wider mb-2">Delivery Confirmed with Photo Proof</div>
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10 bg-[#161722]">
                  <img src={delivery.photoUrl} alt="Delivery Proof" className="w-full h-full object-cover" />
                </div>
                <div className="text-[10px] text-muted-foreground/80 mt-2">Delivered at: {new Date(delivery.completedAt || Date.now()).toLocaleTimeString()}</div>
              </div>
            )}

            {/* Order Details Panel */}
            <div className="border-t border-white/[0.05] pt-6 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Destination</div>
              <div className="text-sm">
                <p className="font-semibold text-white">{delivery.customerName}</p>
                <p className="text-muted-foreground mt-0.5">{delivery.customerAddress}</p>
                {delivery.customerPhone && <p className="text-muted-foreground mt-0.5">Phone: {delivery.customerPhone}</p>}
                {delivery.deliveryInstructions && (
                  <div className="mt-2 text-xs p-3 rounded-lg bg-white/[0.02] border border-white/5 italic text-muted-foreground">
                    " {delivery.deliveryInstructions} "
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#f4f4f7] font-sans antialiased flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#35ff7c]/5 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-[#3b82f6]/5 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Header Panel */}
      <header className="border-b border-white/[0.05] py-4 px-6 md:px-8 bg-[#11121a]/85 backdrop-blur-xl sticky top-0 z-[100] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#35ff7c] to-blue-500 p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0b10] rounded-xl flex items-center justify-center relative overflow-hidden group">
              <img 
                src="/Surge.png" 
                alt="Surge Logo" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fb = document.getElementById("header-fb");
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div id="header-fb" className="hidden w-full h-full items-center justify-center font-bold text-[#35ff7c]">S</div>
            </div>
          </div>
          <span className="font-bold tracking-tight text-white">Basalt<span className="text-[#35ff7c]">Delivers</span></span>
        </div>

        <div className="flex items-center gap-3">
          {/* Shopper Profile Trigger */}
          <button
            onClick={() => setShowProfileDrawer(true)}
            className="text-xs px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-white font-semibold"
          >
            <User className="w-3.5 h-3.5 text-[#35ff7c]" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          <Link
            href="/drive"
            className="text-xs px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-semibold"
          >
            Driver Portal
          </Link>

          <button
            onClick={handleSignOut}
            className="text-[10px] px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-semibold"
          >
            Sign Out
          </button>
          
          {selectedShop && (
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2.5 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center border border-white/5 bg-black/30"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#35ff7c] text-black font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg shadow-[#35ff7c]/20">
                  {cart.reduce((a, c) => a + c.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Beautiful Map Hero Section (Visible only when viewing storefront kitchens/dishes and not in checkout/tracker) */}
      {!selectedShop && !checkingOut && !activeReceipt && (
        <section className="w-full max-w-7xl mx-auto px-4 pt-6 relative z-20">
          <div className="h-[360px] md:h-[420px] rounded-[32px] overflow-hidden border border-white/[0.08] bg-[#0c0d13] relative shadow-2xl transition-all duration-500">
            
            {/* Glowing glassmorphic controllers */}
            
            {/* 1. Address search geocoder overlay */}
            <div className="absolute top-4 left-4 z-30 max-w-[280px] sm:max-w-[360px] bg-[#11121a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-[#35ff7c] animate-pulse" />
                <span className="text-[10px] text-white/80 font-mono font-black uppercase tracking-wider">YOUR LOCATION</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search standardized delivery address..."
                  className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white placeholder:text-muted-foreground/60 focus:border-[#35ff7c]/50 focus:outline-none transition-all font-semibold"
                  value={searchAddressInput}
                  onChange={(e) => handleAddressSearchChange(e.target.value)}
                />
                {addressSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-10 bg-[#11121a]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[500] font-sans">
                    {addressSuggestions.map((s: any, idx: number) => (
                      <div
                        key={`addr-sug-${idx}`}
                        onClick={() => handleSelectAddressSuggestion(s.text)}
                        className="px-3.5 py-2 text-[10px] text-muted-foreground hover:text-white hover:bg-white/5 cursor-pointer border-b border-white/[0.03] last:border-b-0 transition-colors flex items-center gap-1.5"
                      >
                        <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                        <span className="line-clamp-1">{s.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Radius boundary KM range slider overlay */}
            <div className="absolute top-4 right-4 z-30 bg-[#11121a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col space-y-2 select-none w-[140px] sm:w-[180px]">
              <div className="flex justify-between items-center text-[10px] font-mono font-black text-white/80 uppercase tracking-wider">
                <span>RADIUS</span>
                <span className="text-[#35ff7c]">{searchRadius} KM</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#35ff7c]"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
              />
              <div className="flex justify-between text-[8px] font-mono text-muted-foreground/60">
                <span>2 KM</span>
                <span>15 KM</span>
              </div>
            </div>

            {/* 3. Horizontal scrolling local business tags */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none max-w-[calc(100%-180px)] pr-4">
              {filteredShops.map((shop, idx) => {
                const distance = getDistanceKm(shop.slug);
                return (
                  <button
                    key={`hero-tag-${shop.slug}-${idx}`}
                    onClick={() => {
                      setSelectedShop(shop);
                    }}
                    className="px-3.5 py-2 rounded-full bg-[#11121a]/95 backdrop-blur-xl border border-white/10 hover:border-[#35ff7c] hover:bg-[#35ff7c]/10 text-white hover:text-[#35ff7c] font-sans text-[10px] font-bold flex items-center gap-1.5 transition-all duration-300 shadow-xl shrink-0 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35ff7c]" />
                    <span>{shop.name}</span>
                    <span className="text-muted-foreground font-mono text-[9px]">{distance}km</span>
                    <span className="text-[#35ff7c]">★ {shop.rating}</span>
                  </button>
                );
              })}
              {filteredShops.length === 0 && (
                <div className="px-3.5 py-2 rounded-full bg-[#11121a]/95 backdrop-blur-xl border border-white/5 text-muted-foreground font-mono text-[9px]">
                  NO ACTIVE KITCHENS IN THIS RADIUS
                </div>
              )}
            </div>

            {/* 4. Go Full Screen immersive map button */}
            <button
              onClick={() => setShowFullscreenMap(true)}
              className="absolute bottom-4 right-4 z-30 h-10 px-4 rounded-xl bg-[#11121a]/90 backdrop-blur-xl border border-white/10 hover:border-[#35ff7c]/30 hover:bg-[#35ff7c]/10 text-white hover:text-[#35ff7c] font-sans text-xs font-bold flex items-center gap-1.5 shadow-2xl active:scale-[0.97] cursor-pointer"
            >
              <MapIcon className="w-4 h-4 shrink-0" />
              <span>Go Full Screen</span>
            </button>

            {/* The actual map inside Hero section */}
            <div className="w-full h-full relative">
              {process.env.NEXT_PUBLIC_AWS_MAP_API_KEY ? (
                <AWSLocationMap
                  customerCoords={customerCoords}
                  shops={filteredShops}
                  searchRadius={searchRadius}
                  selectedShop={selectedShop}
                  onSelectShop={setSelectedShop}
                  activeReceipt={activeReceipt}
                  getShopCoords={getShopCoords}
                  getDistanceKm={getDistanceKm}
                  showControls={false}
                />
              ) : (
                <>
                  {/* Cyberpunk Grid/Street Overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  
                  {/* Rotating Radar Conic-Gradient Sweep */}
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-2xl animate-[spin_10s_linear_infinite]"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 50%, rgba(53, 255, 124, 0.08) 100%)",
                    }}
                  />

                  {/* SVG Active Radar Map */}
                  <svg className="w-full h-full absolute inset-0 z-10 animate-fade-in" viewBox="0 0 400 400">
                    {/* Grid Matrix Street Lines */}
                    <line x1="0" y1="200" x2="400" y2="200" stroke="#35ff7c" strokeWidth="1" strokeOpacity="0.08" />
                    <line x1="200" y1="0" x2="200" y2="400" stroke="#35ff7c" strokeWidth="1" strokeOpacity="0.08" />
                    <line x1="0" y1="0" x2="400" y2="400" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.05" />
                    <line x1="400" y1="0" x2="0" y2="400" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.05" />
                    
                    {/* Concentric Proximity Zone indicators */}
                    <circle cx="200" cy="200" r="56.25" fill="none" stroke="#35ff7c" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3,6" />
                    <circle cx="200" cy="200" r="112.5" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="4,8" />
                    <circle cx="200" cy="200" r="225" fill="none" stroke="#35ff7c" strokeWidth="0.5" strokeOpacity="0.05" />
                    
                    {/* Dynamic Proximity Boundary ring */}
                    <circle 
                      cx="200" 
                      cy="200" 
                      r={getRadiusPixels(searchRadius)} 
                      fill="rgba(53, 255, 124, 0.015)" 
                      stroke="#35ff7c" 
                      strokeWidth="1.5" 
                      strokeOpacity="0.3" 
                      strokeDasharray="4,4"
                    />
                    
                    {/* Tactical YOU center coordinate locator */}
                    <g transform="translate(200, 200)">
                      <circle cx="0" cy="0" r="10" fill="none" stroke="#35ff7c" strokeWidth="1" strokeOpacity="0.3" className="animate-ping" />
                      <circle cx="0" cy="0" r="5" fill="#35ff7c" />
                      <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                    </g>
                    
                    {/* Pins */}
                    {filteredShops.map((shop, idx) => {
                      const mapCoords = getMapCoords(shop.slug);
                      const isHovered = mapHoveredShop === shop.slug;
                      const label = (shop.name || "SHP").substring(0, 3).toUpperCase();
                      const primaryColor = isHovered ? "#35ff7c" : "#3b82f6";
                      
                      return (
                        <g 
                          key={`map-pin-${shop.slug}-${idx}`} 
                          transform={`translate(${mapCoords.x}, ${mapCoords.y})`}
                          className="cursor-pointer"
                          onClick={() => setSelectedShop(shop)}
                          onMouseEnter={() => setMapHoveredShop(shop.slug)}
                          onMouseLeave={() => setMapHoveredShop(null)}
                        >
                          <circle cx="0" cy="0" r={isHovered ? 20 : 16} fill="none" stroke={primaryColor} strokeWidth="1.5" strokeOpacity="0.7" style={{ filter: `drop-shadow(0 0 4px ${primaryColor}80)` }} />
                          <circle cx="0" cy="0" r={isHovered ? 15 : 12} fill="#090b10" stroke={primaryColor} strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize={isHovered ? "8" : "7"} fontWeight="bold" fontFamily="monospace" className="select-none">{label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FULL SCREEN IMMERSIVE MAP VIEW */}
      {showFullscreenMap && (
        <div className="fixed inset-0 z-[2000] bg-[#090b10] flex flex-col animate-in fade-in duration-300">
          {/* Header */}
          <div className="bg-[#11121a] border-b border-white/[0.05] p-4 flex justify-between items-center z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#35ff7c] to-blue-500 p-[1px] flex items-center justify-center animate-pulse">
                <div className="w-full h-full bg-[#0a0b10] rounded-lg flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-[#35ff7c]" />
                </div>
              </div>
              <div>
                <span className="font-bold text-white text-sm">Basalt<span className="text-[#35ff7c]">Delivers</span> Immersive Map</span>
                <p className="text-[9px] text-muted-foreground font-mono">LOCKED_LOCATIONS: {filteredShops.length} NODES</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Address */}
              <div className="relative w-48 sm:w-64">
                <input
                  type="text"
                  placeholder="Search standardized address..."
                  className="w-full h-8 px-3 rounded-lg bg-black/40 border border-white/10 text-[10px] text-white focus:border-[#35ff7c]/50 focus:outline-none transition-all placeholder:text-muted-foreground/60 font-semibold"
                  value={searchAddressInput}
                  onChange={(e) => handleAddressSearchChange(e.target.value)}
                />
                {addressSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-9 bg-[#11121a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[500] font-sans">
                    {addressSuggestions.map((s: any, idx: number) => (
                      <div
                        key={`fs-addr-sug-${idx}`}
                        onClick={() => handleSelectAddressSuggestion(s.text)}
                        className="px-3.5 py-2 text-[10px] text-muted-foreground hover:text-white hover:bg-white/5 cursor-pointer border-b border-white/[0.03] last:border-b-0 transition-colors flex items-center gap-1.5"
                      >
                        <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                        <span className="line-clamp-1">{s.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowFullscreenMap(false)}
                className="p-1.5 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Immersive Map Container */}
          <div className="flex-1 w-full relative">
            {process.env.NEXT_PUBLIC_AWS_MAP_API_KEY ? (
              <AWSLocationMap
                customerCoords={customerCoords}
                shops={filteredShops}
                searchRadius={searchRadius}
                selectedShop={selectedShop}
                onSelectShop={(shop) => {
                  setSelectedShop(shop);
                  setShowFullscreenMap(false);
                }}
                activeReceipt={activeReceipt}
                getShopCoords={getShopCoords}
                getDistanceKm={getDistanceKm}
                showControls={true}
              />
            ) : (
              <>
                {/* Cyberpunk Grid/Street Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                
                {/* Rotating Radar Conic-Gradient Sweep */}
                <div 
                  className="absolute inset-0 pointer-events-none rounded-2xl animate-[spin_10s_linear_infinite]"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 50%, rgba(53, 255, 124, 0.08) 100%)",
                  }}
                />

                {/* SVG Active Radar Map */}
                <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 400 400" preserveAspectRatio="none">
                  <line x1="0" y1="200" x2="400" y2="200" stroke="#35ff7c" strokeWidth="1" strokeOpacity="0.08" />
                  <line x1="200" y1="0" x2="200" y2="400" stroke="#35ff7c" strokeWidth="1" strokeOpacity="0.08" />
                  <circle cx="200" cy="200" r="56.25" fill="none" stroke="#35ff7c" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3,6" />
                  <circle cx="200" cy="200" r="112.5" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="4,8" />
                  <circle cx="200" cy="200" r="225" fill="none" stroke="#35ff7c" strokeWidth="0.5" strokeOpacity="0.05" />
                  
                  <circle 
                    cx="200" 
                    cy="200" 
                    r={getRadiusPixels(searchRadius)} 
                    fill="rgba(53, 255, 124, 0.015)" 
                    stroke="#35ff7c" 
                    strokeWidth="1.5" 
                    strokeOpacity="0.3" 
                    strokeDasharray="4,4"
                  />
                  
                  <g transform="translate(200, 200)">
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#35ff7c" strokeWidth="1" strokeOpacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="5" fill="#35ff7c" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                  </g>
                  
                  {filteredShops.map((shop, idx) => {
                    const mapCoords = getMapCoords(shop.slug);
                    const isHovered = mapHoveredShop === shop.slug;
                    const label = (shop.name || "SHP").substring(0, 3).toUpperCase();
                    const primaryColor = isHovered ? "#35ff7c" : "#3b82f6";
                    
                    return (
                      <g 
                        key={`fs-map-pin-${shop.slug}-${idx}`} 
                        transform={`translate(${mapCoords.x}, ${mapCoords.y})`}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedShop(shop);
                          setShowFullscreenMap(false);
                        }}
                        onMouseEnter={() => setMapHoveredShop(shop.slug)}
                        onMouseLeave={() => setMapHoveredShop(null)}
                      >
                        <circle cx="0" cy="0" r={isHovered ? 20 : 16} fill="none" stroke={primaryColor} strokeWidth="1.5" strokeOpacity="0.7" style={{ filter: `drop-shadow(0 0 4px ${primaryColor}80)` }} />
                        <circle cx="0" cy="0" r={isHovered ? 15 : 12} fill="#090b10" stroke={primaryColor} strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize={isHovered ? "8" : "7"} fontWeight="bold" fontFamily="monospace" className="select-none">{label}</text>
                      </g>
                    );
                  })}
                </svg>
              </>
            )}
            
            {/* Left sidebar floating list of local kitchens inside full screen map */}
            <div className="absolute top-4 left-4 z-30 w-64 bg-[#11121a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col space-y-3 max-h-[calc(100%-80px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex justify-between items-center text-[10px] font-mono font-black text-white/80 uppercase tracking-wider border-b border-white/5 pb-2">
                <span>NEARBY KITCHENS</span>
                <span className="text-[#35ff7c]">{filteredShops.length} FOUND</span>
              </div>
              
              <div className="space-y-2">
                {filteredShops.map((shop, idx) => {
                  const distance = getDistanceKm(shop.slug);
                  return (
                    <button
                      key={`fs-list-${shop.slug}-${idx}`}
                      onClick={() => {
                        setSelectedShop(shop);
                        setShowFullscreenMap(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#35ff7c]/30 hover:bg-[#35ff7c]/5 flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-[#35ff7c] transition-colors">{shop.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{shop.category}</p>
                      </div>
                      <div className="text-right font-mono text-[9px]">
                        <p className="text-[#35ff7c]">★ {shop.rating}</p>
                        <p className="text-muted-foreground mt-0.5">{distance}km</p>
                      </div>
                    </button>
                  );
                })}
                {filteredShops.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/60 text-center py-4">No active kitchens in range.</p>
                )}
              </div>
            </div>

            {/* Radius control slider inside full screen map */}
            <div className="absolute bottom-4 right-4 z-30 bg-[#11121a]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col space-y-2 select-none w-48">
              <div className="flex justify-between items-center text-[10px] font-mono font-black text-white/80 uppercase tracking-wider">
                <span>RADIUS BOUNDARY</span>
                <span className="text-[#35ff7c]">{searchRadius} KM</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#35ff7c]"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
              />
              <div className="flex justify-between text-[8px] font-mono text-muted-foreground/60">
                <span>2 KM</span>
                <span>15 KM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KITCHEN BROWSER AND CHECKOUT (Utilizes full width when browsing) */}
        <div className="col-span-1 lg:col-span-12">
          
          {/* Step 1: Browse Shops Grid */}
          {!selectedShop && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Delivery Kitchens</h1>
                  <p className="text-muted-foreground mt-1">Sleek Web3 restaurant storefronts operating in your proximity radius.</p>
                </div>
                
                {/* Live Keyword Search Input */}
                <div className="relative w-full md:w-72">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search dishes, tags, kitchens..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#11121a]/80 border border-white/5 text-xs text-white focus:border-[#35ff7c]/50 focus:outline-none transition-all placeholder:text-muted-foreground/60 font-semibold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Divided Storefront Tabs & Cuisine Filters Switcher */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="p-1 rounded-2xl bg-black/40 border border-white/5 flex gap-1 w-full md:w-80 shrink-0">
                  <button
                    onClick={() => setHomeTab("dishes")}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      homeTab === "dishes" 
                        ? "bg-[#35ff7c]/15 text-[#35ff7c] border border-[#35ff7c]/30 shadow-md shadow-[#35ff7c]/5" 
                        : "text-muted-foreground hover:text-white border border-transparent"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Popular Dishes</span>
                  </button>
                  <button
                    onClick={() => setHomeTab("restaurants")}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      homeTab === "restaurants" 
                        ? "bg-[#35ff7c]/15 text-[#35ff7c] border border-[#35ff7c]/30 shadow-md shadow-[#35ff7c]/5" 
                        : "text-muted-foreground hover:text-white border border-transparent"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Active Kitchens</span>
                  </button>
                </div>

                {/* Glowing Glassmorphic Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 w-full md:w-auto">
                  {["All", "Italian", "Mexican", "Burgers", "Gourmet"].map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={`cat-tab-${cat}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer shrink-0 ${
                          isActive
                            ? "bg-[#35ff7c]/10 text-[#35ff7c] border-[#35ff7c]/30 shadow-md shadow-[#35ff7c]/5"
                            : "bg-white/5 text-muted-foreground border-white/5 hover:text-white hover:border-white/10"
                        }`}
                      >
                        {cat === "All" ? (
                          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /><span>All Cuisines</span></span>
                        ) : cat === "Italian" ? (
                          <span className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5" /><span>Italian</span></span>
                        ) : cat === "Mexican" ? (
                          <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /><span>Mexican</span></span>
                        ) : cat === "Burgers" ? (
                          <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /><span>Burgers</span></span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /><span>Gourmet</span></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {homeTab === "dishes" ? (
                loadingGlobalDishes ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n, idx) => (
                      <div key={`sk-dish-${n}-${idx}`} className="h-64 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : filteredDishes.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.01]">
                    <Sliders className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mt-4">No Dishes Found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Adjust your search query or radius to locate trending dishes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredDishes.map((dish, idx) => {
                      const dishShop = shops.find((s) => s.slug === (dish as any).shopSlug);
                      const distance = getDistanceKm((dish as any).shopSlug);
                      const isCartItem = cart.some((c) => c.item.id === dish.id);
                      const cartQty = cart.find((c) => c.item.id === dish.id)?.quantity || 0;
                      
                      return (
                        <div
                          key={`global-dish-${dish.id}-${idx}`}
                          className="group rounded-3xl bg-[#11121a]/80 backdrop-blur-md border border-white/[0.05] p-5 hover:border-white/10 hover:bg-[#11121a]/95 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            {/* Dish image container with dynamic badge */}
                            <div className="w-full h-40 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative mb-4">
                              {dish.images && dish.images.length ? (
                                <img src={dish.images[0]} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-white/5 to-white/[0.02]">
                                  <Store className="w-8 h-8 text-white/20" />
                                </div>
                              )}
                              
                              {/* Price Tag badge */}
                              <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-[#35ff7c] border border-white/10">
                                ${dish.priceUsd}
                              </div>
                              
                              {/* Distance Indicator */}
                              {distance !== 999.9 && (
                                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-mono text-muted-foreground border border-white/5 flex items-center gap-1">
                                  <Compass className="w-2.5 h-2.5 text-[#3b82f6]" />
                                  <span>{distance}km Away</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-bold text-white text-base group-hover:text-[#35ff7c] transition-colors line-clamp-1">{dish.name}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 h-8">{dish.description || "Prepared fresh to order using the finest localized ingredients."}</p>
                            </div>
                            
                            {/* Kitchen link attribution */}
                            {dishShop && (
                              <button
                                onClick={() => setSelectedShop(dishShop)}
                                className="mt-3.5 text-[10px] font-semibold text-[#3b82f6] hover:text-[#35ff7c] transition-colors flex items-center gap-1 cursor-pointer bg-blue-500/5 hover:bg-[#35ff7c]/5 border border-blue-500/10 hover:border-[#35ff7c]/20 px-2.5 py-1 rounded-lg"
                              >
                                <Store className="w-3 h-3 text-[#3b82f6] inline" />
                                <span>{dishShop.name}</span>
                              </button>
                            )}
                          </div>

                          <div className="mt-5">
                            {isCartItem ? (
                              <div className="flex items-center justify-between border border-white/10 rounded-xl p-1 bg-black/40 h-11 w-full animate-in fade-in duration-200">
                                <button
                                  type="button"
                                  onClick={() => updateQty(dish.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-xs font-mono font-bold text-white">{cartQty} in Cart</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddGlobalDish(dish, (dish as any).shopSlug)}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddGlobalDish(dish, (dish as any).shopSlug)}
                                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-[#35ff7c] hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-[#35ff7c]/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Delivery Cart</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                loadingShops ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((n, idx) => (
                      <div key={`sk-shop-${n}-${idx}`} className="h-44 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : filteredShops.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.01]">
                    <Store className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mt-4">No Kitchens Online</h3>
                    <p className="text-sm text-muted-foreground mt-1">Adjust your search query or radius to locate online delivery listings.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredShops.map((shop, idx) => {
                      const distance = getDistanceKm(shop.slug);
                      const isHovered = mapHoveredShop === shop.slug;
                      return (
                        <div
                          key={`shop-${shop.slug}-${idx}`}
                          onClick={() => setSelectedShop(shop)}
                          onMouseEnter={() => setMapHoveredShop(shop.slug)}
                          onMouseLeave={() => setMapHoveredShop(null)}
                          className={`group cursor-pointer rounded-3xl bg-[#11121a]/80 backdrop-blur-md border p-5 transition-all duration-300 flex flex-col justify-between ${
                            isHovered ? "border-[#35ff7c] bg-[#11121a]/95 shadow-2xl scale-[1.01]" : "border-white/[0.05] hover:border-[#35ff7c]/20 hover:bg-[#11121a]/95 hover:shadow-2xl hover:shadow-[#35ff7c]/5 hover:translate-y-[-2px]"
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                              {shop.theme?.brandLogoUrl ? (
                                <img src={shop.theme.brandLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Store className="w-6 h-6 text-white/50" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white group-hover:text-[#35ff7c] transition-colors">{shop.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-muted-foreground">{shop.category}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{shop.description || "Fresh local menu delivered straight to your door."}</p>
                            </div>
                          </div>

                          <div className="border-t border-white/[0.05] pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                            <div className="flex items-center gap-1.5 text-[#35ff7c] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#35ff7c] animate-ping" />
                              <span>★ {shop.rating} Proximity</span>
                            </div>
                            <div className="flex gap-4">
                              <span>Distance: {distance}km</span>
                              <span>Fee: ${shop.deliveryFee || 5.00}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* Step 2: Browse Menu & Shop items */}
          {selectedShop && !checkingOut && (
            <div className="space-y-6">
              {/* Detailed Shop Landing Header Banner */}
              {(() => {
                const primaryColor = selectedShop.theme?.primaryColor || "#35ff7c";
                return (
                  <div 
                    className="relative overflow-hidden rounded-[32px] border border-white/[0.05] p-6 md:p-8 flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-[#11121a] to-[#161722] shadow-2xl relative"
                    style={{
                      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 0 12px 0 ${primaryColor}10`
                    }}
                  >
                    {/* Dynamically themed glowing backdrop */}
                    <div 
                      className="absolute top-0 right-0 w-80 h-80 rounded-full filter blur-[120px] pointer-events-none opacity-25 transition-all duration-500"
                      style={{ backgroundColor: primaryColor }}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-[22px] bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-3xl shrink-0">
                          {selectedShop.theme?.brandLogoUrl ? (
                            <img src={selectedShop.theme.brandLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-8 h-8 text-white/50" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-white">{selectedShop.name}</h2>
                            <span 
                              className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold"
                              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor, border: `1px solid ${primaryColor}40` }}
                            >
                              {selectedShop.category || "Cuisine"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 max-w-md">{selectedShop.description || "Prepared fresh to order using premium localized ingredients."}</p>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 text-right border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: primaryColor }}>
                          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: primaryColor }} />
                          <span>★ {selectedShop.rating} Rating</span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground space-x-3">
                          <span>Proximity: {getDistanceKm(selectedShop.slug)}km</span>
                          <span>•</span>
                          <span>Delivery: ${deliveryFee.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 z-10">
                      <button
                        onClick={() => setSelectedShop(null)}
                        className="text-xs px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 font-semibold text-white cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" style={{ color: primaryColor }} /> Back to Kitchens
                      </button>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Commission-free local dispatch bridge</span>
                    </div>
                  </div>
                );
              })()}

              {/* Menu Items Grid */}
              {loadingItems ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n, idx) => (
                    <div key={`sk-item-${n}-${idx}`} className="h-56 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.01]">
                  <Store className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                  <h3 className="text-lg font-bold text-white mt-4">Menu is Empty</h3>
                  <p className="text-sm text-muted-foreground mt-1">No items are currently enabled for local delivery at this shop.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {items.map((item, idx) => (
                    <div
                      key={`item-${item.id}-${idx}`}
                      className="group rounded-3xl bg-[#11121a]/85 border border-white/[0.05] p-5 hover:border-white/10 hover:bg-[#11121a]/95 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Item Image */}
                        <div className="w-full h-36 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative mb-4">
                          {item.images && item.images.length ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-white/5 to-white/[0.02]">
                              <Store className="w-8 h-8 text-white/20" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-mono font-semibold text-[#35ff7c] border border-white/10">
                            ${item.priceUsd}
                          </div>
                        </div>
                        <h3 className="font-bold text-white text-base group-hover:text-[#35ff7c] transition-colors">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description || "Prepared fresh to order using the finest ingredients."}</p>
                      </div>

                      <div className="mt-6">
                        {(() => {
                          const cartItem = cart.find((i) => i.item.id === item.id);
                          if (cartItem) {
                            return (
                              <div className="flex items-center justify-between border border-white/10 rounded-xl p-1 bg-black/40 h-11 w-full animate-in fade-in duration-200">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-xs font-mono font-bold text-white">{cartItem.quantity} in Cart</span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-[#35ff7c] hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-[#35ff7c]/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" /> Add to Delivery Cart
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Checkout Wizard Panel */}
          {selectedShop && checkingOut && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-[#11121a]/60 border border-white/5 p-4 rounded-3xl">
                <button
                  onClick={() => setCheckingOut(false)}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-semibold text-white"
                >
                  Return to Menu
                </button>
                <h2 className="text-xl font-bold text-white">Delivery Coordinates</h2>
              </div>

              <form onSubmit={handlePlaceOrder} className="bg-[#11121a]/85 border border-white/[0.05] rounded-3xl p-6 md:p-8 space-y-4">
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    className="mt-1 w-full h-12 px-4 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] focus:border-[#35ff7c]/50 transition-colors font-semibold text-sm"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Local Delivery Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123 Oak St, Anytown"
                    className="mt-1 w-full h-12 px-4 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] focus:border-[#35ff7c]/50 transition-colors font-semibold text-sm"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 555-0100"
                      className="mt-1 w-full h-12 px-4 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] focus:border-[#35ff7c]/50 transition-colors font-semibold text-sm"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Delivery Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Ring doorbell / Leave on porch"
                      className="mt-1 w-full h-12 px-4 border border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] focus:border-[#35ff7c]/50 transition-colors font-semibold text-sm"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                    />
                  </div>
                </div>

                {/* Fee Breakdown Summary */}
                <div className="border-t border-white/[0.05] pt-4 mt-6 space-y-2.5 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Local Delivery Fee:</span>
                    <span className="text-white">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax (8.25%):</span>
                    <span className="text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#35ff7c] font-semibold border-t border-white/5 pt-2">
                    <span>Standard 1% Platform Fee:</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-3">
                    <span className="font-sans">Order Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full h-12 rounded-xl bg-[#35ff7c] text-black font-extrabold text-sm hover:shadow-lg hover:shadow-[#35ff7c]/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center mt-6"
                >
                  {isSubmittingOrder ? "Confirming Order..." : "Confirm & Place Delivery"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* SHOPPER PROFILE SLIDE-OUT DRAWER */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#11121a] h-full border-l border-white/[0.05] p-6 flex flex-col justify-between shadow-2xl relative animate-slide-in">
            <div>
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#35ff7c]" />
                  <span>Shopper Coordinates</span>
                </h3>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Config Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Shopper Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Mercer"
                    className="mt-1 w-full h-11 px-4 border border-white/10 rounded-xl bg-black/30 hover:border-white/20 focus:border-[#35ff7c]/50 focus:outline-none transition-colors text-xs font-semibold text-white"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. alex@mercer.io"
                    className="mt-1 w-full h-11 px-4 border border-white/10 rounded-xl bg-black/30 hover:border-white/20 focus:border-[#35ff7c]/50 focus:outline-none transition-colors text-xs font-semibold text-white"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. (555) 019-9233"
                    className="mt-1 w-full h-11 px-4 border border-white/10 rounded-xl bg-black/30 hover:border-white/20 focus:border-[#35ff7c]/50 focus:outline-none transition-colors text-xs font-semibold text-white"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Primary Delivery Destination</label>
                  <textarea
                    placeholder="e.g. 1024 Cyberpunk Blvd, Apt 4C"
                    className="mt-1 w-full h-20 p-3 border border-white/10 rounded-xl bg-black/30 hover:border-white/20 focus:border-[#35ff7c]/50 focus:outline-none transition-colors text-xs font-semibold text-white resize-none"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Default Proximity Radius (km)</label>
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="range"
                      min="2"
                      max="15"
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#35ff7c]"
                      value={profile.searchRadius}
                      onChange={(e) => setProfile({ ...profile, searchRadius: Number(e.target.value) })}
                    />
                    <span className="text-xs font-mono text-[#35ff7c] font-bold w-12 text-right">{profile.searchRadius} km</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#35ff7c] text-black font-extrabold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-[#35ff7c]/10"
                >
                  <Check className="w-4 h-4" /> Save Shopper Settings
                </button>
              </form>
            </div>

            <div className="text-[9px] font-mono text-muted-foreground text-center">
              COORDINATES SECURED ON INTERNAL BROWSER STORAGE
            </div>
          </div>
        </div>
      )}

      {/* Cart Slider Drawer */}
      {showCart && selectedShop && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#11121a] h-full border-l border-white/[0.05] p-6 flex flex-col justify-between shadow-2xl relative animate-slide-in">
            
            {/* Cart Header */}
            <div>
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#35ff7c]" />
                  <span>Delivery Cart</span>
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List */}
              {cart.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  Your cart is empty. Add some delicious items!
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {cart.map(({ item, quantity }, idx) => (
                    <div key={`cart-${item.id}-${idx}`} className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] flex justify-between items-center gap-3">
                      <div>
                        <h4 className="font-semibold text-sm text-white">{item.name}</h4>
                        <span className="text-xs text-[#35ff7c] font-mono mt-0.5 block">${item.priceUsd} each</span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 border border-white/10 rounded-lg p-1 bg-black/40 shrink-0">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-white/[0.05] pt-6 space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono text-white text-base">${subtotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCart([])}
                    className="h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors text-white"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setCheckingOut(true);
                    }}
                    className="h-11 rounded-xl bg-[#35ff7c] text-black font-extrabold text-xs hover:shadow-lg hover:shadow-[#35ff7c]/20 transition-all flex items-center justify-center"
                  >
                    Checkout Local
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART CONFLICT / START NEW ORDER ALERT MODAL */}
      {showConflictModal && pendingItemToAdd && (
        <div className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-[#11121a] border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Start a New Order?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your cart contains items from <span className="text-white font-semibold">{selectedShop?.name}</span>. 
                Adding <span className="text-[#35ff7c] font-semibold">{pendingItemToAdd.item.name}</span> will clear your current cart and start a new order from <span className="text-white font-semibold">{pendingItemToAdd.shop.name}</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingItemToAdd(null);
                }}
                className="h-11 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveConflict}
                className="h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
