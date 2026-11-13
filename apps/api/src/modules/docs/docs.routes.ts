import { Router, Request, Response } from 'express';
import { openApiSpec } from './openapi.spec';
import { sendSuccess } from '../../utils/api-response';

export const docsRoutes = Router();

/**
 * Serves the OpenAPI 3.1 JSON specification
 */
docsRoutes.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openApiSpec);
});

/**
 * Serves API documentation summary and available endpoints
 */
docsRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      title: openApiSpec.info.title,
      version: openApiSpec.info.version,
      description: openApiSpec.info.description,
      openApiSpecificationUrl: '/api/v1/docs/openapi.json',
      activeEndpoints: Object.keys(openApiSpec.paths).map((path) => ({
        path: `/api/v1${path}`,
        methods: Object.keys(openApiSpec.paths[path as keyof typeof openApiSpec.paths]),
      })),
      standardsCompliance: ['ABDM M1/M2/M3', 'DISHA Data Privacy', 'FHIR R4', 'OWASP Top 10 API Security'],
    },
    'HealthBridge India API Documentation'
  );
});

