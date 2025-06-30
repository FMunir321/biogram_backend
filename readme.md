# Biogram Backend

A robust Node.js/Express.js backend service for user authentication and social media management.

## Current Project Structure

```
biogram_backend/
├── config/                 # Configuration files
│   ├── db.js              # Database configuration
│   └── email.js           # Email configuration
├── controllers/           # Request handlers
│   ├── authController.js  # Authentication logic
│   ├── socialLinkController.js
│   └── userController.js
├── middleware/           # Express middleware
│   └── auth.js          # Authentication middleware
├── models/              # Database models
│   ├── SocialLink.js
│   ├── User.js
│   └── UserVerification.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── socialLinkRoutes.js
│   └── userRoutes.js
├── utils/              # Utility functions
│   ├── email.js
│   ├── emailSender.js
│   └── emailService.js
└── server.js          # Application entry point
```

## Features

- User authentication with email/phone support
- OTP-based verification system
- JWT-based authentication
- Social link management
- User profile management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account for email notifications

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AUTH_EMAIL=your_gmail_email
AUTH_PASS=your_gmail_app_password
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Start the server:
   ```bash
   npm start
   ```

## Project Improvement Roadmap

### Phase 1: High Priority (Immediate Implementation)

#### 1. Security Improvements (Critical)
**Rationale**: Essential for protecting user data and preventing vulnerabilities
- [ ] Add rate limiting to prevent API abuse
- [ ] Implement request validation for all endpoints
- [ ] Set up security headers using helmet.js
- [ ] Add input sanitization
- [ ] Configure CORS properly with specific origins

#### 2. Error Handling (Critical)
**Rationale**: Crucial for debugging, maintenance, and user experience
- [ ] Create a centralized error handling system
- [ ] Add custom error classes for different types of errors
- [ ] Implement error logging service
- [ ] Add validation middleware for requests
- [ ] Set up error monitoring and alerting

#### 3. Configuration Management (Critical)
**Rationale**: Essential for maintainability and deployment across environments
- [ ] Create separate configuration files for:
  - Development environment
  - Production environment
  - Testing environment
- [ ] Move all hardcoded values to configuration
- [ ] Implement configuration validation
- [ ] Set up secure secrets management
- [ ] Add configuration documentation

### Phase 2: Medium Priority (Next 2-3 Weeks)

#### 4. Code Organization
**Rationale**: Improves maintainability and scalability
- [ ] Create services layer:
  ```
  services/
  ├── auth/
  ├── user/
  ├── email/
  └── social/
  ```
- [ ] Reorganize utils folder:
  ```
  utils/
  ├── email/
  ├── validation/
  ├── security/
  └── helpers/
  ```
- [ ] Implement proper dependency injection
- [ ] Add TypeScript for better type safety

#### 5. Logging System
**Rationale**: Essential for monitoring and debugging in production
- [ ] Implement structured logging (Winston/Bunyan)
- [ ] Add request logging middleware
- [ ] Set up different log levels for dev/prod
- [ ] Configure log rotation
- [ ] Set up log aggregation

#### 6. Development Workflow
**Rationale**: Ensures code quality and consistency
- [ ] Add ESLint configuration
- [ ] Set up Prettier
- [ ] Add pre-commit hooks
- [ ] Create development guidelines
- [ ] Set up CI/CD pipeline

### Phase 3: Lower Priority (Future Implementation)

#### 7. Testing Framework
**Rationale**: Ensures reliability and prevents regressions
- [ ] Set up testing framework (Jest/Mocha)
- [ ] Add unit tests for models
- [ ] Add integration tests for API endpoints
- [ ] Set up test coverage reporting
- [ ] Add automated testing in CI pipeline

#### 8. API Documentation
**Rationale**: Improves developer experience and API adoption
- [ ] Add Swagger/OpenAPI documentation
- [ ] Create API documentation using JSDoc
- [ ] Add endpoint documentation in README
- [ ] Include request/response examples
- [ ] Set up automated documentation generation

#### 9. Database Optimization
**Rationale**: Improves performance and maintainability
- [ ] Add database migrations
- [ ] Implement database seeding
- [ ] Add indexes for performance
- [ ] Set up database backup system
- [ ] Implement data archival strategy

#### 10. Monitoring and Performance
**Rationale**: Essential for production reliability
- [ ] Add health check endpoints
- [ ] Implement performance monitoring
- [ ] Add metrics collection
- [ ] Set up performance testing
- [ ] Configure alerting system

## API Endpoints

### Authentication
- POST `/api/auth/signup` - User registration
- POST `/api/auth/verify-otp` - OTP verification
- POST `/api/auth/login` - User login

### User Management
- GET `/api/user/profile` - Get user profile
- PUT `/api/user/profile` - Update user profile

### Social Links
- GET `/api/social-links` - Get user's social links
- POST `/api/social-links` - Add new social link
- PUT `/api/social-links/:id` - Update social link
- DELETE `/api/social-links/:id` - Delete social link

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
