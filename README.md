# Backend API

Node.js Express backend API ready for Azure deployment.

## Prerequisites

- Node.js 14+
- Azure account
- Azure CLI or Azure portal access

## Local Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=your_database
   
   # JWT Configuration
   JWT_SECRET=your-jwt-secret-key
   SESSION_SECRET=your-session-secret-key
   ```
4. Run the application:
   ```
   npm run dev
   ```

## Deploying to Azure

### Option 1: Deploy using Azure App Service with GitHub Actions

1. Create an Azure App Service (Web App)
   - Go to the Azure Portal
   - Create a new App Service with Node.js runtime
   - Select appropriate pricing tier

2. Configure environment variables
   - In Azure portal, go to your App Service
   - Navigate to Settings > Configuration
   - Add all the necessary environment variables from your `.env` file

3. Set up GitHub Actions for CI/CD (if using GitHub)
   - Create a `.github/workflows/azure-deploy.yml` file
   - Configure the workflow to deploy to your Azure App Service
   - Add your Azure credentials as GitHub secrets

### Option 2: Deploy using Azure CLI

1. Install Azure CLI and log in:
   ```
   az login
   ```

2. Create a resource group (if needed):
   ```
   az group create --name myResourceGroup --location eastus
   ```

3. Create an App Service Plan:
   ```
   az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1
   ```

4. Create a Web App:
   ```
   az webapp create --name your-app-name --resource-group myResourceGroup --plan myAppServicePlan --runtime "NODE|14-lts"
   ```

5. Configure environment variables:
   ```
   az webapp config appsettings set --name your-app-name --resource-group myResourceGroup --settings DB_HOST=your-db-host DB_USER=your-db-user DB_PASSWORD=your-db-password DB_NAME=your-db-name JWT_SECRET=your-jwt-secret SESSION_SECRET=your-session-secret NODE_ENV=production
   ```

6. Deploy your code:
   ```
   az webapp deployment source config-local-git --name your-app-name --resource-group myResourceGroup
   git remote add azure <git-url-from-previous-command>
   git push azure main
   ```

### Option 3: Deploy using Azure DevOps

1. Create a new project in Azure DevOps
2. Set up a build pipeline to build your Node.js application
3. Set up a release pipeline to deploy to Azure App Service
4. Configure environment variables in the Azure App Service

## Database Setup

1. Create an Azure MySQL or SQL Database
2. Configure the connection string in your App Service settings
3. Run database migrations or setup scripts

## CORS Configuration

This application supports flexible CORS configuration through environment variables:

1. For a single frontend origin, set the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-frontend-app.azurewebsites.net
   ```

2. For multiple allowed origins, use the `ALLOWED_ORIGINS` environment variable with comma-separated values:
   ```
   ALLOWED_ORIGINS=https://app1.azurewebsites.net,https://app2.azurewebsites.net,https://your-domain.com
   ```

3. In Azure App Service, set these environment variables in the Configuration section:
   - Go to your App Service in the Azure Portal
   - Navigate to Settings > Configuration > Application settings
   - Add new application settings for `FRONTEND_URL` and/or `ALLOWED_ORIGINS`
   - Click "Save" to apply the changes

The application will automatically use these settings in production mode. In development mode, it will default to allowing `http://localhost:3000` and `http://localhost:5173`.

## Important Notes

- Make sure CORS settings in server.js are configured for your production frontend URL
- Ensure all environment variables are set in Azure App Service Configuration
- For local development, use `npm run dev`, and for production, Azure will use `npm start` 