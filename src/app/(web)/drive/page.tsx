"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useActiveAccount } from "thirdweb/react";
import { client, chain, getWallets } from "@/lib/thirdweb/client";
import { usePortalThirdwebTheme, connectButtonClass, getConnectButtonStyle } from "@/lib/thirdweb/theme";
import { 
  Truck, ArrowRight, Clock, MapPin, CheckCircle, AlertCircle, Camera,
  ShieldCheck, Smartphone, RefreshCw, User, Phone, Check, Activity,
  UploadCloud, FileText, Car, Store, Home, Zap
} from "lucide-react";

const ConnectButton = dynamic(() => import("thirdweb/react").then((m) => m.ConnectButton), { ssr: false });
const AWSLocationMap = dynamic(() => import("@/components/AWSLocationMap"), { ssr: false });

interface Job {
  receiptId: string;
  shopName: string;
  totalUsd: number;
  subtotalUsd: number;
  deliveryFeeUsd: number;
  lineItems: Array<{ label: string; qty: number }>;
  localDelivery: {
    deliveryStatus: "pending" | "accepted" | "in_transit" | "completed";
    customerName: string;
    customerAddress: string;
    customerPhone?: string;
    deliveryInstructions?: string;
    driverWallet?: string | null;
  };
}

export default function DrivePortal() {
  const account = useActiveAccount();
  const twTheme = usePortalThirdwebTheme();
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Duty board states
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [earnings, setEarnings] = useState<number>(0);
  
  // Custom camera mockup proof modal
  const [showCamera, setShowCamera] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);

  // Hoisted simulated driver coordinate generator
  function getSimulatedDriverCoords(wallet: string) {
    const hash = wallet.toLowerCase().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = ((hash % 100) - 50) / 1600;
    const lngOffset = (((hash * 13) % 100) - 50) / 1600;
    return {
      lat: 34.0522 + latOffset,
      lng: -118.2437 + lngOffset
    };
  }

  // Driver coordinates state and shops list for active radar map
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number }>({ lat: 34.0522, lng: -118.2437 });
  const [shops, setShops] = useState<any[]>([]);

  // Update driver coordinates state when account changes
  useEffect(() => {
    if (account?.address) {
      setDriverCoords(getSimulatedDriverCoords(account.address));
    }
  }, [account?.address]);

  // Load available kitchens for active radar map
  useEffect(() => {
    if (isOnline) {
      fetch("/api/delivers/shops")
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setShops(data.shops || []);
        })
        .catch((e) => console.error("Failed to load shops for driver map:", e));
    }
  }, [isOnline]);

  const getShopCoords = (slug: string | null | undefined) => {
    const safeSlug = typeof slug === "string" ? slug : "";
    const hash = safeSlug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = ((hash % 100) - 50) / 420; 
    const lngOffset = (((hash * 17) % 100) - 50) / 420;
    return {
      lat: driverCoords.lat + latOffset,
      lng: driverCoords.lng + lngOffset
    };
  };

  const getDistanceKm = (slug: string | null | undefined) => {
    if (!slug) return 999.9;
    const coords = getShopCoords(slug);
    const dy = coords.lat - driverCoords.lat;
    const dx = coords.lng - driverCoords.lng;
    return Number((Math.sqrt(dx * dx + dy * dy) * 111).toFixed(1));
  };

  // Driver states
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("bike");
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [poolPreference, setPoolPreference] = useState("global");
  const [shopSlug, setShopSlug] = useState("");

  // Detailed registration states
  const [vehicleMakeModel, setVehicleMakeModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [insuranceFile, setInsuranceFile] = useState<string | null>(null);
  const [insuranceFileName, setInsuranceFileName] = useState("");

  // Custom mock file upload states
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      triggerMockUpload(file);
    }
  };

  const handleInsuranceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerMockUpload(file);
    }
  };

  const triggerMockUpload = (file: File) => {
    setInsuranceFileName(file.name);
    setUploadingInsurance(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadingInsurance(false);
          setInsuranceFile("data:application/pdf;base64,MOCK_INSURANCE_BASE64_PAYLOAD_PORTALPAY");
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };



  const toggleDutyStatus = async (nextOnline: boolean) => {
    if (!account?.address || !profile) return;
    try {
      const coords = getSimulatedDriverCoords(account.address);
      const res = await fetch("/api/drive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: account.address,
          isOnline: nextOnline,
          lat: coords.lat,
          lng: coords.lng
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIsOnline(nextOnline);
        setProfile(data.profile);
      } else {
        alert(data.error || "Failed to update active status");
      }
    } catch (err) {
      console.error("Error setting online status:", err);
    }
  };

  // Periodic background rider location pings
  useEffect(() => {
    if (!isOnline || !account?.address) return;
    const interval = setInterval(async () => {
      try {
        const coords = getSimulatedDriverCoords(account.address);
        await fetch("/api/drive/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: account.address,
            isOnline: true,
            lat: coords.lat,
            lng: coords.lng
          })
        });
      } catch (err) {
        console.warn("Background coordinate pinger skipped:", err);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [isOnline, account?.address]);

  // Active Match Offer states
  const [activeOffer, setActiveOffer] = useState<any | null>(null);
  const [offerTimeLeft, setOfferTimeLeft] = useState(45);

  // Geocoded destination coordinates for active job/offer
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Dynamic geocoding of the dropoff address when an active job or offer changes
  useEffect(() => {
    const activeOrder = activeJob || activeOffer;
    if (!activeOrder || !activeOrder.localDelivery?.customerAddress) {
      setDestinationCoords(null);
      return;
    }

    const address = activeOrder.localDelivery.customerAddress;

    fetch("/api/delivers/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: address })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.coords) {
          setDestinationCoords(data.coords);
        } else {
          // Fallback based on deterministic string hash of customerAddress
          const hash = address.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const latOffset = ((hash % 100) - 50) / 1000;
          const lngOffset = (((hash * 19) % 100) - 50) / 1000;
          setDestinationCoords({
            lat: driverCoords.lat + latOffset,
            lng: driverCoords.lng + lngOffset
          });
        }
      })
      .catch((err) => {
        console.warn("Rider destination geocode failed:", err);
        const hash = address.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const latOffset = ((hash % 100) - 50) / 1000;
        const lngOffset = (((hash * 19) % 100) - 50) / 1000;
        setDestinationCoords({
          lat: driverCoords.lat + latOffset,
          lng: driverCoords.lng + lngOffset
        });
      });
  }, [activeJob?.receiptId, activeOffer?.receiptId, driverCoords.lat, driverCoords.lng]);

  // Ticking offer countdown clock
  useEffect(() => {
    if (!activeOffer) return;
    
    const calculateTimeLeft = () => {
      const now = Date.now();
      const pingTime = Number(activeOffer.localDelivery?.pingTimestamp || now);
      const elapsed = Math.floor((now - pingTime) / 1000);
      const remaining = Math.max(0, 45 - elapsed);
      setOfferTimeLeft(remaining);
      
      if (remaining <= 0) {
        handleDeclineOffer(activeOffer.receiptId);
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [activeOffer]);

  const handleAcceptOffer = async (receiptId: string) => {
    if (!account?.address || !profile) return;
    try {
      const res = await fetch("/api/drive/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          receiptId,
          driverWallet: account.address.toLowerCase(),
          driverName: profile.name,
          driverPhone: profile.phone
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActiveOffer(null);
        setActiveJob(data.receipt);
        refreshJobs();
      } else {
        alert(data.error || "Failed to accept offer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineOffer = async (receiptId: string) => {
    if (!account?.address) return;
    try {
      const res = await fetch("/api/drive/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          receiptId,
          driverWallet: account.address.toLowerCase()
        })
      });
      const data = await res.json();
      if (data.ok) {
        setActiveOffer(null);
        refreshJobs();
      }
    } catch (err) {
      console.error("Error declining offer:", err);
    }
  };

  const VEHICLE_OPTIONS = [
    { value: "bike", label: "Bicycle" },
    { value: "scooter", label: "Electric Scooter" },
    { value: "car", label: "Automobile" },
    { value: "walker", label: "Foot Dispatch" },
  ];

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setMounted(true);
    getWallets().then(setWallets);
  }, []);

  // Fetch driver profile
  const fetchProfile = useCallback(async () => {
    if (!account?.address) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/drive/profile?wallet=${account.address}`);
      const data = await res.json();
      if (data.ok && data.profile) {
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }, [account?.address]);

  useEffect(() => {
    if (account?.address) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoadingProfile(false);
    }
  }, [account?.address, fetchProfile]);

  // Load active delivery jobs
  const refreshJobs = useCallback(async () => {
    if (!isOnline || !account?.address) return;
    try {
      setLoadingJobs(true);
      const res = await fetch("/api/drive/jobs");
      const data = await res.json();
      if (data.ok) {
        // Filter jobs matching pool preference or global
        let filteredJobs = data.jobs;
        if (profile?.poolPreference === "shop" && profile?.shopSlug) {
          filteredJobs = data.jobs.filter((j: any) => j.shopSlug === profile.shopSlug);
        }
        
        setJobs(filteredJobs);

        // Check if there is an active priority offer pinging THIS driver
        const targetedOffer = data.jobs.find(
          (j: any) => 
            j.localDelivery?.activePing === account.address.toLowerCase() &&
            j.localDelivery?.deliveryStatus === "pending"
        );
        
        if (targetedOffer) {
          setActiveOffer(targetedOffer);
        } else {
          setActiveOffer(null);
        }
        
        // Find if this driver already has an active accepted/transit job
        const assigned = filteredJobs.find(
          (j: any) => 
            j.localDelivery?.driverWallet === account.address.toLowerCase() &&
            (j.localDelivery?.deliveryStatus === "accepted" || j.localDelivery?.deliveryStatus === "in_transit")
        );
        if (assigned) {
          setActiveJob(assigned);
        } else {
          setActiveJob(null);
        }
        
        // Calculate completed earnings for this driver
        const completed = filteredJobs.filter(
          (j: any) => 
            j.localDelivery?.driverWallet === account.address.toLowerCase() &&
            j.localDelivery?.deliveryStatus === "completed"
        );
        const totalEarned = completed.reduce((sum: number, j: any) => sum + Number(j.deliveryFeeUsd || 5.00) + Number(j.localDelivery?.surgeBonusUsd || 0), 0);
        setEarnings(totalEarned);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  }, [isOnline, account?.address, profile]);

  useEffect(() => {
    if (isOnline) {
      refreshJobs();
      const interval = setInterval(refreshJobs, 6000);
      return () => clearInterval(interval);
    } else {
      setJobs([]);
      setActiveJob(null);
    }
  }, [isOnline, refreshJobs]);

  // Handle Driver Application Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.address) return;
    if (!name.trim() || !phone.trim() || !vehicleMakeModel.trim() || !vehicleColor.trim() || !licensePlate.trim() || !licenseNumber.trim() || !licenseState.trim() || !licenseExpiry.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (!insuranceFile) {
      setFormError("Please upload your auto insurance policy document.");
      return;
    }
    if (poolPreference === "shop" && !shopSlug.trim()) {
      setFormError("Please enter a shop slug to register for table service.");
      return;
    }

    setRegistering(true);
    setFormError("");

    try {
      const res = await fetch("/api/drive/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: account.address,
          name: name.trim(),
          phone: phone.trim(),
          vehicle,
          poolPreference,
          shopSlug: poolPreference === "shop" ? shopSlug.trim() : null,
          vehicleMakeModel: vehicleMakeModel.trim(),
          vehicleColor: vehicleColor.trim(),
          licensePlate: licensePlate.trim(),
          licenseNumber: licenseNumber.trim(),
          licenseState: licenseState.trim(),
          licenseExpiry: licenseExpiry.trim(),
          insuranceFile,
          insuranceFileName
        })
      });
      const data = await res.json();
      if (data.ok) {
        setProfile(data.profile);
      } else {
        setFormError(data.error || "Failed to register driver profile");
      }
    } catch (err) {
      console.error(err);
      setFormError("Failed to connect to platform database.");
    } finally {
      setRegistering(false);
    }
  };

  // Accept a delivery job
  const handleAcceptJob = async (receiptId: string) => {
    if (!account?.address || !profile) return;
    try {
      const res = await fetch("/api/drive/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          receiptId,
          driverWallet: account.address.toLowerCase(),
          driverName: profile.name,
          driverPhone: profile.phone
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActiveJob(data.receipt);
        refreshJobs();
      } else {
        alert(data.error || "Failed to accept job");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start delivery transit
  const handleStartTransit = async () => {
    if (!activeJob) return;
    try {
      const res = await fetch("/api/drive/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transit",
          receiptId: activeJob.receiptId
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActiveJob(data.receipt);
        refreshJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger camera view for pod
  const handleTriggerComplete = () => {
    setShowCamera(true);
  };

  // Complete delivery with mock camera snap
  const handleSnapPhotoAndComplete = async () => {
    if (!activeJob) return;
    try {
      setTakingPhoto(true);
      setTimeout(async () => {
        try {
          const res = await fetch("/api/drive/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "complete",
              receiptId: activeJob.receiptId,
              photoUrl: "https://images.unsplash.com/photo-1512152272829-e3139592d56f?q=80&w=300&auto=format&fit=crop"
            }),
          });
          const data = await res.json();
          if (data.ok) {
            setActiveJob(null);
            setShowCamera(false);
            setTakingPhoto(false);
            refreshJobs();
          }
        } catch (err) {
          console.error(err);
          setTakingPhoto(false);
        }
      }, 800);
    } catch (err) {
      console.error(err);
      setTakingPhoto(false);
    }
  };

  const availableJobs = jobs.filter(
    (j) => !j.localDelivery?.driverWallet && j.localDelivery?.deliveryStatus === "pending"
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#090b10] font-sans antialiased text-[#f4f4f7]">
      
      {/* 1. Full-Screen Backdrop Map Component */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {process.env.NEXT_PUBLIC_AWS_MAP_API_KEY && (isOnline || activeJob || activeOffer) ? (
          <AWSLocationMap
            customerCoords={destinationCoords || driverCoords}
            shops={shops}
            searchRadius={15}
            selectedShop={null}
            onSelectShop={() => {}}
            activeReceipt={activeJob || activeOffer}
            getShopCoords={getShopCoords}
            getDistanceKm={getDistanceKm}
            showControls={true}
          />
        ) : (
          <>
            {/* Cyberpunk Grid/Street Overlay (if offline or map not loaded yet) */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090b10] to-[#090b10] opacity-80" />
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <Activity className="w-12 h-12 text-[#35ff7c] animate-pulse" />
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest text-center px-4 leading-normal">Duty status offline - radar standby</p>
            </div>
          </>
        )}
      </div>

      {/* 2. Floating Header Bar */}
      <header className="absolute top-4 inset-x-4 z-40 bg-[#11121a]/85 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 px-6 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#35ff7c] to-blue-500 p-[1px] flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-[#0a0b10] rounded-lg flex items-center justify-center">
              <Truck className="w-4.5 h-4.5 text-[#35ff7c]" />
            </div>
          </div>
          <span className="font-extrabold tracking-tight text-white text-sm">Basalt<span className="text-[#35ff7c]">Drive</span> <span className="hidden sm:inline font-normal text-muted-foreground">| Rider HUD</span></span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/delivers"
            className="text-[10px] sm:text-xs px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-semibold"
          >
            Customer Storefront
          </Link>

          {profile?.approved && (
            <button
              onClick={() => toggleDutyStatus(!isOnline)}
              className={`text-[10px] sm:text-xs px-4 py-1.5 rounded-xl border transition-all duration-300 font-extrabold uppercase tracking-wider cursor-pointer active:scale-95 ${
                isOnline 
                  ? "bg-[#35ff7c] text-black border-transparent shadow-lg shadow-[#35ff7c]/20" 
                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
              }`}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </button>
          )}
        </div>
      </header>

      {/* 3. Floating Overlay Sheets (Z-10) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6">
        <div className="flex-1 flex justify-start items-stretch mt-20 relative pointer-events-auto">
          
          {/* STATE A: PROFILE LOADING */}
          {loadingProfile && (
            <div className="w-full max-w-md bg-[#11121a]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 m-auto">
              <RefreshCw className="w-10 h-10 text-[#35ff7c] animate-spin" />
              <p className="text-sm font-semibold text-white">Synchronizing fleet credentials...</p>
            </div>
          )}

          {/* STATE B: WALLET NOT LINKED */}
          {!loadingProfile && !account && (
            <div className="w-full max-w-md bg-[#11121a]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 m-auto">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-[#35ff7c] rounded-3xl animate-pulse w-fit shadow-inner">
                <Truck className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white">Join Basalt Fleet</h2>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Earn on-chain delivery payouts instantly. Link your Web3 wallet address to establish your fleet identity.
                </p>
              </div>
              {mounted && wallets.length > 0 ? (
                <ConnectButton
                  client={client}
                  chain={chain}
                  wallets={wallets}
                  connectButton={{
                    label: "Link Web3 Identity",
                    className: connectButtonClass,
                    style: {
                      ...getConnectButtonStyle(),
                      width: "100%",
                      justifyContent: "center",
                      height: "46px",
                      borderRadius: "16px"
                    }
                  }}
                  theme={twTheme}
                />
              ) : (
                <div className="w-full h-11 bg-white/5 rounded-xl animate-pulse" />
              )}
            </div>
          )}

          {/* STATE C: REGISTRATION PROFILE FORM */}
          {!loadingProfile && account && !profile && (
            <div className="w-full max-w-3xl bg-[#11121a]/90 backdrop-blur-2xl border border-white/10 rounded-[36px] p-6 md:p-8 shadow-2xl m-auto overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin">
              <div className="space-y-6 text-left py-2 flex-1">
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl font-black text-white">Setup Driver Profile</h2>
                  <p className="text-xs text-muted-foreground">Register your vehicle details and credentials to join.</p>
                </div>

                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Side: General Profile Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 focus:ring-0 transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Contact Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="(555) 012-3456"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 focus:ring-0 transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vehicle Class</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setVehicleDropdownOpen(!vehicleDropdownOpen)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-left text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 flex justify-between items-center transition-all duration-300 hover:border-white/20 active:scale-[0.99] cursor-pointer"
                        >
                          <span>
                            {VEHICLE_OPTIONS.find((opt) => opt.value === vehicle)?.label || "Select Vehicle"}
                          </span>
                          <svg
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${vehicleDropdownOpen ? "rotate-180 text-white" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {vehicleDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-2 bg-[#0c0d12]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-1 duration-200">
                            {VEHICLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setVehicle(opt.value);
                                  setVehicleDropdownOpen(false);
                                }}
                                className={`w-full p-3.5 text-left text-xs transition-colors duration-200 cursor-pointer flex justify-between items-center ${
                                  vehicle === opt.value
                                    ? "bg-white/[0.04] text-[#35ff7c] font-bold"
                                    : "text-gray-300 hover:text-white hover:bg-white/[0.02]"
                                }`}
                              >
                                <span>{opt.label}</span>
                                {vehicle === opt.value && (
                                  <Check className="w-3.5 h-3.5 text-[#35ff7c]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Fleet Group Preference</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPoolPreference("global")}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            poolPreference === "global"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                              : "bg-black/30 border-white/5 text-muted-foreground hover:border-white/10"
                          }`}
                        >
                          Global Pool
                        </button>
                        <button
                          type="button"
                          onClick={() => setPoolPreference("shop")}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            poolPreference === "shop"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                              : "bg-black/30 border-white/5 text-muted-foreground hover:border-white/10"
                          }`}
                        >
                          Specific Shop
                        </button>
                      </div>
                    </div>

                    {poolPreference === "shop" && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Shop Slug</label>
                        <input
                          type="text"
                          placeholder="e.g. krishnastore"
                          value={shopSlug}
                          onChange={(e) => setShopSlug(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50"
                          required={poolPreference === "shop"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Side: Vehicle, License & Upload */}
                  <div className="space-y-4">
                    
                    {/* Vehicle Details */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-[#35ff7c] uppercase tracking-wider flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#35ff7c] shrink-0" /> Vehicle Details
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Make / Model</label>
                          <input
                            type="text"
                            placeholder="Honda Civic"
                            value={vehicleMakeModel}
                            onChange={(e) => setVehicleMakeModel(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 font-semibold"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Color</label>
                          <input
                            type="text"
                            placeholder="Black"
                            value={vehicleColor}
                            onChange={(e) => setVehicleColor(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 font-semibold"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">License Plate Number</label>
                        <input
                          type="text"
                          placeholder="7XYZ89"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 font-mono uppercase"
                          required
                        />
                      </div>
                    </div>

                    {/* License Info */}
                    <div className="space-y-3 pt-1">
                      <div className="text-[10px] font-bold text-[#35ff7c] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#35ff7c] shrink-0" /> License Details
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">License Number</label>
                          <input
                            type="text"
                            placeholder="DL-98765"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 font-mono uppercase"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">State</label>
                          <input
                            type="text"
                            placeholder="CA"
                            value={licenseState}
                            onChange={(e) => setLicenseState(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#35ff7c]/50 uppercase text-center font-bold"
                            maxLength={2}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Insurance Upload */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#35ff7c] shrink-0" /> Liability Insurance
                      </label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`relative rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[100px] ${
                          dragActive 
                            ? "border-[#35ff7c] bg-[#35ff7c]/5" 
                            : insuranceFile 
                            ? "border-emerald-500/30 bg-emerald-500/5" 
                            : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/[0.01]"
                        }`}
                      >
                        <input
                          type="file"
                          id="insurance-file-input"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleInsuranceUpload}
                          className="hidden"
                        />
                        
                        <div className="w-full flex flex-col items-center justify-center">
                          {uploadingInsurance ? (
                            <div className="w-full space-y-2">
                              <RefreshCw className="w-5 h-5 text-[#35ff7c] animate-spin mx-auto" />
                              <p className="text-[10px] font-semibold text-white/90">Uploading Policy Ledger...</p>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden max-w-[160px] mx-auto border border-white/10">
                                <div 
                                  className="bg-[#35ff7c] h-full rounded-full transition-all duration-150"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : insuranceFile ? (
                            <div className="space-y-1.5">
                              <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto filter drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]" />
                              <div>
                                <p className="text-[10px] font-bold text-white max-w-[160px] truncate mx-auto">{insuranceFileName}</p>
                                <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">Insurance Policy Locked</p>
                              </div>
                            </div>
                          ) : (
                            <label htmlFor="insurance-file-input" className="cursor-pointer w-full flex flex-col items-center justify-center">
                              <UploadCloud className="w-6 h-6 text-muted-foreground/60 mx-auto mb-1" />
                              <div>
                                <p className="text-[10px] text-white font-semibold">Drag & drop insurance policy</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">or <span className="text-[#35ff7c] font-bold">browse files</span></p>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {formError && (
                    <div className="col-span-1 md:col-span-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs">
                      {formError}
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 pt-1">
                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#35ff7c] to-emerald-500 text-black font-extrabold text-xs transition-all hover:brightness-110 flex items-center justify-center gap-1.5 shadow-lg shadow-[#35ff7c]/10 cursor-pointer active:scale-[0.99]"
                    >
                      {registering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      Complete Registration Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STATE D: PENDING APPROVAL */}
          {!loadingProfile && account && profile && !profile.approved && (
            <div className="w-full max-w-md bg-[#11121a]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 m-auto">
              <div className="w-20 h-20 rounded-full mx-auto bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse shadow-inner mb-2">
                <Clock className="w-10 h-10 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Application Review</h2>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Hi <strong className="text-white">{profile.name}</strong>, your driver registration application has been submitted successfully.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mt-2">
                  An administrator is verifying your credentials. Status updates automatically sync here in real time.
                </p>
              </div>
              <div className="w-full flex flex-col items-center gap-2 pt-4">
                <div className="text-[10px] font-mono bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl text-muted-foreground w-full break-all">
                  Wallet: {account.address}
                </div>
                <button
                  onClick={fetchProfile}
                  className="mt-3 text-xs text-[#35ff7c] hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                </button>
              </div>
            </div>
          )}

          {/* STATE E: ACTIVE APPROVED DRIVER CONSOLE */}
          {!loadingProfile && account && profile?.approved && (
            <>
              {/* OFFLINE INTERFACE CARD */}
              {!isOnline && (
                <div className="w-full max-w-md bg-[#11121a]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 m-auto relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#35ff7c]/5 rounded-full filter blur-[60px]" />
                  <div className="w-20 h-20 rounded-full bg-[#35ff7c]/10 border border-[#35ff7c]/20 flex items-center justify-center animate-bounce shadow-xl relative z-10">
                    <Truck className="w-10 h-10 text-[#35ff7c]" />
                  </div>
                  <div className="space-y-2 max-w-sm relative z-10">
                    <h2 className="text-2xl font-black text-white">Start Dispatch Duty</h2>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                      Hi <strong className="text-white">{profile.name}</strong>! Go online to stream live dispatches on your active radar map and start accepting on-chain delivery route payouts.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleDutyStatus(true)}
                    className="h-12 px-8 rounded-2xl bg-gradient-to-r from-[#35ff7c] to-emerald-500 text-black font-extrabold text-xs tracking-widest uppercase hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#35ff7c]/15 relative z-10 cursor-pointer w-full"
                  >
                    Go Online Now
                  </button>
                </div>
              )}

              {/* ONLINE INTERFACE OVERLAYS (Floating HUD cards on Map backdrop) */}
              {isOnline && (
                <div className="fixed bottom-4 inset-x-4 lg:bottom-auto lg:top-24 lg:left-4 lg:inset-x-auto w-auto lg:w-96 flex flex-col space-y-4 pointer-events-auto z-30 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-none pr-1">
                  
                  {/* A. Driver Earnings & Profile Card (Ultra-Sleek & Compact Bar) */}
                  <div className="p-3.5 rounded-2xl bg-[#11121a]/85 backdrop-blur-md border border-white/10 relative overflow-hidden flex justify-between items-center text-left shadow-2xl select-none animate-in slide-in-from-bottom duration-300">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#35ff7c]/5 rounded-full filter blur-lg pointer-events-none" />
                    
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#35ff7c] to-emerald-600 p-[1px] flex items-center justify-center shadow-inner animate-pulse">
                        <div className="w-full h-full bg-[#0a0b10] rounded-xl flex items-center justify-center">
                          <Activity className="w-4 h-4 text-[#35ff7c]" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold block">Rider Portal</span>
                        <p className="text-xs text-white font-bold truncate max-w-[110px] sm:max-w-[130px]">{profile.name}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div className="border-r border-white/5 pr-3">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">Earnings</span>
                        <div className="text-lg font-black text-white font-mono leading-none mt-0.5">${earnings.toFixed(2)}</div>
                      </div>
                      <div className="bg-[#35ff7c]/10 border border-[#35ff7c]/20 px-2.5 py-1.5 rounded-lg flex items-center justify-center">
                        <span className="text-[8px] text-[#35ff7c] font-black uppercase tracking-wider block leading-none">{profile.vehicle || "CAR"}</span>
                      </div>
                    </div>
                  </div>

                  {/* B. Active Assigned Job Console or Nearby Available dispatches */}
                  {activeJob ? (
                    <div className="space-y-3 text-left animate-in slide-in-from-bottom duration-300">
                      <div className="text-[10px] font-black text-[#35ff7c] uppercase tracking-widest pl-2">ACTIVE DISPATCH ROUTE</div>
                      
                      <div className="rounded-2xl border border-white/10 bg-[#11121a]/85 backdrop-blur-md p-4 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white truncate">{activeJob.shopName}</h4>
                            <span className="text-[9px] text-muted-foreground font-mono truncate block mt-0.5">Receipt: {activeJob.receiptId}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-mono font-bold text-[#35ff7c]">+${activeJob.deliveryFeeUsd || "5.00"}</span>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5">Payout</p>
                          </div>
                        </div>

                        <div className="space-y-3 text-[11px] text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 text-[#35ff7c] flex items-center justify-center shrink-0 mt-0.5">
                              <Store className="w-3.5 h-3.5 text-[#35ff7c]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-[9px] uppercase tracking-wide">Pickup Location</p>
                              <p className="mt-0.5 text-white/80 text-[10px] truncate">{activeJob.shopName} Kitchen</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 border-t border-white/5 pt-2.5">
                            <div className="w-6 h-6 rounded bg-[#35ff7c]/10 border border-[#35ff7c]/20 text-[#35ff7c] flex items-center justify-center shrink-0 mt-0.5">
                              <Home className="w-3.5 h-3.5 text-[#35ff7c]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-[9px] uppercase tracking-wide">Delivery Destination</p>
                              <p className="mt-0.5 text-white text-[10px] font-semibold">{activeJob.localDelivery.customerAddress}</p>
                              <p className="mt-0.5 text-[9px] font-semibold text-muted-foreground">Recipient: {activeJob.localDelivery.customerName}</p>
                            </div>
                          </div>
                          
                          {activeJob.localDelivery.deliveryInstructions && (
                            <div className="mt-2 text-[9px] p-2 rounded-lg bg-black/40 border border-white/5 italic text-muted-foreground leading-normal">
                              Instructions: "{activeJob.localDelivery.deliveryInstructions}"
                            </div>
                          )}
                        </div>

                        {/* Step-by-Step Operations Action Trigger */}
                        <div className="pt-2.5 border-t border-white/5">
                          {activeJob.localDelivery.deliveryStatus === "accepted" ? (
                            <button
                              onClick={handleStartTransit}
                              className="w-full h-10 rounded-xl bg-blue-500 text-white text-xs font-extrabold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-blue-500/10"
                            >
                              <Truck className="w-3.5 h-3.5 text-white animate-pulse" /> Start Transit (Out for Delivery)
                            </button>
                          ) : (
                            <button
                              onClick={handleTriggerComplete}
                              className="w-full h-10 rounded-xl bg-[#35ff7c] text-black text-xs font-extrabold hover:shadow-lg hover:shadow-[#35ff7c]/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-black" /> Take Photo Proof & Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Available Dispatches Feed */
                    <div className="space-y-2 text-left flex flex-col animate-in slide-in-from-bottom duration-300">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5 pl-1.5">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">NEARBY DISPATCHES ({availableJobs.length})</span>
                        <button 
                          onClick={refreshJobs} 
                          disabled={loadingJobs}
                          className="text-[9px] text-[#35ff7c] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${loadingJobs ? "animate-spin" : ""}`} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {availableJobs.length === 0 ? (
                        <div className="p-4 border border-white/10 rounded-2xl bg-[#11121a]/85 backdrop-blur-md text-center shadow-xl relative overflow-hidden flex flex-col items-center justify-center space-y-2">
                          <div className="absolute top-0 right-0 w-12 h-12 bg-[#35ff7c]/5 rounded-full filter blur-md pointer-events-none" />
                          <div className="flex items-center gap-2 justify-center">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35ff7c] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35ff7c]"></span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Radar Scan Active</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-normal max-w-[240px] mx-auto">
                            Awaiting dispatches. Live checkouts populate coordinates dynamically.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin flex-1">
                          {availableJobs.map((job) => (
                            <div
                              key={job.receiptId}
                              className="p-3 rounded-xl bg-[#11121a]/85 backdrop-blur-md border border-white/10 flex justify-between items-center gap-2.5 hover:border-[#35ff7c]/30 transition-all shadow-xl"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-xs text-white truncate">{job.shopName}</h4>
                                <p className="text-[9px] text-muted-foreground truncate mt-0.5">{job.localDelivery.customerAddress}</p>
                                <span className="text-[9px] text-[#35ff7c] font-mono mt-1 block">Payout: ${job.deliveryFeeUsd || "5.00"}</span>
                              </div>
                              
                              <button
                                onClick={() => handleAcceptJob(job.receiptId)}
                                className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-white hover:bg-[#35ff7c] hover:text-black hover:border-transparent transition-all shrink-0 cursor-pointer active:scale-95"
                              >
                                Accept Job
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* 4. smartphone Camera Proof Mock overlay */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[2000] flex flex-col justify-between p-6">
          {/* Top camera bar */}
          <div className="flex justify-between items-center pt-8">
            <span className="text-xs font-mono font-bold text-white/50 tracking-wider">POD_CAMERA_ACTIVE</span>
            <button
              onClick={() => setShowCamera(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-sm font-semibold cursor-pointer text-white"
            >
              ✖
            </button>
          </div>

          {/* Viewfinder simulation */}
          <div className="flex-1 rounded-[24px] bg-[#161722] border border-white/10 my-6 relative overflow-hidden flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto">
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20" />
            
            {takingPhoto ? (
              <div className="w-full h-full bg-black flex items-center justify-center animate-pulse z-50">
                <span className="text-white text-xs font-semibold font-mono tracking-widest uppercase animate-pulse">Capturing Proof...</span>
              </div>
            ) : (
              <div className="text-center space-y-3 z-10 p-4">
                <Truck className="w-10 h-10 text-muted-foreground/60 mx-auto animate-bounce" />
                <p className="text-xs text-muted-foreground/80">Position package clearly inside viewfinder. Shutter requires zero permissions.</p>
              </div>
            )}
          </div>

          {/* Bottom shutter control */}
          <div className="flex justify-center items-center pb-6">
            <button
              onClick={handleSnapPhotoAndComplete}
              disabled={takingPhoto}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-[2px] transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="w-full h-full bg-white rounded-full transition-colors active:bg-gray-200" />
            </button>
          </div>
        </div>
      )}      {/* 5. Uber/Lyft Sleek Float Match Offer Alert Card Overlay (Z-[900]) */}
      {activeOffer && (
        <div className="fixed inset-0 z-[900] flex flex-col justify-end p-4 sm:p-6 md:p-8 pointer-events-none animate-in fade-in duration-300">
          {/* Subtle ambient overlay at the bottom to ensure card legibility while map stays interactive */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none" />
          
          <div className="relative w-full max-w-md mx-auto bg-[#11121a]/95 border border-white/10 rounded-[32px] p-6 shadow-3xl backdrop-blur-xl pointer-events-auto space-y-5 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono font-black tracking-widest text-[#35ff7c] bg-[#35ff7c]/10 border border-[#35ff7c]/20 px-3 py-1 rounded-full uppercase animate-pulse inline-flex items-center gap-1.5 justify-center mx-auto">
                <Zap className="w-3 h-3 text-[#35ff7c] animate-bounce" /> PRIORITY DISPATCH MATCHED
              </span>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pt-2">New Delivery Route Offer</h3>
            </div>

            {/* SVG countdown wheel & payout */}
            <div className="grid grid-cols-2 gap-4 items-center justify-center py-2 border-y border-white/5">
              {/* Left Column: SVG circular progress countdown wheel */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-white/5"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-[#35ff7c] transition-all duration-1000"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * offerTimeLeft) / 45}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center space-y-0.5">
                  <span className="text-2xl font-black text-white font-mono">{offerTimeLeft}</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block font-bold">seconds left</span>
                </div>
              </div>

              {/* Right Column: Payout details */}
              <div className="text-left space-y-1 pl-2">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold block">Guaranteed Payout</span>
                <div className="text-3xl font-black font-mono text-[#35ff7c] filter drop-shadow-[0_0_8px_rgba(53,255,124,0.3)]">
                  ${(Number(activeOffer.deliveryFeeUsd || 5.00) + Number(activeOffer.localDelivery?.surgeBonusUsd || 0)).toFixed(2)}
                </div>
                {Number(activeOffer.localDelivery?.surgeBonusUsd || 0) > 0 && (
                  <span className="inline-block text-[8px] bg-[#35ff7c]/20 text-[#35ff7c] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    +${activeOffer.localDelivery.surgeBonusUsd.toFixed(2)} Surge Included
                  </span>
                )}
              </div>
            </div>

            {/* Offer Details Route Summary */}
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 text-[#35ff7c] flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-3 h-3 text-[#35ff7c]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-[10px] uppercase tracking-wide">Pickup Location</p>
                  <p className="mt-0.5 text-white/80 text-[10px] truncate">{activeOffer.shopName} Kitchen</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t border-white/5 pt-3">
                <div className="w-6 h-6 rounded bg-[#35ff7c]/10 border border-[#35ff7c]/20 text-[#35ff7c] flex items-center justify-center shrink-0 mt-0.5">
                  <Home className="w-3 h-3 text-[#35ff7c]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-[10px] uppercase tracking-wide">Dropoff Destination</p>
                  <p className="mt-0.5 text-white/80 text-[10px] truncate">{activeOffer.localDelivery?.customerAddress}</p>
                </div>
              </div>
            </div>

            {/* Bottom accept/decline actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleAcceptOffer(activeOffer.receiptId)}
                className="w-full h-12 rounded-2xl bg-[#35ff7c] text-black font-black text-xs tracking-widest uppercase hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#35ff7c]/15 cursor-pointer"
              >
                <Check className="w-4 h-4 text-black" /> ACCEPT ROUTE PAYOUT
              </button>
              <button
                onClick={() => handleDeclineOffer(activeOffer.receiptId)}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                Decline Offer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
