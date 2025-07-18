# Bridge Smart App

A SMART on FHIR application that provides healthcare integration capabilities, including patient data access, clinical documentation (scribe), and intelligent document review services (IDRS).

## Overview

This application serves as a bridge between healthcare systems and Medway AI services, enabling:
- Patient data retrieval from FHIR-compliant systems
- Clinical documentation assistance
- Intelligent document review and summarization
- Secure authentication and authorization

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- Access to a FHIR-compliant healthcare system
- Medway AI API credentials
- Valid OAuth2 client credentials for your FHIR system

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bridge-smart-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # FHIR System Configuration
   AUTH_URL=https://your-fhir-system.com/auth
   TOKEN_URL=https://your-fhir-system.com/token
   FHIR_BASE=https://your-fhir-system.com/fhir
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   REDIRECT_URI=http://localhost:3000/login-callback
   SCOPES=launch launch/patient patient/*.read
   
   # Server Configuration
   PORT=3000
   ```

   **Important**: Replace the placeholder values with your actual FHIR system credentials and endpoints.

## Running the Application

### Development Mode

For development with auto-restart on file changes:
```bash
npm run dev
```

### Production Mode

For production deployment:
```bash
npm start
```

The application will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Application Features

### 1. Authentication Flow
- OAuth2-based authentication with FHIR systems
- Secure token management
- Launch context handling

### 2. Patient Management
- Patient list view (`/patient-list/:patientId`)
- Patient data retrieval from FHIR systems
- Integration with Medway AI session services

### 3. Clinical Documentation
- Scribe functionality (`/scribe/:patientId`)
- AI-powered clinical note generation
- Real-time documentation assistance

### 4. Intelligent Document Review
- IDRS (Intelligent Document Review Service) integration
- Document analysis and summarization
- Clinical decision support

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main application entry point |
| `/auth` | GET | Initiates OAuth2 authentication flow |
| `/login-callback` | GET | OAuth2 callback handler |
| `/patient-list/:patientId` | GET | Patient list view |
| `/scribe/:patientId` | GET | Clinical documentation interface |
| `/idrs` | GET | Intelligent document review service |
| `/token` | GET | Returns current access token |
| `/patient/:patientId/data` | GET | Retrieves patient data from FHIR |

## Configuration

### Environment Variables

The application uses the following environment variables:

- `AUTH_URL`: OAuth2 authorization endpoint
- `TOKEN_URL`: OAuth2 token endpoint
- `FHIR_BASE`: Base URL for FHIR API
- `CLIENT_ID`: OAuth2 client identifier
- `CLIENT_SECRET`: OAuth2 client secret
- `REDIRECT_URI`: OAuth2 redirect URI
- `SCOPES`: OAuth2 scopes for FHIR access
- `PORT`: Server port (default: 3000)

### Static Web App Configuration

The `staticwebapp.config.json` file configures routing for Azure Static Web Apps deployment, mapping application routes to the appropriate handlers.

## Development

### Project Structure

```
bridge-smart-app/
├── index.js                 # Main application server
├── package.json            # Dependencies and scripts
├── staticwebapp.config.json # Azure Static Web Apps config
├── views/                  # Frontend templates
│   ├── index.html         # Main application interface
│   ├── patient-list.html  # Patient list view
│   ├── scribe.html        # Clinical documentation interface
│   └── style.css          # Application styles
└── README.md              # This file
```

### Key Dependencies

- **express**: Web framework for Node.js
- **axios**: HTTP client for API requests
- **dotenv**: Environment variable management
- **nodemon**: Development server with auto-restart

## Deployment

### Local Development
The application is configured to run locally for development and testing.

### Azure Static Web Apps
The application includes configuration for deployment to Azure Static Web Apps. The `staticwebapp.config.json` file defines the routing rules for the deployed application.

## Security Considerations

- Store sensitive credentials in environment variables
- Use HTTPS in production environments
- Implement proper session management
- Follow FHIR security guidelines
- Regularly rotate API keys and tokens

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your OAuth2 credentials in the `.env` file
   - Ensure redirect URI matches your FHIR system configuration
   - Check that scopes are properly configured

2. **FHIR API Errors**
   - Verify FHIR_BASE URL is correct
   - Ensure access tokens are valid and not expired
   - Check FHIR system connectivity

3. **Port Conflicts**
   - Change the PORT in your `.env` file if 3000 is already in use

### Logs

The application provides detailed console logging for debugging:
- Authentication flow logs
- FHIR API request/response logs
- Error details with stack traces

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the application logs
3. Verify your FHIR system configuration
4. Contact your system administrator for FHIR access

## License

ISC License - see package.json for details.

## Author

manzi
