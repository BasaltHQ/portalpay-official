# Azure Database Setup Guide

## 🚀 Setting Up Azure Cosmos DB with MongoDB API

### Step 1: Create Cosmos DB Account

1. **Login to Azure Portal**: https://portal.azure.com
2. **Create Resource** → **Azure Cosmos DB**
3. **Select**: MongoDB API
4. **Configuration**:
   - **Account Name**: `varuniengram`
   - **API**: MongoDB
   - **Location**: Choose nearest region
   - **Capacity Mode**: Serverless (recommended for development)
   - **Backup Policy**: Periodic (7-day retention)

### Step 2: Get Connection String

1. **Navigate to**: Your Cosmos DB Account
2. **Go to**: Settings → Connection String
3. **Copy**: Primary Connection String
   ```
   mongodb://varuniengram:PASSWORD@varuniengram.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@varuniengram@
   ```

### Step 3: Database Configuration

**Database Name**: `varuni-backoffice`
**Collections**: Will be auto-created by Mongoose

## 🔧 Environment Configuration

### For Development (.env.local)
```env
# Azure Cosmos DB Configuration
MONGODB_URI=mongodb://varuniengram:YOUR_PASSWORD@varuniengram.mongo.cosmos.azure.com:10255/varuni-backoffice?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@varuniengram@

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql
```

### For Production
```env
# Azure Cosmos DB Configuration
MONGODB_URI=mongodb://varuniengram:YOUR_PASSWORD@varuniengram.mongo.cosmos.azure.com:10255/varuni-backoffice?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@varuniengram@

# JWT Authentication (Use Azure Key Vault)
JWT_SECRET=your-production-secret-from-azure-key-vault
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_GRAPHQL_URL=https://your-domain.com/api/graphql
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## 🛡️ Security Best Practices

### 1. Network Security
- **Enable**: IP Access Control List
- **Add**: Your development IPs
- **For Production**: Use Azure Private Endpoints

### 2. Authentication
- **Use**: Connection strings with authentication
- **Store secrets**: In Azure Key Vault
- **Rotate keys**: Regularly

### 3. SSL/TLS
- **Always use**: SSL connections (enabled by default)
- **Verify**: SSL certificates in production

## 📊 Monitoring & Performance

### 1. Enable Monitoring
- **Metrics**: Request units, latency, availability
- **Alerts**: Set up for high RU consumption
- **Logs**: Enable diagnostic logging

### 2. Performance Optimization
- **Indexing**: Cosmos DB auto-indexes, but verify
- **Query patterns**: Monitor slow queries
- **Scaling**: Use serverless or adjust RU/s

## 💰 Cost Optimization

### Development
- **Use**: Serverless tier
- **Expected cost**: $0-50/month for development

### Production
- **Consider**: Provisioned throughput for predictable workloads
- **Monitor**: RU consumption patterns
- **Optimize**: Query efficiency

## 🔄 Migration Process

### From Local MongoDB
1. **Export local data**: Using mongodump
2. **Import to Azure**: Using mongorestore with connection string
3. **Update environment**: Switch MONGODB_URI
4. **Test thoroughly**: All CRUD operations

### Alternative: Start Fresh
1. **Update connection string**
2. **Run setup script**: Creates admin users
3. **Seed sample data**: If needed

## 🚀 Deployment Options

### Azure App Service
- **Easy deployment**: GitHub integration
- **Environment variables**: Managed in portal
- **SSL certificates**: Free with custom domains

### Azure Container Instances
- **Docker deployment**: Full control
- **Scaling**: Manual or scheduled
- **Networking**: Virtual network integration

### Azure Static Web Apps
- **Frontend**: Static hosting
- **API**: Serverless functions
- **Authentication**: Built-in providers

## 🔗 Useful Links

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [MongoDB API for Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb-introduction)
- [Connection String Reference](https://docs.microsoft.com/en-us/azure/cosmos-db/connect-mongodb-account)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

## ⚡ Quick Start Commands

```bash
# Test connection
npm run test:connection

# Setup admin users on Azure
npm run setup-auth

# Deploy to Azure
npm run deploy:azure
``` 