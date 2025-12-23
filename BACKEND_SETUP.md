# Varuni Backoffice - Backend Setup Guide

This guide will help you set up the complete backend infrastructure for the Varuni Backoffice restaurant management system using GraphQL and MongoDB.

## 🏗️ Architecture Overview

The backend consists of:
- **GraphQL API** - Apollo Server v5 (latest stable) integrated with Next.js 15 App Router
- **MongoDB Database** - NoSQL database with Mongoose ODM (latest stable)
- **Authentication** - JWT-based authentication (to be implemented)
- **Real-time Features** - GraphQL subscriptions (to be implemented)

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **MongoDB** running locally or MongoDB Atlas account
3. **Git** for version control

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/varuni-backoffice

# For production, use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/varuni-backoffice

# Authentication (for future implementation)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The database will be created automatically

#### Option B: MongoDB Atlas (Recommended for production)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

### 4. Seed the Database

```bash
npm run seed
```

This will create sample data including:
- Admin user
- Team members
- Inventory items
- Shifts
- Invoices
- Analytics data

### 5. Start the Development Server

```bash
npm run dev
```

The GraphQL API will be available at: `http://localhost:3000/api/graphql`

## 📊 Database Schema

### Core Models

1. **User** - System users and authentication
2. **TeamMember** - Staff management with performance tracking
3. **Shift** - Scheduling and shift management
4. **InventoryItem** - Stock management with status tracking
5. **Invoice** - Financial management and billing
6. **Analytics** - Reporting and insights

### Key Features

- **Indexed Queries** - Optimized for performance
- **Data Validation** - Mongoose schemas with validation
- **Relationships** - Proper references between models
- **Audit Trail** - Timestamps and user tracking

## 🔌 GraphQL API

### Endpoint
- **Development**: `http://localhost:3000/api/graphql`
- **Production**: `https://your-domain.com/api/graphql`

### Key Operations

#### Queries
- `teamMembers` - Get all team members
- `shifts` - Get shifts with date filtering
- `inventoryItems` - Get inventory with status
- `invoices` - Get financial data
- `analytics` - Get reporting data

#### Mutations
- `createTeamMember` - Add new staff
- `updateStock` - Update inventory levels
- `createShift` - Schedule shifts
- `createInvoice` - Generate invoices
- `syncFromToast` - Sync with Toast POS

#### Subscriptions (Future)
- Real-time updates for shifts, inventory, and invoices

## 🛠️ Development Workflow

### 1. Adding New Models

1. Create model in `src/lib/models/`
2. Add to GraphQL schema in `src/lib/graphql/schema.ts`
3. Implement resolvers in `src/lib/graphql/resolvers.ts`
4. Update seed data if needed

### 2. Testing GraphQL Queries

Use the GraphQL Playground at `http://localhost:3000/api/graphql`:

```graphql
# Example: Get all team members
query {
  teamMembers {
    id
    name
    role
    department
    performance {
      rating
      completedShifts
    }
  }
}

# Example: Create a new team member
mutation {
  createTeamMember(input: {
    name: "John Doe"
    email: "john@example.com"
    role: "Server"
    department: "Front of House"
    hourlyRate: 18.50
    availability: "Part-time"
    skills: ["Customer Service", "POS Systems"]
  }) {
    id
    name
    email
  }
}
```

### 3. Database Operations

```bash
# Seed database
npm run seed

# Reset database (clear all data)
# Manually delete collections or drop database

# View database (using MongoDB Compass or CLI)
mongosh varuni-backoffice
```

## 🔒 Security Considerations

### Current Implementation
- Basic error handling
- Input validation via Mongoose schemas
- Environment variable configuration

### Future Enhancements
- JWT authentication
- Role-based access control
- Rate limiting
- Input sanitization
- CORS configuration

## 🚀 Production Deployment

### 1. Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/varuni-backoffice
JWT_SECRET=your-production-jwt-secret
```

### 2. Database
- Use MongoDB Atlas or managed MongoDB service
- Enable database backups
- Set up monitoring and alerts

### 3. Application
- Deploy to Vercel, Netlify, or your preferred platform
- Set up CI/CD pipeline
- Configure domain and SSL

### 4. Monitoring
- Set up error tracking (Sentry, etc.)
- Database performance monitoring
- API usage analytics

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **GraphQL Schema Errors**
   - Ensure all resolvers are implemented
   - Check for circular dependencies
   - Validate schema syntax

3. **TypeScript Errors**
   - Run `npm run lint` to check for issues
   - Ensure all dependencies are installed
   - Check type definitions

### Debug Mode

Add to `.env.local`:
```env
DEBUG=apollo-server:*
```

## 📚 Additional Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [GraphQL Specification](https://graphql.org/learn/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Update documentation
5. Test thoroughly

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review GraphQL playground for API testing
3. Check MongoDB logs for database issues
4. Create an issue in the repository

---

**Happy coding! 🚀** 