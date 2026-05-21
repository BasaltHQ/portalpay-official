"use client";

/**
 * Legacy Touchpoint Setup Page
 * 
 * This is a React Client Component for Chrome < 99 devices (VP550).
 * By using standard React state and useEffect, we prevent the hydration
 * mismatch (Error #418) that occurred when the synchronous inline script
 * modified the DOM before React could hydrate it.
 */

import React, { useEffect, useState } from "react";

const STORAGE_KEY = "touchpoint_installation_id";
const API_URL = "/api/touchpoint/config";

function generateId() {
  return Date.now() + "-" + Math.random().toString(36).substring(2, 15);
}

function getInstallationId() {
  if (typeof window === "undefined") return "";
  
  // Parse query params (ES5 safe)
  var match = window.location.search.match(/[?&]installationId=([^&]*)/);
  var paramId = match ? decodeURIComponent(match[1]) : null;
  if (paramId) {
    try { localStorage.setItem(STORAGE_KEY, paramId); } catch(e) {}
    return paramId;
  }
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    var newId = generateId();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch(e) {
    return generateId();
  }
}

export default function LegacyTouchpointSetup() {
  const [loading, setLoading] = useState(true);
  const [installationId, setInstallationId] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [scale, setScale] = useState<string | null>(null);

  useEffect(() => {
    var instId = getInstallationId();
    setInstallationId(instId);

    var matchScale = window.location.search.match(/[?&]scale=([^&]*)/);
    var sc = matchScale ? decodeURIComponent(matchScale[1]) : null;
    setScale(sc);

    function checkConfig() {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", API_URL + "?installationId=" + encodeURIComponent(instId), true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var cfg = JSON.parse(xhr.responseText);
              handleConfig(cfg);
            } catch(e) {
              handleConfig(null);
            }
          } else {
            handleConfig(null);
          }
        }
      };
      xhr.onerror = function() { handleConfig(null); };
      xhr.send();
    }

    function handleConfig(cfg: any) {
      if (!cfg) {
        setLoading(false);
        return;
      }

      // Expose config to Android app via JS bridge — MUST match (web) setup page contract
      (window as any).TOUCHPOINT_CONFIG = {
        configured: !!cfg.configured,
        mode: cfg.mode || null,
        merchantWallet: cfg.merchantWallet || null,
        brandKey: cfg.brandKey || null,
        locked: !!cfg.locked,
        lockdownMode: cfg.lockdownMode || "none",
        unlockCodeHash: cfg.unlockCodeHash || null
      };

      console.log("[Legacy Setup] Exposed config to JS bridge:", (window as any).TOUCHPOINT_CONFIG);

      if (cfg.configured) {
        var qs = [];
        if (sc) qs.push("scale=" + encodeURIComponent(sc));
        if (cfg.lockdownMode && cfg.lockdownMode !== "none") {
          qs.push("lockdownMode=" + encodeURIComponent(cfg.lockdownMode));
          if (cfg.unlockCodeHash) {
            qs.push("unlockHash=" + encodeURIComponent(cfg.unlockCodeHash));
          }
        }
        var queryStr = qs.length > 0 ? "?" + qs.join("&") : "";
        var prefix = "/legacy";
        var redirectUrl = "";

        if (cfg.mode === "terminal") {
          redirectUrl = prefix + "/terminal/" + cfg.merchantWallet + queryStr;
        } else if (cfg.mode === "handheld") {
          redirectUrl = prefix + "/handheld/" + cfg.merchantWallet + queryStr;
        } else if (cfg.mode === "kds") {
          redirectUrl = prefix + "/kitchen/" + cfg.merchantWallet + queryStr;
        } else if (cfg.mode === "kiosk") {
          redirectUrl = prefix + "/kiosk/" + cfg.merchantWallet + queryStr;
        } else {
          redirectUrl = prefix + "/terminal/" + cfg.merchantWallet + queryStr;
        }

        console.log("[Legacy Setup] Device configured, redirecting to:", redirectUrl);
        window.location.replace(redirectUrl);
      } else {
        setConfig(cfg);
        setLoading(false);
      }
    }

    checkConfig();
    (window as any).TOUCHPOINT_INSTALL_ID = instId;
  }, []);

  function handleManualCheck() {
    setChecking(true);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_URL + "?installationId=" + encodeURIComponent(installationId), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setChecking(false);
        if (xhr.status === 200) {
          try {
            var cfg = JSON.parse(xhr.responseText);
            if (cfg.configured) {
              var qs = [];
              if (scale) qs.push("scale=" + encodeURIComponent(scale));
              if (cfg.lockdownMode && cfg.lockdownMode !== "none") {
                qs.push("lockdownMode=" + encodeURIComponent(cfg.lockdownMode));
                if (cfg.unlockCodeHash) {
                  qs.push("unlockHash=" + encodeURIComponent(cfg.unlockCodeHash));
                }
              }
              var queryStr = qs.length > 0 ? "?" + qs.join("&") : "";
              var prefix = "/legacy";
              var redirectUrl = "";

              if (cfg.mode === "terminal") {
                redirectUrl = prefix + "/terminal/" + cfg.merchantWallet + queryStr;
              } else if (cfg.mode === "handheld") {
                redirectUrl = prefix + "/handheld/" + cfg.merchantWallet + queryStr;
              } else if (cfg.mode === "kds") {
                redirectUrl = prefix + "/kitchen/" + cfg.merchantWallet + queryStr;
              } else if (cfg.mode === "kiosk") {
                redirectUrl = prefix + "/kiosk/" + cfg.merchantWallet + queryStr;
              } else {
                redirectUrl = prefix + "/terminal/" + cfg.merchantWallet + queryStr;
              }

              window.location.replace(redirectUrl);
            } else {
              setConfig(cfg);
            }
          } catch(e) {}
        }
      }
    };
    xhr.onerror = function() { setChecking(false); };
    xhr.send();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#171717",
        color: "#f5f5f5",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box"
      }}
    >
      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid #333",
              borderTopColor: "#10b981",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#a3a3a3" }}>Initializing Touchpoint...</p>
        </div>
      )}

      {/* Redirecting State */}
      {!loading && config && config.configured && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid #333",
              borderTopColor: "#10b981",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#a3a3a3" }}>Launching terminal...</p>
        </div>
      )}

      {/* Setup Form */}
      {!loading && (!config || !config.configured) && (
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: "#262626",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #404040",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#0a0a0a",
              padding: 24,
              textAlign: "center",
              borderBottom: "1px solid #262626",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: "#262626",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                border: "1px solid #404040",
                fontSize: 28,
              }}
            >
              📱
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Device Awaiting Configuration
            </h1>
            <p style={{ color: "#a3a3a3", fontSize: 13, marginTop: 4 }}>
              Contact your administrator to provision this device
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: 32 }}>
            {/* Installation ID */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#d4d4d4",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Installation ID
              </label>
              <input
                type="text"
                readOnly
                value={installationId}
                style={{
                  width: "100%",
                  backgroundColor: "rgba(10,10,10,0.5)",
                  border: "1px solid #404040",
                  borderRadius: 8,
                  padding: "12px 16px",
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: 13,
                  marginTop: 8,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: 11, color: "#737373", marginTop: 8 }}>
                Provide this ID to your administrator to configure this device.
              </p>
            </div>

            {/* Status */}
            <div
              style={{
                padding: 16,
                backgroundColor: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <p style={{ fontWeight: 600, color: "#fbbf24", fontSize: 14, margin: "0 0 4px" }}>
                🔒 Device Not Configured
              </p>
              <p style={{ color: "rgba(253,224,71,0.8)", fontSize: 13, margin: 0 }}>
                This device must be provisioned by an admin before it can be used.
              </p>
            </div>

            {/* Check Configuration Button */}
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              style={{
                width: "100%",
                backgroundColor: checking ? "#404040" : "#059669",
                color: checking ? "#737373" : "#fff",
                fontWeight: 700,
                padding: "16px 24px",
                borderRadius: 12,
                border: "none",
                fontSize: 16,
                cursor: checking ? "default" : "pointer",
                textAlign: "center",
              }}
            >
              {checking ? "Checking..." : "↻ Check Configuration"}
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              backgroundColor: "rgba(10,10,10,0.5)",
              padding: 16,
              borderTop: "1px solid #262626",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#525252",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Touchpoint Provisioning Required
            </p>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: "@keyframes spin { to { transform: rotate(360deg); } }",
        }}
      />
    </div>
  );
}
