# P2P DEX Frontend

A Next.js-based frontend for a peer-to-peer decentralized exchange (DEX) platform with Web3 integration, Firebase backend, and multi-chain support.

## 🚀 Features

- **Web3 Integration**: Built with Wagmi and Viem for blockchain interactions
- **Multi-Chain Support**: Lisk Sepolia, Base Sepolia, and Core Testnet
- **Firebase Backend**: Authentication, Firestore database, and real-time notifications
- **Wallet Integration**: MetaMask and Coinbase Wallet support
- **Admin Dashboard**: Comprehensive admin interface for platform management
- **P2P Trading**: Peer-to-peer trading with escrow functionality
- **Real-time Updates**: Live notifications and trade status updates

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **Git**

### Required Accounts & Services

1. **Firebase Project**: You'll need a Firebase project for authentication and database
2. **Blockchain RPC Endpoints**: The app uses public RPC endpoints, but you may want to set up your own
3. **Web3 Wallet**: MetaMask or Coinbase Wallet for blockchain interactions

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "p2p-dex-project-wagmi version/frontend"
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Required for API routes)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key_with_quotes"

# Smart Contract Address (Required)
NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS=0x...your_contract_address
```

### 4. Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one

2. **Enable Services**:
   - **Authentication**: Enable Email/Password authentication
   - **Firestore Database**: Create a database in test mode
   - **Storage**: Enable Firebase Storage
   - **Cloud Messaging**: Enable for notifications

3. **Get Configuration**:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web app or create a new one
   - Copy the configuration values to your `.env.local`

4. **Service Account** (for API routes):
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Use the values in your `.env.local`

### 5. Smart Contract Deployment

The application requires a deployed P2P Escrow smart contract. You'll need to:

1. Deploy the contract to your target networks (Lisk Sepolia, Base Sepolia, Core Testnet)
2. Add the contract address to `NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS`

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (dapp)/           # Main dapp pages
│   ├── admin/            # Admin dashboard pages
│   └── api/              # API routes
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── modals/           # Modal components
│   ├── notifications/    # Notification components
│   ├── ui/               # Reusable UI components
│   └── web3/             # Web3-specific components
├── lib/                  # Utility libraries
│   ├── config.ts         # Wagmi configuration
│   ├── firebase.ts       # Firebase client setup
│   └── firebase-admin.ts # Firebase admin setup
├── abis/                 # Smart contract ABIs
├── constants/            # Application constants
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Configuration

### Supported Networks

The application supports the following blockchain networks:

- **Lisk Sepolia Testnet** (ID: 4202) - Primary network
- **Morph Holesky** (ID: 2810) - Layer 2 testnet
- **Base Sepolia Testnet** (ID: 84532) - Layer 2 testnet
- **Core Testnet** (ID: 1114) - Bitcoin-powered testnet

### Wallet Connectors

- **MetaMask**: Injected wallet connector
- **Coinbase Wallet**: Smart wallet integration

## 🧪 Testing

### Linting

```bash
npm run lint
```

### Type Checking

The project uses TypeScript for type safety. Type checking is performed during build.

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Configuration Errors**:
   - Ensure all Firebase environment variables are set correctly
   - Verify your Firebase project has the required services enabled

2. **Web3 Connection Issues**:
   - Make sure you have a Web3 wallet installed (MetaMask, Coinbase Wallet)
   - Ensure you're connected to a supported network

3. **Contract Interaction Errors**:
   - Verify the contract address is correct
   - Ensure the contract is deployed to the networks you're using

4. **Build Errors**:
   - Clear the `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Environment Variables Checklist

Before running the application, verify these environment variables are set:

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Viem Documentation](https://viem.sh)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


