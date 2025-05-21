# Wally the Wallet Watcher

## Overview
Wally the Wallet Watcher is a Next.js app designed to monitor wallet activities and automate non-custodial token forwarding for users on Base. It features a Next.js frontend, Node.js/Express backend, Redis for fast data, SQL for tokenlist backup, and robust contract event watching.

## Project Structure
frontend/: Next.js React app for user interaction with mini-app interface.
backend/: Express/TypeScript API, contract/event logic, notifications, and job workers.
contracts/: Solidity sources, ABIs, and typechain output.
infrastructure/: Docker, DB schemas, monitoring configs.
scripts/: Automation scripts for deployment, seeding, and more.
monitoring/: Prometheus/Grafana configs..

## Setup Instructions

### Frontend
```bash
cd frontend
npm install
npm run start
```

### Backend
```bash
cd backend
npm install
npm run start
```

## Folder/File Purposes
frontend/src/components/: UI components
frontend/src/hooks/: Custom React hooks
frontend/src/services/: API and blockchain logic
frontend/src/utils/: Formatting/utilities
backend/src/controllers/: API controllers
backend/src/routes/: API routes
backend/src/services/: Business logic, contract/event/notification services
infrastructure/docker/: Dockerfiles
infrastructure/database/: SQL schemas
infrastructure/monitoring/: Monitoring configs

## Monitoring
See `monitoring/README.md` for Prometheus/Grafana setup.

## Contribution
Fork and PRs welcome!

## License
MIT License. See LICENSE.
