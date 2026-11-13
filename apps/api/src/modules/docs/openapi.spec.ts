/**
 * OpenAPI 3.1.0 Specification for HealthBridge India API
 * Covers all currently implemented production endpoints (Day 1)
 */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'HealthBridge India — One Nation One Health Record API',
    description:
      'Production-grade RESTful API service supporting ABHA integration, multi-role RBAC, consent management, and unified health records under DISHA standards.',
    version: '1.0.0',
    contact: {
      name: 'HealthBridge India Technical Architecture Team',
      email: 'tech@healthbridge.in',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server (v1)',
    },
    {
      url: 'https://api.healthbridge.in/api/v1',
      description: 'Production Server (v1)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide short-lived JWT access token in Authorization: Bearer <token>',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'hb_access_token',
        description: 'HttpOnly secure session access token cookie',
      },
    },
    schemas: {
      StandardSuccess: {
        type: 'object',
        required: ['success', 'message', 'data', 'timestamp'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Request completed' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 5 },
              hasNextPage: { type: 'boolean', example: false },
              hasPrevPage: { type: 'boolean', example: false },
            },
          },
          requestId: { type: 'string', example: 'c6f39459-25f0-4fa8-b2db-16b744d0ec58' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      StandardError: {
        type: 'object',
        required: ['success', 'message', 'code', 'requestId', 'timestamp'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Human-readable message' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          requestId: { type: 'string', example: 'c6f39459-25f0-4fa8-b2db-16b744d0ec58' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email address' },
                code: { type: 'string', example: 'invalid_string' },
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: {
            type: 'string',
            enum: ['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN'],
          },
          accountStatus: {
            type: 'string',
            enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
          },
          emailVerified: { type: 'boolean' },
          phoneVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System & Database Health Check',
        description: 'Returns operational status, uptime, and database latency',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
          '503': {
            description: 'System or database is unhealthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register New Healthcare Account',
        description: 'Registers a user with role and automatically provisions corresponding profile record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password', 'confirmPassword', 'role'],
                properties: {
                  name: { type: 'string', example: 'Dr. Priya Sharma' },
                  email: { type: 'string', format: 'email', example: 'priya.sharma@aims.edu' },
                  phone: { type: 'string', example: '9876543210' },
                  password: { type: 'string', format: 'password', example: 'Pass@1234Secure' },
                  confirmPassword: { type: 'string', format: 'password', example: 'Pass@1234Secure' },
                  role: {
                    type: 'string',
                    enum: ['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
          '409': {
            description: 'Email or phone already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
          '422': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate User',
        description: 'Authenticates via email or phone + password; sets HTTP-only session cookies and returns user data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials or inactive account',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate Refresh Token',
        description: 'Issues a new short-lived access token and rotates the refresh token with reuse detection',
        responses: {
          '200': {
            description: 'Tokens successfully refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
          '401': {
            description: 'Invalid or reused refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout Current Session',
        description: 'Revokes the active refresh token and clears session cookies',
        responses: {
          '200': {
            description: 'Successfully logged out',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        summary: 'Logout From All Devices',
        description: 'Revokes all active refresh tokens for the authenticated user',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          '200': {
            description: 'All sessions successfully revoked',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
          '401': {
            description: 'Authentication required',
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Authenticated User Profile',
        description: 'Returns the current user profile from token context',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Profile retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardSuccess' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request Password Reset',
        description: 'Generates a time-limited password reset token and dispatches notification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Reset request received (zero account enumeration)',
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset Password',
        description: 'Resets password using verification token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password', 'confirmPassword'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string' },
                  confirmPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successful',
          },
          '400': {
            description: 'Invalid or expired token',
          },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        summary: 'Verify Email Address',
        description: 'Marks email as verified using token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email verified successfully',
          },
        },
      },
    },
    '/auth/resend-verification': {
      post: {
        summary: 'Resend Email Verification',
        description: 'Generates and dispatches new email verification token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Verification email sent',
          },
        },
      },
    },
  },
};

