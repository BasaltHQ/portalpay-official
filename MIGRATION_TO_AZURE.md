# 🚀 Migration Guide: Local MongoDB → Azure Cosmos DB

This guide will help you migrate your Varuni application from local MongoDB to Azure Cosmos DB.

## 📋 Prerequisites

- Azure subscription
- Azure CLI installed
- Current application running locally with MongoDB

## 🔄 Migration Process

### Step 1: Create Azure Cosmos DB

1. **Login to Azure Portal**: https://portal.azure.com
2. **Create Cosmos DB Account**:
   ```bash
   # Alternative: Create via Azure CLI
   az cosmosdb create \
     --name varuni-database \
     --resource-group varuni-rg \
     --kind MongoDB \
     --server-version 4.2 \
     --default-consistency-level Session \
     --locations regionName="East US" failoverPriority=0 isZoneRedundant=False
   ```

3. **Get Connection String**:
   - Go to Settings → Connection String
   - Copy the Primary Connection String

### Step 2: Update Environment Configuration

1. **Update `.env.local`**:
   ```env
   # Replace your local MongoDB URI with Azure Cosmos DB
   MONGODB_URI=mongodb://varuni-database:YOUR_PASSWORD@varuni-database.mongo.cosmos.azure.com:10255/varuni-backoffice?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@varuni-database@
   
   # Keep other variables the same
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   NODE_ENV=development
   NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql
   ```

### Step 3: Test Azure Connection

```bash
# Test the new Azure connection
npm run test:connection
```

**Expected Output**:
```
🧪 Testing database connection...

🎉 SUCCESS! Database connection is working perfectly.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Database: varuni-backoffice
🏠 Host: Azure Cosmos DB
🔗 Ready State: 1 (1 = connected)
☁️  Azure Cosmos DB: Yes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Azure Cosmos DB Features:
   • SSL/TLS encryption enabled
   • Global distribution ready
   • Automatic scaling available
   • Built-in backup & restore
```

### Step 4: Initialize Data on Azure

**Option A: Start Fresh (Recommended)**
```bash
# Create admin users on Azure
npm run setup-auth

# Seed sample data (optional)
npm run seed
```

**Option B: Migrate Existing Data**
```bash
# Export from local MongoDB
mongodump --uri="mongodb://localhost:27017/varuni-backoffice" --out=./backup

# Import to Azure Cosmos DB
mongorestore --uri="your-azure-connection-string" ./backup/varuni-backoffice
```

### Step 5: Verify Migration

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Test login**:
   - Visit: http://localhost:3000/login
   - Login with: `admin@varuni.com` / `Admin@123!`

3. **Verify data**:
   - Check dashboard loads correctly
   - Verify all GraphQL queries work
   - Test CRUD operations

## 🚀 Deploy to Azure (Optional)

Once your database is on Azure, you can also deploy your application:

```bash
# Deploy application to Azure App Service
npm run deploy:azure
```

## 🔧 Troubleshooting

### Connection Issues

**Problem**: "Network error" or timeout
**Solution**:
1. Check firewall settings in Azure Portal
2. Add your IP to the IP Access Control List
3. Verify the connection string is correct

**Problem**: "Authentication failed"
**Solution**:
1. Verify the username/password in connection string
2. Check if the account keys have been regenerated
3. Ensure SSL is enabled

### Performance Issues

**Problem**: Slow queries
**Solution**:
1. Check Request Unit (RU) consumption in Azure Portal
2. Add appropriate indexes
3. Consider upgrading from Serverless to Provisioned throughput

### Data Issues

**Problem**: Data not appearing
**Solution**:
1. Check database and collection names match
2. Verify the connection is to the correct database
3. Run the data initialization scripts

## 💰 Cost Optimization

### Development
- **Use Serverless**: Pay only for what you use
- **Expected Cost**: $0-20/month for development
- **Monitor**: RU consumption in Azure Portal

### Production
- **Consider Provisioned**: For predictable workloads
- **Set up Alerts**: For high RU consumption
- **Use Regions**: Choose closest to your users

## 📊 Monitoring

### Azure Portal Metrics
1. **Request Units**: Monitor consumption patterns
2. **Latency**: Track query performance
3. **Availability**: Set up alerts for downtime
4. **Storage**: Monitor data growth

### Application Monitoring
```bash
# View Azure App Service logs (if deployed)
az webapp log tail --resource-group varuni-rg --name varuni-backoffice

# Monitor database connection in your app
# Connection status is logged automatically
```

## 🔐 Security Best Practices

### Network Security
1. **Enable IP Filtering**: Restrict access to known IPs
2. **Use Private Endpoints**: For production environments
3. **VNet Integration**: Connect with Azure Virtual Networks

### Data Security
1. **Enable Encryption**: At rest and in transit (enabled by default)
2. **Key Rotation**: Regularly rotate access keys
3. **RBAC**: Use role-based access control
4. **Backup**: Enable automatic backups

### Application Security
1. **Environment Variables**: Store secrets in Azure Key Vault
2. **SSL Certificates**: Use Azure's free SSL certificates
3. **Authentication**: Consider Azure AD integration

## ✅ Migration Checklist

- [ ] Azure Cosmos DB account created
- [ ] Connection string updated in `.env.local`
- [ ] Connection test passes (`npm run test:connection`)
- [ ] Admin users created (`npm run setup-auth`)
- [ ] Application starts successfully (`npm run dev`)
- [ ] Login functionality works
- [ ] Dashboard loads with data
- [ ] All CRUD operations functional
- [ ] Performance is acceptable
- [ ] Monitoring is set up
- [ ] Backup strategy is in place
- [ ] Security settings configured

## 🆘 Need Help?

### Azure Support
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Azure Support Portal](https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade)

### Community Resources
- [Stack Overflow - Azure Cosmos DB](https://stackoverflow.com/questions/tagged/azure-cosmosdb)
- [Azure Community Forum](https://social.msdn.microsoft.com/Forums/azure/home)

### Emergency Commands
```bash
# Rollback to local MongoDB (emergency)
# 1. Update .env.local back to local MongoDB URI
# 2. Start local MongoDB service
# 3. Restart your application

# Check Azure service status
az account show
az cosmosdb show --name varuni-database --resource-group varuni-rg
```

---

🎉 **Congratulations!** Your Varuni application is now running on Azure with enterprise-grade database infrastructure! 