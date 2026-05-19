/**
 * Legacy Touchpoint Setup Page
 * 
 * This is a STANDALONE server component for Chrome < 99 devices (VP550).
 * It does NOT re-export the (web) setup page because Next.js client-side
 * JS bundles may contain syntax that Chrome 93 cannot parse, preventing
 * React hydration entirely.
 * 
 * Instead, this page renders static HTML with an inline <script> that uses
 * only ES5-compatible JavaScript to:
 *   1. Generate/persist an installation ID
 *   2. Poll /api/touchpoint/config for provisioning
 *   3. Redirect to /legacy/terminal/[wallet] once configured
 */

export default function LegacyTouchpointSetup({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Server component — no client JS dependencies
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
      }}
    >
      {/* Loading state — shown until JS runs */}
      <div id="tp-loading" suppressHydrationWarning style={{ textAlign: "center" }}>
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

      {/* Setup form — shown when device is not configured */}
      <div
        id="tp-setup"
        suppressHydrationWarning
        style={{
          display: "none",
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
              id="tp-install-id"
              type="text"
              readOnly
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
            id="tp-check-btn"
            type="button"
            style={{
              width: "100%",
              backgroundColor: "#059669",
              color: "#fff",
              fontWeight: 700,
              padding: "16px 24px",
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            ↻ Check Configuration
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

      {/* Redirecting state */}
      <div id="tp-redirect" suppressHydrationWarning style={{ display: "none", textAlign: "center" }}>
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

      {/* CSS animation for spinner */}
      <style
        dangerouslySetInnerHTML={{
          __html: "@keyframes spin { to { transform: rotate(360deg); } }",
        }}
      />

      {/* 
        Inline vanilla JS — ES5 compatible for Chrome 93.
        This runs WITHOUT React hydration.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var STORAGE_KEY = "touchpoint_installation_id";
  var API_URL = "/api/touchpoint/config";
  
  // Parse query params (ES5 safe)
  function getParam(name) {
    var match = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }
  
  // Generate installation ID
  function generateId() {
    return Date.now() + "-" + Math.random().toString(36).substring(2, 15);
  }
  
  // Get or create installation ID
  function getInstallationId() {
    var paramId = getParam("installationId");
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
  
  var installId = getInstallationId();
  var scale = getParam("scale");
  
  // Show the setup form
  function showSetup() {
    var loading = document.getElementById("tp-loading");
    var setup = document.getElementById("tp-setup");
    var idInput = document.getElementById("tp-install-id");
    if (loading) loading.style.display = "none";
    if (setup) setup.style.display = "block";
    if (idInput) idInput.value = installId;
  }
  
  // Show redirect state  
  function showRedirect(mode) {
    var loading = document.getElementById("tp-loading");
    var setup = document.getElementById("tp-setup");
    var redir = document.getElementById("tp-redirect");
    if (loading) loading.style.display = "none";
    if (setup) setup.style.display = "none";
    if (redir) redir.style.display = "block";
  }
  
  // Build redirect URL
  function buildRedirectUrl(cfg) {
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
    
    if (cfg.mode === "terminal") {
      return prefix + "/terminal/" + cfg.merchantWallet + queryStr;
    } else if (cfg.mode === "handheld") {
      return prefix + "/handheld/" + cfg.merchantWallet + queryStr;
    } else if (cfg.mode === "kds") {
      return prefix + "/kitchen/" + cfg.merchantWallet + queryStr;
    } else if (cfg.mode === "kiosk") {
      return prefix + "/kiosk/" + cfg.merchantWallet + queryStr;
    }
    return prefix + "/terminal/" + cfg.merchantWallet + queryStr;
  }
  
  // Fetch configuration
  function checkConfig(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_URL + "?installationId=" + encodeURIComponent(installId), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var cfg = JSON.parse(xhr.responseText);
            callback(null, cfg);
          } catch(e) {
            callback(e, null);
          }
        } else {
          callback(new Error("HTTP " + xhr.status), null);
        }
      }
    };
    xhr.onerror = function() { callback(new Error("Network error"), null); };
    xhr.send();
  }
  
  // Handle config response
  function handleConfig(err, cfg) {
    if (err) {
      console.log("[Legacy Setup] Config error:", err);
      showSetup();
      return;
    }
    
    // Expose config to Android app via JS bridge — MUST match (web) setup page contract
    // The APK reads window.TOUCHPOINT_CONFIG to determine lockdown mode, provisioning status, etc.
    window.TOUCHPOINT_CONFIG = {
      configured: !!(cfg && cfg.configured),
      mode: (cfg && cfg.mode) || null,
      merchantWallet: (cfg && cfg.merchantWallet) || null,
      brandKey: (cfg && cfg.brandKey) || null,
      locked: !!(cfg && cfg.locked),
      lockdownMode: (cfg && cfg.lockdownMode) || "none",
      unlockCodeHash: (cfg && cfg.unlockCodeHash) || null
    };
    console.log("[Legacy Setup] Exposed config to JS bridge:", window.TOUCHPOINT_CONFIG);
    
    if (cfg && cfg.configured) {
      console.log("[Legacy Setup] Device configured, redirecting to:", cfg.mode);
      showRedirect(cfg.mode);
      // Use location.replace for a clean redirect (no back button)
      window.location.replace(buildRedirectUrl(cfg));
    } else {
      showSetup();
    }
  }
  
  // Initial check
  checkConfig(handleConfig);
  
  // Manual check button
  var btn = document.getElementById("tp-check-btn");
  if (btn) {
    btn.onclick = function() {
      btn.textContent = "Checking...";
      btn.disabled = true;
      btn.style.backgroundColor = "#404040";
      btn.style.color = "#737373";
      checkConfig(function(err, cfg) {
        btn.textContent = "↻ Check Configuration";
        btn.disabled = false;
        btn.style.backgroundColor = "#059669";
        btn.style.color = "#fff";
        handleConfig(err, cfg);
      });
    };
  }
  
  // Expose installation ID for Android app bridge
  window.TOUCHPOINT_INSTALL_ID = installId;
})();
          `,
        }}
      />
    </div>
  );
}
