
export type DomainVerificationResult = {
    verified: boolean;
    verificationId?: string;
    message?: string;
    txtRecord?: string;
};

export type DomainBindingResult = {
    success: boolean;
    message: string;
};

export interface DomainManager {
    /**
     * Generates or retrieves the verification ID for the domain.
     * @param domain The custom domain (e.g. shop.example.com)
     * @param brandKey The brand context (e.g. "basaltsurge") for dynamic keys
     */
    getVerificationId(domain: string, brandKey?: string): Promise<string>;

    /**
     * Verifies that the domain determines ownership (DNS TXT check).
     */
    verifyDomainOwnership(domain: string, verificationId: string, brandKey?: string): Promise<DomainVerificationResult>;

    /**
     * Configures the domain on the host (binds it).
     */
    bindDomain(domain: string): Promise<DomainBindingResult>;

    /**
     * Secure the domain with SSL.
     */
    secureDomain(domain: string): Promise<void>;
}
