# Master Partner Container Services Agreement (PortalPay)

This Master Partner Container Services Agreement (this "Agreement") is entered into by and between the platform operator identified below ("PortalPay", "Provider", "we", or "us") and the counterparty identified below ("Partner", "you", or "Customer"). This Agreement governs Partner's use of PortalPay's partner‑branded container environment and related services.

Effective Date: ____________________  
Provider (PortalPay) Legal Name: PortalPay LLC, 1005 Wellesley Dr. SE, Albuquerque, NM 87106  
Partner Legal Name: ____________________  
Partner Address: ____________________  
Initial Term: see Order Form (Appendix A)  
Brand Key(s): see Order Form (Appendix A)

BY EXECUTING THE ORDER FORM (APPENDIX A) OR BY USING THE SERVICES, PARTNER AGREES TO THIS AGREEMENT.

## Recitals

- WHEREAS, Provider offers a multi‑tenant platform including a partner‑branded application container with brand isolation, artifact gating, split validation, and admin‑gated installer flows;  
- WHEREAS, Partner desires to engage Provider to provision and operate Partner's branded container and receive related support services;  
- NOW, THEREFORE, for good and valuable consideration, the parties agree as follows.

## 1. Definitions

- "Affiliate" means any entity that directly or indirectly controls, is controlled by, or is under common control with a party.  
- "Agreement" means this Master Partner Container Services Agreement including all appendices, schedules, and Order Forms.  
- "App Container" or "Partner Container" means an application instance configured with `CONTAINER_TYPE=partner`, `NEXT_PUBLIC_CONTAINER_TYPE=partner`, and a specific `BRAND_KEY`.  
- "Artifacts" means signed APKs and related binaries produced and stored per brand.  
- "Brand Materials" means Partner's names, trademarks, service marks, logos, trade dress, and other brand assets submitted to or loaded into the Services (e.g., `/public/brands/<BRAND_KEY>`), including branding associated with Partner's config.  
- "Confidential Information" means non‑public information disclosed by a party that is identified as confidential or that should reasonably be understood to be confidential (including trade secrets, product plans, code, documentation, designs, security reports, business information, and personal data).  
- "Documentation" means Provider's documentation, guides, examples, runbooks, and specifications, including repository docs referenced in this Agreement.  
- "External Wallet" means a third‑party wallet application not managed by the Services, including but not limited to MetaMask, Coinbase Wallet, Trust Wallet, Rainbow, and similar browser extension or mobile wallet applications that users connect independently.  
- "Gas Fees" means blockchain network transaction fees (e.g., Ethereum gas) required to execute on‑chain transactions such as PaymentSplitter deployments, token transfers, and other smart contract interactions.  
- "In‑App Wallet" means a wallet provisioned and managed within the Services via social login authentication (e.g., email, Google, Apple, or other OAuth providers), where private key custody and transaction signing are handled by Provider's infrastructure.  
- "Merchant(s)" means businesses operating via Partner's container whose configurations, recipients, and payouts are validated and/or bound by the Services.  
- "Order Form" means an ordering document executed by the parties that references this Agreement and specifies Brand Keys, environments, fees, contacts, and other details.  
- "PaymentSplitter" means a smart contract or mechanism used to divide funds among recipients by basis points (bps).  
- "Personal Data" means information relating to an identified or identifiable natural person and other data regulated by data protection laws.  
- "PortalPay Technology" means the Services, platform, software, code, APIs, CI/CD, build/sign pipeline, designs, architecture, Documentation, pricing and gating model, and all related intellectual property rights.  
- "Security Incident" means a confirmed unauthorized access to, use of, or disclosure of Partner's Confidential Information within the Services.  
- "Services" means provisioning and operation of the Partner Container, brand‑scoped identity and gating, split validation/binding, CI/CD for signed APKs, admin‑gated device installer flows, associated APIs, and standard support.  
- "SOW" means a statement of work describing professional services beyond the scope of Services.  
- "Sponsored Gas" means Gas Fees paid by Provider on behalf of users utilizing In‑App Wallets, subject to the terms of Section 8.6.  
- "Split" means the 10,000 bps allocation among platform, partner, and merchant recipients.

## 2. Interpretation and Order of Precedence

2.1 Interpretation. Headings are for convenience only and do not affect interpretation. "Including" means "including without limitation." The singular includes the plural and vice versa.  

2.2 Order of Precedence. If there is a conflict among the documents comprising this Agreement, the following order of precedence applies (highest listed first): (i) an Order Form (for commercial specifics only); (ii) a duly executed DPA; (iii) this Agreement; (iv) Documentation. Partner terms on purchase orders or other documents are void unless expressly accepted in writing.

## 3. Scope of Services and Service Description

3.1 Provisioning. Provider will provision and configure a Partner Container for the Brand Key(s) in the Order Form, including:  
- Brand‑scoped runtime identity using `CONTAINER_TYPE=partner` and `BRAND_KEY` so UI/metadata reflect the Partner brand (not platform defaults).  
- Artifact gating: Partner Containers only see signed APKs for their own `BRAND_KEY`; other brands are hidden by design.  
- Admin vs Recipient wallet separation (e.g., admin access via `NEXT_PUBLIC_OWNER_WALLET`/`ADMIN_WALLETS`; payouts via `PARTNER_WALLET` and `NEXT_PUBLIC_PLATFORM_WALLET`).  

3.2 Split Validation & Binding. Provider will validate PaymentSplitter recipients and bps so total shares deterministically sum to 10,000 bps and bind or signal redeploy as described in Documentation. Misconfigurations are surfaced via API signals (e.g., `platform_bps_mismatch`, `missing_platform_recipient`, `missing_partner_recipient`).

3.3 CI/CD & Artifact Distribution. Provider will implement/operate a build/sign/publish pipeline to produce brand‑specific signed APKs and stream them via admin‑only endpoints (`/api/admin/apk/[app]`), with visibility gated by container type and brand.

3.4 Documentation & Plan. Provider will deliver a provisioning plan including required environment variables, secrets, brand assets checklist, and validation checkpoints.

3.5 Changes & Roadmap. Provider may modify Services, Documentation, or features; Provider will use commercially reasonable efforts to avoid material degradation of core functionality used by Partner.

3.6 Acceptance. Acceptance of provisioning deliverables occurs when (a) brand assets render correctly in the Partner Container; (b) gating and admin role controls behave per Documentation; (c) split validation returns no misconfiguration blockers for a sample merchant; and (d) signed APK is accessible via admin‑gated endpoint as designed. Minor deviations that do not materially affect functionality will not delay acceptance.

3.7 Implementation Services. If Partner requests customization, integration, or rebranding beyond the Services, the parties may execute a SOW that describes scope, deliverables, timeline, dependencies, acceptance criteria, and fees. SOWs incorporate this Agreement by reference.

## 4. Access, Security, and Gating

4.1 Admin‑Only Controls. Device Installer Panel and relevant admin features are available only to Admin/Superadmin roles as configured.  

4.2 Brand Isolation. Provider enforces brand isolation for Artifacts and relevant UI/metadata. Partner acknowledges gating relies on environment configuration and agrees not to attempt to subvert gating or access non‑brand assets.  

4.3 Monitoring. Provider may monitor usage (in compliance with law) to ensure security, performance, billing accuracy, and compliance with this Agreement.  

4.4 Audit Rights (Limited). No more than once per twelve (12) months, Partner may request a high‑level attestation of security and operational controls. On reasonable written request and under an NDA, Provider will make available summaries of policies or third‑party audit reports (if any). No right to inspect source code, infrastructure internals, or personal data beyond what is reasonably necessary.

## 5. Data Protection and Privacy

5.1 Data Handling. Provider processes Partner‑submitted data solely to deliver and improve the Services. Provider will not sell Partner data.  

5.2 Roles. The parties acknowledge that, absent a separate DPA, Provider acts as a service provider/processor only where applicable. Partner remains responsible for notices/consents to its merchants/users.  

5.3 Security Program. Provider will maintain commercially reasonable administrative, physical, and technical safeguards appropriate to the nature of the Services.  

5.4 Security Incidents. Provider will notify Partner without undue delay (and in any event within seventy‑two (72) hours after confirmation) of a Security Incident impacting Partner data in the Services, and provide information reasonably available to help Partner meet legal obligations. Partner is responsible for its own notifications to merchants/users.  

5.5 Subprocessors; Transfers. Provider may engage Affiliates and third‑party subprocessors to provide the Services and may transfer data internationally where necessary, subject to appropriate safeguards. Provider remains responsible for their performance.  

5.6 Retention & Deletion. Provider may retain configuration and operational data for the duration of the Term and reasonable backup periods thereafter. Upon written request, and subject to legal obligations, Provider will delete Partner‑submitted data from active systems. Backups will age out per standard retention.  

5.7 Data Export. Partner may request exports of brand config and relevant operational data (subject to technical feasibility) during the Term. Post‑termination export assistance may be provided as transition services at Provider's standard rates.  

5.8 DPA. If required, parties may execute a DPA (Appendix B), which will govern Personal Data processing to the extent required by law.

## 6. Intellectual Property

6.1 Ownership. As between the parties, Provider retains all right, title, and interest in the PortalPay Technology and all intellectual property rights therein. Partner retains all right, title, and interest in the Brand Materials and Partner‑submitted content.  

6.2 License to Services. Subject to this Agreement and timely payment of fees, Provider grants Partner a limited, revocable, non‑exclusive, non‑transferable, non‑sublicensable license during the Term to access and use the Services for Partner's internal business purposes, consistent with Documentation and gating.  

6.3 Restrictions. Partner will not (and will not permit third parties to): (a) copy, modify, or create derivative works of the PortalPay Technology; (b) reverse engineer, decompile, or disassemble the Services (except to the limited extent permitted by applicable law notwithstanding this restriction); (c) remove or obscure proprietary notices; (d) use the Services in violation of applicable law or third‑party rights; (e) access the Services for benchmarking, competitive analysis, or to build a competing product; or (f) introduce malware, or interfere with security or access controls.  

6.4 Open Source; Third‑Party Components. Certain components may be subject to open‑source or third‑party licenses. To the extent there is a direct conflict with this Agreement, such licenses govern the use of the specific components.  

6.5 Independent Development. Provider may independently develop products or features that may be similar to or compete with Partner's ideas or requests, without obligation to Partner.  

6.6 Feedback. If Partner provides feedback, suggestions, or ideas, Partner grants Provider a perpetual, irrevocable, worldwide, sublicensable, royalty‑free license to use and exploit such feedback without restriction.  

6.7 Equitable Relief. Partner agrees that any breach or threatened breach of Section 6 or 7 may cause irreparable harm, and Provider may seek injunctive relief without the need to post bond, in addition to other remedies.

## 7. Marks, Branding, and Publicity

7.1 PortalPay Marks. Provider grants Partner a limited, non‑exclusive, non‑transferable, non‑sublicensable right during the Term to use Provider's trade name and marks solely to identify the Services to Partner's internal audiences, subject to Provider's brand guidelines. Partner will not: (a) use PortalPay marks in a manner likely to confuse; (b) register or claim rights in marks or domains confusingly similar to PortalPay's; or (c) alter or combine PortalPay marks with Partner brands without Provider's written consent.  

7.2 Partner License to PortalPay for Marketing and Campaigns. Partner grants Provider a non‑exclusive, worldwide, royalty‑free license during and after the Term to use Partner's Brand Materials submitted to (or displayed by) the Services—including names, marks, logos, screenshots of Partner's branded container and interfaces, and textual references to Partner—in Provider's marketing and promotional activities (including case studies, websites, social media, paid and organic advertising, investor and sales materials, conference collateral, demonstrations, and other marketing campaigns).  
- Quality Control. Provider will use the Brand Materials consistent with reasonable industry standards and, where supplied, Partner's brand guidelines.  
- Approvals. For substantial case studies or press releases (not routine logo placement or incidental screenshots), Provider will seek Partner's prior written approval, not to be unreasonably withheld or delayed.  
- Withdrawal/Opt‑Out. Partner may withdraw consent for future new uses of Brand Materials in marketing with thirty (30) days' written notice for reasonable cause (e.g., rebrand or regulatory concerns). Such withdrawal will not require removal of historical materials, versions already in distribution, archives, investor decks, or previously approved assets.  
- No Endorsement. Use of Brand Materials does not imply certification or endorsement unless explicitly stated and approved in writing.

## 8. Fees and Payment

8.1 Fees.  
- One‑Time Setup Fee (Partner selects one in Appendix A; non‑refundable once provisioning activities commence):  
  - Base Container Setup: USD 14,950; or  
  - Container + Mobile App: USD 20,995 (includes white‑labeled Android/Apple application development).  
  - Financing Option: Partners may elect 50% down payment with remainder financed over 3, 6, 9, or 12 months (see Appendix K for terms, rates, and payment schedules).  
- Monthly Subscription: USD 2,195 per month, billed in advance, month‑to‑month, 30 days' notice to cancel.  
- Revenue‑Based Discount: Monthly subscription fee may be reduced (including to $0) based on Partner's monthly processing volume through the platform, as described in Section 8.7.  

8.2 Taxes. Fees exclude taxes, duties, and governmental charges. Partner is responsible for all such amounts (excluding Provider's taxes on income).  

8.3 Invoicing & Late Payments; Cure. Invoices are due Net 15 days from invoice date. Late amounts may accrue interest at 1.5% per month or the maximum permitted by law, whichever is less. Provider may suspend Services for non‑payment upon notice. Partner's cure of non‑payment requires full remittance of past due amounts plus applicable interest.  

8.4 Set‑Off; No Withholding. Partner will not set‑off or withhold payments except as required by law. Any required withholding taxes will be grossed up so Provider receives full amounts.  

8.5 Overage Rates. Support Overage Rate is specified in Appendix A; if blank, Provider's then‑current standard expert support rate applies.

8.6 Gas Fee Sponsorship.  
- Sponsored Transactions. Provider will sponsor (i.e., pay on Partner's behalf) all Gas Fees for on‑chain transactions initiated through In‑App Wallets within the Partner Container, including but not limited to: PaymentSplitter deployments and re‑deployments; fund releases and distributions; token transfers; and other smart contract interactions required by the Services.  
- Exclusions (External Wallets). Gas Fees for transactions initiated by or through External Wallets (e.g., MetaMask, Coinbase Wallet, Trust Wallet, or any wallet not provisioned via the Services' social login flow) are NOT sponsored by Provider. Users connecting External Wallets are solely responsible for their own Gas Fees.  
- Billing Threshold. Provider will track cumulative Sponsored Gas for each Partner Container. When the cumulative Sponsored Gas for a Partner Container reaches USD 100.00 (the "Gas Billing Threshold"), Provider will invoice Partner for the total Sponsored Gas amount accrued. Partner will pay such invoice in accordance with Section 8.3.  
- Reporting. Provider will provide Partner with reasonable visibility into Sponsored Gas consumption upon request or via dashboard (if available).  
- Rate Determination. Sponsored Gas amounts are calculated based on actual Gas Fees incurred at the time of transaction execution, converted to USD at Provider's reasonable discretion using market rates at or near the time of the transaction.  
- No Guarantee of Gas Prices. Provider does not guarantee any particular gas price or transaction priority. Provider may, in its sole discretion, adjust gas price strategies to balance cost efficiency and transaction confirmation times.  
- Abuse & Misuse. Provider reserves the right to suspend gas sponsorship, impose additional fees, or terminate this benefit if Provider reasonably determines that Partner or its users are engaging in activity designed to artificially inflate gas consumption, exploit the sponsorship program, or otherwise abuse this benefit.

8.7 Revenue‑Based Discount Structure.  
- Purpose. Partners can reduce their monthly subscription fee based on processing volume generated through the platform. The discount structure rewards successful partners while managing platform risk, with the fee reducing to $0 once Provider earns a 500% margin on the monthly subscription through processing revenue.  
- Platform Revenue Share. At 50 basis points (0.5%) platform revenue share, the discount milestones are calculated as follows:  
- Milestone Schedule (see Appendix J for full detail):  
  - $0 – $878,999 monthly processing volume: $2,195/month (100% of subscription)  
  - $879,000 – $1,316,999 monthly processing volume: $1,646/month (75% of subscription)  
  - $1,317,000 – $1,755,999 monthly processing volume: $1,098/month (50% of subscription)  
  - $1,756,000 – $2,194,999 monthly processing volume: $549/month (25% of subscription)  
  - $2,195,000+ monthly processing volume: $0/month (0% of subscription)  
- Dynamic Adjustment. Subscription fees are recalculated monthly based on the previous month's actual processing volume. If volume increases, Partner immediately benefits from reduced fees for the following month. If volume decreases, the fee increases to match the appropriate tier for the following month. There is no "lock‑in" period—fees adjust up or down based on ongoing performance.  
- Verification. Provider will verify monthly processing volume through platform transaction records. Provider's determination of processing volume is final and binding absent manifest error.  
- Industry Adjustments. Provider reserves the right to adjust revenue thresholds based on industry‑specific factors, market saturation levels, and competitive landscape within the target vertical.

## 9. Service Levels and Support

9.1 Basic Technical Support (Included). Partner receives up to three (3) hours per calendar month of expert technical support included in the subscription.  
- Coverage: business‑hours (9:00–17:00, Provider local time), Monday–Friday, excluding Provider‑observed holidays.  
- Channels: Provider's designated email support queue and any available support portal; phone/real‑time channels may be offered at Provider's discretion based on severity.  
- Scope (included): configuration assistance; deployment verification; split validation diagnostics and misconfiguration triage; admin gating and role access issues; artifact distribution troubleshooting; routine CI/CD adjustments aligned to the documented pipeline; minor brand asset updates consistent with `/public/brands/<BRAND_KEY>` and Documentation. This scope does not include custom feature development, net‑new integrations, mobile OS/vendor issues beyond reasonable guidance, or third‑party system work.  
- Acknowledgement & Response Targets (non‑SLA targets):  
  - P1 (Critical—production outage or security incident): acknowledgement within 4 business hours; initial response within 1 business day.  
  - P2 (High—material degradation, blocking deploy/install): acknowledgement within 1 business day; initial response within 2 business days.  
  - P3 (Normal—configuration questions, minor issues): acknowledgement within 2 business days; initial response within 3 business days.  
  Targets are goals, not contractual SLAs; formal SLAs require a separate signed addendum.  
- Consumption & Rollover: included hours are consumed in 30‑minute increments; unused hours do not roll over; hours are aggregated across Brand Key(s) under the same Order Form.  
- Overage: additional expert support beyond included hours is billable at the Support Overage Rate specified in Appendix A (or Provider's standard rate) and requires Partner's prior written/email approval; billed in 30‑minute increments.  
- Escalation: Provider may escalate P1/P2 issues internally and reassign resources to mitigate impact; Partner will provide reasonably requested logs, screenshots, reproduction steps, and environment details to expedite resolution.

9.2 Support Exclusions. The following are excluded unless expressly agreed in a separate SOW or addendum: custom feature development; building/maintaining third‑party integrations; significant rebrands/redesigns; performance/load testing; dedicated on‑call/after‑hours coverage; data cleansing/migrations not triggered by Section 14.3; legal/compliance advisory; and activities outside the Services or Documentation.

9.3 Availability. The Services are provided on a best‑effort basis. Formal SLAs, specific uptime, or response‑time targets require a separate written addendum. No service credits are provided unless expressly set forth in a separate SLA.

9.4 Maintenance & Changes. Provider may schedule maintenance windows and emergency changes as needed; Provider will seek to minimize any adverse impact and, when practicable, provide notice via the agreed support channel.

## 10. Governance and Post‑Deploy Immutability

10.1 Fee Immutability. After a Partner Container is deployed, changes to `platformFeeBps` or `partnerFeeBps` are locked for partner administrators. Only authorized platform roles (`platform_admin` or `platform_superadmin`) may adjust post‑deploy fee bps and only if permitted by Provider policy.  

10.2 Brand Isolation & UI Locking. UI reflects disabled fee inputs post‑deploy; backend enforces immutability server‑side. Partner agrees not to attempt to circumvent immutability or gating.

## 11. Representations and Warranties

11.1 Mutual Authority. Each party represents and warrants that it has the full right, power, and authority to enter into and perform under this Agreement.  

11.2 Compliance. Each party will comply with applicable laws in performing its obligations. Partner represents it has obtained all rights necessary for Provider's use of Brand Materials and Partner data as contemplated.  

11.3 Disclaimer. EXCEPT AS EXPRESSLY STATED, THE SERVICES AND DOCUMENTATION ARE PROVIDED "AS IS" AND "AS AVAILABLE". PROVIDER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON‑INFRINGEMENT, AND THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR‑FREE.

## 12. Indemnification

12.1 By Partner. Partner will defend and indemnify Provider and its Affiliates from and against any third‑party claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys' fees) arising out of: (a) Partner's use of the Services in violation of this Agreement or applicable law; (b) Partner's Brand Materials, data, or content (including alleged infringement or misrepresentation of rights therein); or (c) activities of Partner's merchants or users through the Partner Container, except to the extent caused by Provider's breach of this Agreement.  

12.2 By Provider (IP Infringement). Provider will defend and indemnify Partner against third‑party claims alleging that the Services (as provided by Provider) infringe a valid patent, copyright, or trademark, and will pay resulting damages and reasonable attorneys' fees finally awarded, provided Partner promptly notifies Provider in writing, Provider controls the defense, and Partner reasonably cooperates.  

12.3 Exclusions. Provider's obligations do not apply to the extent a claim arises from: (a) combination of the Services with products not supplied by Provider; (b) modifications by anyone other than Provider; (c) use not in accordance with Documentation; (d) open‑source components under separate licenses; or (e) Partner data or Brand Materials.  

12.4 Remedies. If an infringement claim occurs or is likely, Provider may: (i) procure the right for Partner to continue using the Services; (ii) modify or replace the Services so they are non‑infringing while substantially preserving functionality; or (iii) terminate the impacted functionality and refund any prepaid and unused subscription fees for the affected portion.

## 13. Limitation of Liability

13.1 Exclusions. EXCEPT FOR CONFIDENTIALITY BREACHES, PARTNER'S PAYMENT OBLIGATIONS, OR INDEMNIFICATION OBLIGATIONS, NEITHER PARTY WILL BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR LOST PROFITS/REVENUES, EVEN IF ADVISED OF THE POSSIBILITY.  

13.2 Cap. EXCEPT FOR THE FOREGOING CARVE‑OUTS, EACH PARTY'S TOTAL LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID OR PAYABLE BY PARTNER TO PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.

## 14. Term, Renewal, Suspension, Absorption, and Termination

14.1 Term & Renewal. The Term commences on the Effective Date and continues per the plan selected in Appendix A:  
- Monthly plan: month‑to‑month, auto‑renews until terminated.  
- Annual plan: twelve (12) months, auto‑renews for successive twelve‑month terms unless either party gives thirty (30) days' notice prior to renewal. Provider may adjust subscription fees upon renewal with at least thirty (30) days' prior written notice.  

14.2 Termination. Either party may terminate for material breach with thirty (30) days' written notice if uncured. Partner may terminate for convenience: (a) monthly plan with thirty (30) days' prior written notice; (b) annual plan at any time, provided prepaid fees are non‑refundable. Upon termination, Provider will deprovision the Partner Container. Partner remains responsible for amounts due through the effective termination date.  

14.3 Suspension; Merchant Absorption on Non‑Payment. Provider may suspend access for non‑payment, security threats, or misuse, upon notice when practicable. If a suspension for non‑payment persists beyond fifteen (15) days from the suspension notice, Partner irrevocably agrees that Provider may absorb all merchants operating on the Partner's container by transitioning them to a Platform‑operated container and/or placing them under a direct relationship with Provider to maintain continuity of service, subject to applicable law.  
- Transition Rights. Partner authorizes Provider to contact merchants, export and migrate configuration, split, and operational data reasonably necessary to effect the transition, and to re‑bind PaymentSplitter recipients consistent with documented validation rules. Partner grants Provider a non‑exclusive, royalty‑free license to use Partner Brand Materials solely as reasonably necessary to inform merchants of the transition and to avoid disruption (this license is in addition to the marketing/publicity license in Section 7.2).  
- Notice & Process. Provider will provide written notice of absorption to Partner and merchants (where contactable) and use commercially reasonable efforts to minimize service disruption during the transition.  
- Financials. Partner remains liable for all amounts due through the effective absorption date. Resumption of Partner Container service after absorption requires full cure of past‑due amounts, payment of any re‑provisioning/setup fees, and Provider's written approval. Provider reserves the right, in its sole discretion, not to restore the Partner Container after absorption.  
- No Liability for Business Loss. Provider will not be liable for Partner's loss of business or profits arising from suspension/absorption due to Partner's non‑payment.  

14.4 Effects of Termination. Upon termination or expiration, Partner's access to the Services ceases. At Partner's written request within thirty (30) days, Provider will provide reasonable transition assistance (subject to fees at standard rates) and will delete Partner‑submitted data from active systems, subject to retention obligations and backups per Section 5.6.

## 15. Compliance

15.1 Export & Sanctions. Partner represents it is not restricted by U.S. or other applicable sanctions/export laws and will not use the Services in embargoed or sanctioned jurisdictions or for prohibited end‑uses.  

15.2 Anti‑Bribery. Each party will comply with applicable anti‑bribery and anti‑corruption laws.  

15.3 AML/KYC; PCI; Tax. Partner is solely responsible for AML/KYC, PCI DSS scope determinations, tax withholding/reporting, and regulatory obligations for its merchants and payouts. Provider provides technology only and is not a fiduciary, trustee, accountant, or regulated financial institution.

## 16. Business Continuity and Disaster Recovery

Provider will maintain business continuity and disaster recovery procedures appropriate to the Services' nature. Provider may perform periodic testing and will use commercially reasonable efforts to restore services after outages or disasters.

## 17. Insurance

Each party will maintain customary insurance coverage appropriate to its business and legal obligations, including commercial general liability. Upon reasonable request, a party will provide evidence of such insurance. Minimum coverage amounts may be specified in an Order Form or SOW if required.

## 18. Subcontractors; Assignment

18.1 Subcontractors. Provider may use subcontractors and subprocessors; Provider remains responsible for their performance under this Agreement.  

18.2 Assignment. Neither party may assign this Agreement without the other's consent, except to an Affiliate or in connection with merger, acquisition, or sale of substantially all assets, with notice. Any prohibited assignment is void.

## 19. Confidentiality

19.1 Obligations. The receiving party will use the disclosing party's Confidential Information solely to perform under this Agreement and protect it using reasonable measures. Exclusions include information that is public, known without restriction, independently developed without use of Confidential Information, or rightfully received from a third party without restriction.  

19.2 Compelled Disclosure. If the receiving party is compelled by law to disclose Confidential Information, it will provide prompt notice (if legally permissible) and reasonable assistance to seek protective treatment.  

19.3 Duration. Confidentiality obligations survive for three (3) years after termination, except trade secrets remain protected while they qualify as trade secrets.

## 20. Dispute Resolution

20.1 Good‑Faith Negotiation. The parties will attempt in good faith to resolve disputes promptly through escalation to executives.  

20.2 Arbitration. If not resolved within thirty (30) days, any dispute arising out of or relating to this Agreement will be finally settled by binding arbitration under the rules of the American Arbitration Association (AAA) by one arbitrator, in Albuquerque, New Mexico. Judgment on the award may be entered in any court having jurisdiction.  
- Class Action Waiver. Disputes must be brought in the parties' individual capacity, not as plaintiff or class member in any class or representative proceeding.  
- Injunctive Relief. Notwithstanding the foregoing, a party may seek injunctive relief in court for breaches of Sections 6, 7, or 19.

## 21. Miscellaneous

21.1 Governing Law; Venue. This Agreement is governed by the laws of the State of New Mexico, without regard to conflicts of law principles. Venue for any permitted court proceedings is Albuquerque, New Mexico.  

21.2 Force Majeure. Neither party is liable for failure or delay due to causes beyond its reasonable control (e.g., acts of God, flood, fire, earthquake, war, terrorism, epidemics, labor disputes, governmental action, failure of utilities/communications).  

21.3 Notices. Notices must be in writing and sent to the addresses on the Order Form or via agreed electronic channels; notices are deemed received upon delivery confirmation or five (5) business days after mailing.  

21.4 Entire Agreement; Amendments. This Agreement (including appendices) is the entire agreement and supersedes prior understandings. Amendments must be in writing signed by both parties.  

21.5 Severability; Waiver. If any provision is unenforceable, the remainder remains in effect. A waiver must be in writing and does not waive future breaches.  

21.6 Independent Contractors. The parties are independent contracting parties; no agency, partnership, or joint venture is created. No third‑party beneficiaries.  

21.7 Survival. Sections 2, 5, 6, 7, 8, 9.1–9.4, 10–14, 15, 16, 17, 19–21 and Appendices survive termination.  

21.8 Counterparts; Electronic Signatures. This Agreement may be executed in counterparts, and electronic signatures (e.g., DocuSign, Adobe Sign) are binding.

---

## Appendix A – Order Form

**Brand Key(s):** ____________________  

**Environment(s):** ____________________  

**Container Host/FQDN:** ____________________  

**Wallets:**  
- Admin Wallet (`NEXT_PUBLIC_OWNER_WALLET`): ____________________  
- Additional Admin Wallets (`ADMIN_WALLETS`): ____________________  
- Partner Recipient (`PARTNER_WALLET`): ____________________  
- Platform Recipient (`NEXT_PUBLIC_PLATFORM_WALLET`): ____________________  

**Artifacts Storage (if Partner‑managed):**  
- Storage Connection / Container / Prefix: ____________________  

**Fees:**  
- Setup Fee (select one):  
  - [ ] Base Container Setup: USD 14,950 (one‑time)  
  - [ ] Container + Mobile App: USD 20,995 (one‑time, includes white‑labeled Android/Apple app)  
- Monthly Subscription: USD 2,195 / month, billed in advance (subject to revenue‑based discounts per Section 8.7 and Appendix J)  
- Support Overage Rate: USD 150 / hour (billed in 30‑minute increments)  

**Billing Contact / Address:** ____________________  

**Technical Contact(s):** ____________________  

**Brand Guidelines URL (if any):** ____________________  

**Approvals Contact for Marketing/Case Studies:** ____________________  

**Special Terms (if any):** ____________________  

---

### Authorized Signatures

**PortalPay LLC:**

Signature: ____________________  
Printed Name: ____________________  
Title: ____________________  
Date: ____________________  

**Partner:**

Signature: ____________________  
Printed Name: ____________________  
Title: ____________________  
Date: ____________________  

---

## Appendix B – Data Processing Addendum (Optional)

If the parties execute a DPA, it will be attached or incorporated by reference here and govern the processing of personal data as required by applicable law (e.g., GDPR, CCPA). The DPA will supersede any conflicting data protection terms in this Agreement to the extent required by law.

---

## Appendix C – Brand & Wallet Checklist

- Brand assets present under `/public/brands/<BRAND_KEY>/` (logos, metadata).  
- Environment variables set (examples):  
  - `CONTAINER_TYPE=partner`  
  - `NEXT_PUBLIC_CONTAINER_TYPE=partner`  
  - `BRAND_KEY=<key>`  
  - `NEXT_PUBLIC_APP_URL=https://<domain>`  
  - `NEXT_PUBLIC_OWNER_WALLET=0x...`  
  - `ADMIN_WALLETS=0x...,0x...` (optional)  
  - `PARTNER_WALLET=0x...`  
  - `NEXT_PUBLIC_PLATFORM_WALLET=0x...`  
  - `NEXT_PUBLIC_RECIPIENT_ADDRESS=0x...` (if required by flows)  
- Storage/CDN (recommended):  
  - `AZURE_BLOB_PUBLIC_BASE_URL`, `NEXT_PUBLIC_AFD_HOSTNAME`, `NEXT_PUBLIC_BLOB_HOSTNAME`  
- CI/CD (examples):  
  - Build tools installed; keystore secrets available; signed APK naming convention `apks/brands/{BRAND_KEY}-signed.apk`.  
- Validation:  
  - Split recipients and bps validated; API signals indicate no misconfiguration (`needsRedeploy=false`).  
- Admin Gating:  
  - Admin‑only endpoints confirmed; Device Installer Panel access verified for Admin/Superadmin.  
- Immutability:  
  - Post‑deploy fee bps locked in UI and enforced by backend policy.

---

## Appendix D – Support Detail and Severity Definitions

- Severity Definitions:  
  - P1 (Critical): Production outage or Security Incident materially impacting service.  
  - P2 (High): Material degradation, blocking deploy/install flows.  
  - P3 (Normal): Configuration questions or minor issues without material business impact.  

- Included Support Hours: three (3) expert hours per calendar month, consumed in 30‑minute increments, non‑cumulative (no rollover), aggregated across Brand Key(s) under the same Order Form.  

- Overage: Pre‑approved in writing/email, billed at the Support Overage Rate in Appendix A (or Provider's then‑current standard rate), in 30‑minute increments.  

- Escalation: Partner will provide logs, screenshots, reproduction steps, and environment details; Provider may escalate and reassign resources.  

- Change Requests: Minor env/config updates aligned to Documentation are included; significant changes, rebrands, and net‑new integrations require a SOW.  

- Communication: Primary channel is the designated support email/portal; Provider may open bridge calls at its discretion for P1/P2.

---

## Appendix E – Change Management Procedure (Summary)

- Initiation: Partner submits change via support portal/email with scope, rationale, desired timing, and risk assessment.  
- Impact Analysis: Provider reviews for technical feasibility, security, capacity, and schedule; classifies as minor (included) or major (SOW).  
- Approval: Included changes scheduled; major changes require written SOW and fee approval.  
- Implementation: Changes executed in agreed window; roll‑back plan documented for impactful changes.  
- Validation: Post‑change checks; Partner sign‑off for major changes.

---

## Appendix F – Incident Response Outline (Summary)

- Detection: Automated monitoring and Partner reports.  
- Triage: Severity assignment (P1/P2/P3) and resource allocation.  
- Containment: Temporary gating/controls to isolate impact.  
- Eradication/Recovery: Fixes and restoration per DR/BCP.  
- Communication: Periodic updates for P1/P2; post‑mortem summary for P1 incidents.  
- Review: Lessons learned and preventative actions.

---

## Appendix G – Merchant Absorption Protocol (Non‑Payment)

- Trigger: Suspension persisting >15 days for non‑payment (Section 14.3).  
- Data Handling: Export and migration of configuration, splits, and operational data necessary for continuity.  
- Merchant Notice: Reasonable efforts to notify merchants and provide next steps.  
- Binding: Re‑bind PaymentSplitter recipients per documented validation rules.  
- Post‑Absorption: Partner's restoration only upon full cure, re‑provisioning fees, and Provider approval.

---

## Appendix H – Security Controls Summary (High‑Level)

- Administrative: Access reviews; role‑based access controls; secure secret handling.  
- Technical: TLS; encryption at rest (where applicable); audit logs; vulnerability management.  
- Physical/Cloud: Cloud provider safeguards; network segmentation; backup retention and testing.  
- Compliance: Best‑effort alignment to industry practices; formal certification only if separately stated.

---

## Appendix I – Gas Fee Sponsorship Summary

- Covered Wallets: In‑App Wallets (social login via email, Google, Apple, etc.)  
- Excluded Wallets: External Wallets (MetaMask, Coinbase Wallet, Trust Wallet, Rainbow, etc.)  
- Covered Transactions: PaymentSplitter deployments, fund releases, token transfers, smart contract interactions within the Services.  
- Billing Threshold: USD 100.00 cumulative Sponsored Gas per Partner Container triggers invoice.  
- Payment Terms: Per Section 8.3 (Net 15 days).  
- Abuse Provision: Provider may suspend or terminate sponsorship for abuse or artificial inflation.

---

## Appendix J – Revenue‑Based Discount Schedule

This Appendix details the revenue‑based discount structure referenced in Section 8.7.

### Discount Philosophy

The discount structure is designed to:  
1. Reward partners who drive significant processing volume through the platform  
2. Align Provider and Partner incentives—both parties benefit from growth  
3. Manage platform risk from partners who may not achieve market traction  
4. Allow the monthly subscription fee to reduce to $0 once Provider earns a 500% margin on the subscription through processing revenue

### Calculation Basis

- **Platform Revenue Share:** 50 basis points (0.5%) of all transactions processed  
- **Monthly Subscription:** USD 2,195  
- **Target Margin for $0 Fee:** 500% (i.e., $10,975 platform revenue = 5× the $2,195 subscription)  
- **Processing Volume for $0 Fee:** $2,195,000 (at 0.5% = $10,975 platform revenue)

### Progressive Discount Milestones

| Monthly Processing Volume | Platform Revenue @ 0.5% | Monthly Subscription Fee | % of Base | Margin Achieved |
|---------------------------|-------------------------|--------------------------|-----------|-----------------|
| $0 – $878,999 | $0 – $4,394 | $2,195 | 100% | <200% |
| $879,000 – $1,316,999 | $4,395 – $6,584 | $1,646 | 75% | 200% – 300% |
| $1,317,000 – $1,755,999 | $6,585 – $8,779 | $1,098 | 50% | 300% – 400% |
| $1,756,000 – $2,194,999 | $8,780 – $10,974 | $549 | 25% | 400% – 500% |
| **$2,195,000+** | **$10,975+** | **$0** | **0%** | **500%+** |

### Dynamic Adjustment Policy

- Subscription fees are **recalculated monthly** based on the previous month's actual processing volume.  
- If volume **increases**, Partner immediately benefits from reduced fees for the following month.  
- If volume **decreases**, the fee increases to match the appropriate tier for the following month.  
- There is **no "lock‑in" period**—fees adjust up or down based on ongoing performance.  
- Discounts are **performance‑based and dynamic**; Partners must maintain processing volume thresholds each month to retain their discount tier.

### Year 1 Summary (Assuming No Revenue Discounts Applied)

| Plan Component | Base Container | Container + Mobile App |
|----------------|----------------|------------------------|
| Setup Fee | $14,950 | $20,995 |
| Monthly Subscription (Year 1) | $26,340 (12 × $2,195) | $26,340 (12 × $2,195) |
| **Total Year 1** | **$41,290** | **$47,335** |

*Note: Monthly fees may be reduced through revenue‑based discount structure. Calculations assume standard monthly rate without revenue discounts applied.*

### Industry Considerations

Pricing and discount thresholds may be adjusted based on:  
- Target industry vertical (e.g., restaurant, retail, hospitality, professional services)  
- Market saturation in general market and on platform  
- Industry‑specific margins and transaction volumes  
- Competitive landscape within the target vertical

Any adjustments will be documented in the Order Form (Appendix A) or a separate written amendment.

---

## Appendix K – Setup Fee Financing Program

This Appendix details the optional financing program for setup fees referenced in Section 8.1.

### Program Overview

PortalPay offers a **50% Down Payment Financing Program** to make partner onboarding more accessible. Partners pay 50% of the setup fee at signing, with the remaining 50% financed over 3, 6, 9, or 12 months.

### Key Terms

- **Down Payment:** 50% of selected package fee due at contract signing  
- **Financed Amount:** Remaining 50% paid in equal monthly installments  
- **Interest Rates:** 0% APR for 3‑month term; simple interest applied to longer terms  
- **Payment Schedule:** Monthly payments due on the same day as signing date  
- **Late Fee:** 1.5% per month on past‑due amounts (in addition to standard late payment interest per Section 8.3)

### Setup Fee Packages

| Package | Full Price | 50% Down Payment | Financed Amount |
|---------|-----------|------------------|-----------------|
| **Base Container Setup** | $14,950 | **$7,475** | $7,475 |
| **Container + Mobile App** | $20,995 | **$10,497.50** | $10,497.50 |

### Financing Schedule: Base Container ($14,950)

**Down Payment at Signing: $7,475.00**

| Term | APR | Finance Charge | Total Financed | Monthly Payment | Total Setup Cost |
|------|-----|----------------|----------------|-----------------|------------------|
| **3 Months** | **0%** | $0.00 | $7,475.00 | **$2,491.67** | **$14,950.00** |
| **6 Months** | 6% | $224.25 | $7,699.25 | **$1,283.21** | **$15,174.25** |
| **9 Months** | 8% | $448.50 | $7,923.50 | **$880.39** | **$15,398.50** |
| **12 Months** | 10% | $747.50 | $8,222.50 | **$685.21** | **$15,697.50** |

### Financing Schedule: Container + Mobile App ($20,995)

**Down Payment at Signing: $10,497.50**

| Term | APR | Finance Charge | Total Financed | Monthly Payment | Total Setup Cost |
|------|-----|----------------|----------------|-----------------|------------------|
| **3 Months** | **0%** | $0.00 | $10,497.50 | **$3,499.17** | **$20,995.00** |
| **6 Months** | 6% | $314.93 | $10,812.43 | **$1,802.07** | **$21,309.93** |
| **9 Months** | 8% | $629.85 | $11,127.35 | **$1,236.37** | **$21,624.85** |
| **12 Months** | 10% | $1,049.75 | $11,547.25 | **$962.27** | **$22,044.75** |

### Interest Calculation

- Interest is calculated as **simple interest** on the financed principal  
- APR rates: 0% (3‑month), 6% (6‑month), 8% (9‑month), 10% (12‑month)  
- Formula: Finance Charge = Principal × APR × (Term in Months / 12)

### Total Due at Signing (Financing Option)

| Package | Down Payment | First Month Subscription | **Total at Signing** |
|---------|-------------|-------------------------|---------------------|
| Base Container | $7,475.00 | $2,195.00 | **$9,670.00** |
| Container + Mobile App | $10,497.50 | $2,195.00 | **$12,692.50** |

### Year 1 Summary with Financing

**Base Container – All Financing Options:**

| Component | 3‑Month | 6‑Month | 9‑Month | 12‑Month |
|-----------|---------|---------|---------|----------|
| Down Payment | $7,475.00 | $7,475.00 | $7,475.00 | $7,475.00 |
| Total Financed | $7,475.00 | $7,699.25 | $7,923.50 | $8,222.50 |
| Monthly Subscription (12 mo) | $26,340.00 | $26,340.00 | $26,340.00 | $26,340.00 |
| **Year 1 Total** | **$41,290.00** | **$41,514.25** | **$41,738.50** | **$42,037.50** |
| *Finance Charge* | *$0.00* | *$224.25* | *$448.50* | *$747.50* |

**Container + Mobile App – All Financing Options:**

| Component | 3‑Month | 6‑Month | 9‑Month | 12‑Month |
|-----------|---------|---------|---------|----------|
| Down Payment | $10,497.50 | $10,497.50 | $10,497.50 | $10,497.50 |
| Total Financed | $10,497.50 | $10,812.43 | $11,127.35 | $11,547.25 |
| Monthly Subscription (12 mo) | $26,340.00 | $26,340.00 | $26,340.00 | $26,340.00 |
| **Year 1 Total** | **$47,335.00** | **$47,649.93** | **$47,964.85** | **$48,384.75** |
| *Finance Charge* | *$0.00* | *$314.93* | *$629.85* | *$1,049.75* |

### Financing Terms and Conditions

**Eligibility:**  
- Financing is available to all partners in good standing  
- Credit check may be required for 9‑month and 12‑month terms  
- Provider reserves the right to deny financing at its sole discretion

**Default and Acceleration:**  
- Failure to make any scheduled financing payment within 15 days of due date constitutes default  
- Upon default, the entire remaining financed balance becomes immediately due and payable  
- Default interest rate: 18% APR on outstanding balance  
- Provider may suspend Services upon default per Section 14.3

**Prepayment:**  
- Partners may prepay the remaining financed balance at any time without penalty  
- Prepayment does not reduce the finance charge already accrued  
- Prepayment applies to principal first, then any outstanding interest

**Service Continuity:**  
- Container provisioning begins after down payment is received and processed  
- Services continue during financing period as long as payments are current  
- Missed payments may result in service suspension per Section 14.3

### Financing Election (Order Form Addendum)

If Partner elects financing, complete this section in the Order Form (Appendix A):

**Financing Election:** [ ] Yes, I elect financing [ ] No, I will pay the full setup fee

If financing elected:

**Package:** [ ] Base Container ($14,950) [ ] Container + Mobile App ($20,995)

**Financing Term:**  
[ ] 3 Months – 0% APR  
[ ] 6 Months – 6% APR  
[ ] 9 Months – 8% APR  
[ ] 12 Months – 10% APR

**Down Payment Amount:** $____________________

**Monthly Financing Payment:** $____________________

**First Payment Due Date:** ____________________

*Note: Monthly subscription fees ($2,195/month) are billed separately and in addition to financing payments. Revenue‑based discounts (Appendix J) apply only to monthly subscription fees, not to financing payments.*
