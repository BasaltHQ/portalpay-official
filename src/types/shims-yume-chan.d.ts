/* Ambient module shims to silence TS resolution errors for optional WebUSB/WebADB packages.
 * These libraries are dynamically imported at runtime; providing any-typed declarations avoids
 * compile-time failures when the modules are not installed or lack type definitions.
 */

declare module "@yume-chan/adb-daemon-webusb" {
  export const AdbDaemonWebUsbConnection: any;
  const _default: any;
  export default _default;
}

declare module "@yume-chan/adb-credential-web" {
  export const AdbWebCredentialStore: any;
  export const AdbCredentialWebStore: any;
  export const AdbCredentialStore: any;
  export const AdbPublicKeyCredentialStore: any;
  const _default: any;
  export default _default;
}

declare module "@yume-chan/adb" {
  export const Adb: any;
  export const AdbDaemonTransport: any;
  export const DaemonTransport: any;
  const _default: any;
  export default _default;
}
