# Environment Configuration

Create a `.env.local` file in the root directory with the following configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/varuni-backoffice
# For production, use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/varuni-backoffice

# JWT Authentication Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql

# CORS Configuration (for production)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Security Configuration
# Generate with: openssl rand -base64 32
SESSION_SECRET=your-session-secret-key-here

# API Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000

# Optional: External Services
# REDIS_URL=redis://localhost:6379
# SENDGRID_API_KEY=your-sendgrid-key
# STRIPE_SECRET_KEY=your-stripe-secret-key
```

## Security Best Practices

1. **JWT_SECRET**: Generate a strong, random secret key (at least 32 characters)
2. **Change all default values** before production deployment
3. **Use environment-specific configurations**
4. **Keep secrets secure** and never commit them to version control
5. **Use HTTPS** in production
6. **Configure CORS** properly for your domain

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Use strong, unique `JWT_SECRET`
- [ ] Configure MongoDB Atlas connection
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies 