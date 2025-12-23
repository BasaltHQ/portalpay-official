# --- Builder stage ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app
# Install OS deps required by sharp/libvips
RUN apt-get update && apt-get install -y --no-install-recommends libvips && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
# Install devDependencies for build; ignore peer conflicts during install
RUN npm ci --include=dev --legacy-peer-deps

# Copy source
COPY . .

# Build with type and lint errors ignored via next.config.js settings
# Set production env and inject NEXT_PUBLIC_* values at build time (into client bundle)
ENV NODE_ENV=production

# Build-time public env (used by client bundle). Pass via --build-arg in docker build.
ARG NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ARG NEXT_PUBLIC_CHAIN_ID
ARG NEXT_PUBLIC_RECIPIENT_ADDRESS
# Token addresses and decimals (ensure client bundle has configured ERC20s)
ARG NEXT_PUBLIC_BASE_USDC_ADDRESS
ARG NEXT_PUBLIC_BASE_USDT_ADDRESS
ARG NEXT_PUBLIC_BASE_CBBTC_ADDRESS
ARG NEXT_PUBLIC_BASE_CBXRP_ADDRESS
ARG NEXT_PUBLIC_BASE_SOL_ADDRESS
ARG NEXT_PUBLIC_BASE_USDC_DECIMALS
ARG NEXT_PUBLIC_BASE_USDT_DECIMALS
ARG NEXT_PUBLIC_BASE_CBBTC_DECIMALS
ARG NEXT_PUBLIC_BASE_CBXRP_DECIMALS
ARG NEXT_PUBLIC_BASE_SOL_DECIMALS

ENV NEXT_PUBLIC_THIRDWEB_CLIENT_ID=${NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
ENV NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
ENV NEXT_PUBLIC_RECIPIENT_ADDRESS=${NEXT_PUBLIC_RECIPIENT_ADDRESS}
ENV NEXT_PUBLIC_BASE_USDC_ADDRESS=${NEXT_PUBLIC_BASE_USDC_ADDRESS}
ENV NEXT_PUBLIC_BASE_USDT_ADDRESS=${NEXT_PUBLIC_BASE_USDT_ADDRESS}
ENV NEXT_PUBLIC_BASE_CBBTC_ADDRESS=${NEXT_PUBLIC_BASE_CBBTC_ADDRESS}
ENV NEXT_PUBLIC_BASE_CBXRP_ADDRESS=${NEXT_PUBLIC_BASE_CBXRP_ADDRESS}
ENV NEXT_PUBLIC_BASE_SOL_ADDRESS=${NEXT_PUBLIC_BASE_SOL_ADDRESS}
ENV NEXT_PUBLIC_BASE_USDC_DECIMALS=${NEXT_PUBLIC_BASE_USDC_DECIMALS}
ENV NEXT_PUBLIC_BASE_USDT_DECIMALS=${NEXT_PUBLIC_BASE_USDT_DECIMALS}
ENV NEXT_PUBLIC_BASE_CBBTC_DECIMALS=${NEXT_PUBLIC_BASE_CBBTC_DECIMALS}
ENV NEXT_PUBLIC_BASE_CBXRP_DECIMALS=${NEXT_PUBLIC_BASE_CBXRP_DECIMALS}
ENV NEXT_PUBLIC_BASE_SOL_DECIMALS=${NEXT_PUBLIC_BASE_SOL_DECIMALS}

RUN npm run build

# --- Runtime stage (standalone) ---
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# Install OS deps required by sharp/libvips
RUN apt-get update && apt-get install -y --no-install-recommends libvips && rm -rf /var/lib/apt/lists/*

# Use non-root 'node' user from base image
# Ensure application directory exists
RUN mkdir -p /app

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Include markdown docs so /developers/docs/* can render at runtime
COPY --from=builder /app/docs ./docs
# Ensure uploads directory is writable by the runtime user
RUN mkdir -p /app/public/uploads && chown -R node:node /app/public/uploads
# Ensure Next.js image cache directory exists and is writable by the runtime user
RUN mkdir -p /app/.next/cache && chown -R node:node /app/.next

# Expose port
EXPOSE 3000

# Set necessary env for Next runtime
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Prefer internal base URL for server-to-server calls
ENV INTERNAL_BASE_URL=http://localhost:3000

USER node

CMD ["node", "server.js"]
