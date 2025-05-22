# Wally the Wallet Watcher Backend README

# Wally the Wallet Watcher - Backend

Welcome to the backend of the Wally the Wallet Watcher project! This README provides instructions for setting up and running the backend server.

## Project Structure

The backend is organized as follows:

- **src/**: Contains all backend source code.
  - **app.ts**: Entry point of the application, sets up the Express server and middleware.
  - **controllers/**: Contains route controllers for handling API requests.
  - **routes/**: Defines the API routes.
  - **services/**: Contains business logic and services.
  - **infrastructure/**: Infrastructure-related code, including database and monitoring.
  - **utils/**: Utility functions for various tasks.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd wally-wallet-watcher/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Running the Server

To start the backend server, run:
```
npm start
```

The server will be running on `http://localhost:3000`.

### Testing

To run tests, use:
```
npm test
```

### Environment Variables

Create a `.env` file in the root of the backend directory and add the necessary environment variables. You can refer to the `.env.example` file for guidance.

## TODOs

- Implement wallet controller logic in `controllers/walletController.ts`.
- Implement wallet routes in `routes/walletRoutes.ts`.
- Implement wallet service functions in `services/walletService.ts`.
- Implement database client logic in `infra/database/dbClients.ts`.
- Implement logging logic in `infra/mon/logger.ts`.
- Implement utility functions in `utils/helpers.ts`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Thanks to all contributors and the open-source community for their support!