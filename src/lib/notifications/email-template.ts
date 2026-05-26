export interface EmailTemplateOptions {
  brandName: string;
  brandColor: string;
  logoUrl?: string;
  logoShape?: "square" | "circle";
  title: string;
  subtitle?: string;
  message: string;
  details?: { label: string; value: string; isCode?: boolean }[];
  ctaText?: string;
  ctaUrl?: string;
}

export function generateHtmlEmailTemplate({
  brandName = "BasaltSurge",
  brandColor = "#35ff7c",
  logoUrl,
  logoShape = "square",
  title,
  subtitle,
  message,
  details = [],
  ctaText,
  ctaUrl,
}: EmailTemplateOptions): string {
  const displayLogo = logoUrl || "https://surge.basalthq.com/Surge.png";
  
  // Format header colors based on brandColor brightness
  const isLight = isLightColor(brandColor);
  const headerTextColor = isLight ? "#0f172a" : "#ffffff";
  const headerSubtitleColor = isLight ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.7)";
  
  // Format details grid
  let detailsHtml = "";
  if (details && details.length > 0) {
    detailsHtml = `
      <div style="margin-top: 28px; background: rgba(0, 0, 0, 0.02); border: 1px solid rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 20px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${details
            .map(
              (item) => `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.04); color: #64748b; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; vertical-align: top;">
                ${item.label}
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.04); color: #0f172a; text-align: right; font-weight: 600; width: 65%; word-break: break-all; vertical-align: top; ${
                item.isCode
                  ? "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px;"
                  : ""
              }">
                ${item.value}
              </td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    `;
  }

  // Generate CTA button
  let ctaHtml = "";
  if (ctaText && ctaUrl) {
    ctaHtml = `
      <div style="margin-top: 32px; text-align: center;">
        <a href="${ctaUrl}" target="_blank" style="background-color: ${brandColor}; color: ${
      isLightColor(brandColor) ? "#0f172a" : "#ffffff"
    }; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transition: all 0.2s ease;">
          ${ctaText}
        </a>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid rgba(0, 0, 0, 0.05);">
        
        <!-- Brand Header Section -->
        <div style="background-color: ${brandColor}; background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0.2)); padding: 36px 32px; text-align: center; position: relative;">
          ${
            displayLogo
              ? `<img src="${displayLogo}" alt="${brandName}" style="max-height: 56px; max-width: 56px; border-radius: ${logoShape === "circle" ? "50%" : "12px"}; margin-bottom: 16px; display: inline-block; object-fit: contain; background: #ffffff; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />`
              : ""
          }
          <h1 style="color: ${headerTextColor}; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;">
            ${title}
          </h1>
          ${
            subtitle
              ? `<p style="color: ${headerSubtitleColor}; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">${subtitle}</p>`
              : ""
          }
        </div>
        
        <!-- Body Content Section -->
        <div style="padding: 40px 32px; background-color: #ffffff;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0; margin-bottom: 24px;">
            ${message}
          </p>
          
          ${detailsHtml}
          
          ${ctaHtml}
          
          <!-- Elegant divider line -->
          <div style="margin-top: 40px; border-top: 1px solid #f1f5f9;"></div>
          
          <!-- Branded Footer -->
          <div style="margin-top: 32px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            <p style="margin: 0; font-weight: 600; color: #64748b; font-size: 13px;">
              Thank you for choosing ${brandName}
            </p>
            <p style="margin: 6px 0 0 0;">
              This is an automated notification. Please do not reply directly to this email.
            </p>
            <p style="margin: 16px 0 0 0; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;">
              Powered by BasaltSurge Protocol
            </p>
          </div>
          
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Determine if a color is light or dark to automatically decide text color (contrast).
 */
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128;
  }
  return true; // Default to black text if color format unrecognized
}
