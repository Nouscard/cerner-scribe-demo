# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Define build arguments
ARG PORT=3000
ARG AUTH_URL
ARG TOKEN_URL
ARG FHIR_BASE
ARG CLIENT_ID
ARG CLIENT_SECRET
ARG REDIRECT_URI
ARG SCOPES

# Set environment variables from build args
ENV PORT=$PORT
ENV AUTH_URL=$AUTH_URL
ENV TOKEN_URL=$TOKEN_URL
ENV FHIR_BASE=$FHIR_BASE
ENV CLIENT_ID=$CLIENT_ID
ENV CLIENT_SECRET=$CLIENT_SECRET
ENV REDIRECT_URI="https://scribe-demo.medway.ai/login-callback"
ENV SCOPES="openid fhirUser patient/*.read offline_access user/Patient.read user/AllergyIntolerance.read user/Observation.read user/MedicationRequest.read user/Condition.read"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 