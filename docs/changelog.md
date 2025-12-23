# Changelog

All notable changes to the PortalPay API are documented in this file.

The format follows [Semantic Versioning](https://semver.org/) where:
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

---

## [1.3.0] - Latest

### Partner Management and API Functionality
- Implement new function to persist brand configuration before provisioning and deployment
- Ensure branding settings are correctly saved to avoid timing issues
- Refactor API calls to improve error handling
- Streamline process of fetching brand-specific configurations
- Update Partner Management Panel to handle branding settings more effectively
- Merge progress snapshots during deployment
- Enhance user experience with consistent branding elements across contexts

---

## [1.2.9]

### Partner Management and API Enhancements
- Refactor wallet recipient handling to support both partner and platform containers
- Ensure correct recipient addresses based on environment variables
- Update UI to reflect share release type (partner or platform)
- Improve error handling for release actions
- Introduce new API endpoints for fetching merchant balances and transactions
- Implement brand-specific configurations for site and shop settings
- Enhance alignment with partner contexts

---

## [1.2.8] - ENTERPRISE EDITION

### Documentation and Docker Improvements
- Include markdown documentation in Docker image for runtime rendering
- Update package dependencies to include new Azure SDKs
- Revise README and guides for Shopify integration
- Add industry-specific use cases
- Enhance clarity and user guidance
- Remove deprecated manifest file
- Improve error handling in various components for better stability

---

## [1.2.7]

### API Documentation and Security Model
- Clarify wallet identity handling for public GET endpoints
- Allow use of `x-wallet` for merchant context selection
- Improve documentation on pricing configuration APIs
- Separate read and admin write access
- Revise quick start guide to emphasize origin enforcement and security headers
- Enhance error handling in API responses
- Update documentation for better clarity and consistency

---

## [1.2.6]

### Theme Management and API Response Handling
- Refactor global CSS for improved theme variable management
- Ensure no global defaults to prevent visual glitches
- Update layout components to dynamically set theme attributes based on route context
- Implement caching headers in API responses for receipts and site configuration
- Optimize performance
- Introduce dynamic theme locking for merchant and user flows
- Enhance user experience across portal and shop pages
- Improve error handling and response structure in receipt-related APIs

---

## [1.2.5]

### Documentation and Portal Improvements
- Refactor documentation to remove specific Azure APIM Option B references
- Enhance clarity across error handling, quick start guide, API reference, and security model
- Add new portal embedding examples
- Provide detailed API specifications for receipts (listing and creating)
- Enhance middleware for JWT handling
- Improve rate limit details in product management
- Update shop and portal pages for better theme handling

---

## [1.2.4]

### Authentication and Wallet Identity Updates
- Update API documentation to clarify wallet identity handling
- Remove references to deprecated `x-wallet` and `wallet` parameters
- Improve authentication requirements documentation
- Streamline developer experience with clearer API contracts

---

## Breaking Changes

### How We Handle Breaking Changes

- **Advance Notice**: Minimum 90 days notice for breaking changes
- **Deprecation Period**: Old endpoints remain functional during transition
- **Migration Guides**: Detailed guides provided for all breaking changes
- **Version Headers**: Use `X-API-Version` header to specify version

---

## Stay Updated

- **GitHub**: Watch the [repository](https://github.com/GenRevo89/portalpay) for release notifications
- **Discord**: Join our community for announcements
- **Docs**: Check [documentation](/developers/docs) for latest updates

---

## Reporting Issues

Found a bug? Please report it:
1. Check existing issues on GitHub
2. Include API version and correlation ID
3. Provide steps to reproduce
4. Include error messages and responses

---

**Repository**: https://github.com/GenRevo89/portalpay.git  
**Last Updated**: January 2026
