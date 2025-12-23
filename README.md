# PortalPay

A modern crypto payment gateway that integrates with POS systems, allowing customers to pay with stablecoins (USDC, USDT, cbBTC, cbXRP, ETH) using QR codes. Built with Next.js, Thirdweb, and featuring a stunning liquid glass morphism UI.

## Features

### For Consumers
- **QR Code Payments**: Scan QR codes from printed POS receipts
- **Multi-Token Support**: Pay with USDC, USDT, cbBTC, cbXRP, or ETH
- **Simple Interface**: Clean, mobile-responsive payment portal
- **Loyalty Program**: Optional registration for rewards
- **Thirdweb Checkout**: Secure, seamless payment processing

### For Admins
- **Custom Branding**: White-label payment portal with custom colors and logo
- **Token Ratio Management**: Set desired token distribution in reserve wallet
- **Smart Rotation**: Automatic token rotation based on set ratios
- **Analytics Dashboard**: View transactions, total value, fees, and trends
- **Mobile Responsive**: Access admin panel from any device

### Technical Features
- **Liquid Glass Morphism UI**: Modern, elegant design aesthetic
- **Cosmos DB Integration**: Scalable transaction and settings storage
- **Base Sepolia Support**: Built for Base network
- **Real-time Updates**: Live transaction tracking

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Liquid Glass Morphism
- **UI Components**: shadcn/ui, Radix UI
- **Blockchain**: Thirdweb SDK, Base Sepolia
- **Database**: Azure Cosmos DB
- **QR Codes**: qrcode.react

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Thirdweb account and client ID
- Azure Cosmos DB account

### Installation

1. **Navigate to the payportal directory**:
   ```bash
   cd payportal
   ```

2. **Install dependencies** (already done if you followed initial setup):
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   The `.env.local` file has been created with the necessary configuration. Verify all values are correct:
   - `COSMOS_CONNECTION_STRING`: Your Cosmos DB connection string
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: Your Thirdweb client ID
   - Token addresses and decimals for Base Sepolia

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)

## Usage

### For Businesses

1. **Initial Setup**:
   - Visit `/admin` to configure your business settings
   - Set your business name, colors, and logo
   - Configure your reserve wallet address
   - Set token ratios for your reserve

2. **Generate Payment QR Codes**:
   - On the home page, enter a receipt ID
   - Generate QR code
   - Print QR code on customer receipts from your POS

3. **Monitor Transactions**:
   - View analytics in the admin dashboard
   - Track transaction volume, value, and fees

### For Customers

1. **Scan QR Code**: Use your phone's camera to scan the QR code on your receipt
2. **View Receipt**: See itemized receipt details
3. **Connect Wallet**: Connect your crypto wallet via Thirdweb
4. **Complete Payment**: Confirm and complete the transaction
5. **Optional**: Join loyalty program by entering email

## Project Structure

```
payportal/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home page with QR generator
│   │   ├── admin/
│   │   │   └── page.tsx               # Admin dashboard
│   │   ├── pay/
│   │   │   └── [receiptId]/
│   │   │       └── page.tsx           # Payment portal
│   │   └── api/
│   │       ├── settings/              # Business settings API
│   │       ├── transactions/          # Transaction logging API
│   │       └── receipts/              # Receipt data API
│   ├── components/
│   │   └── ui/                        # shadcn UI components
│   └── lib/
│       ├── cosmos.ts                  # Database utilities
│       ├── thirdweb.ts               # Thirdweb configuration
│       └── utils.ts                   # Utility functions
├── .env.local                         # Environment variables
└── package.json
```

## Database Schema

### Transactions Container
```typescript
{
  id: string;
  receiptId: string;
  businessId: string;
  amount: number;
  currency: string;
  customerWallet?: string;
  timestamp: string;
  status: "pending" | "completed" | "failed";
  transactionHash?: string;
  fees: number;
}
```

### Settings Container
```typescript
{
  id: string;
  businessId: string;
  businessName: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  tokenRatios: {
    cbXRP: number;
    cbBTC: number;
    USDC: number;
    USDT: number;
    ETH: number;
  };
  reserveWallet: string;
  currentRotation: string;
  rotationIndex: number;
}
```

## Integration with POS Systems

To integrate PortalPay with your POS system:

1. **Generate Receipt IDs**: Create unique receipt IDs in your POS
2. **API Integration**: Call the receipts API to create payment links
3. **QR Code Printing**: Print QR codes on receipts with the payment URL
4. **Webhook Setup**: Configure webhooks to receive payment confirmations

## Development

- **Port**: Runs on port 3001 (to avoid conflicts with other apps)
- **Hot Reload**: Changes automatically reload in development
- **Type Safety**: Full TypeScript support

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Environment Variables**: Ensure all production environment variables are set

## Support & Documentation

- **Thirdweb Docs**: [https://portal.thirdweb.com](https://portal.thirdweb.com)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Azure Cosmos DB**: [https://learn.microsoft.com/azure/cosmos-db](https://learn.microsoft.com/azure/cosmos-db)

## License

Built for the chicken-bones project ecosystem.
