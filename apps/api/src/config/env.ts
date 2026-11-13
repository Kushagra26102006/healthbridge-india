import dotenv from 'dotenv';
import path from 'path';
import { backendEnvSchema, type BackendEnv } from '@healthbridge/validation';

// Load .env from apps/api or project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const parsed = backendEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\nEnvironment validation failed. Please check your .env configuration:\n');
  parsed.error.errors.forEach((err) => {
    console.error(` - [${err.path.join('.')}] ${err.message}`);
  });
  console.error('\nRefer to .env.example for required variables.\n');
  process.exit(1);
}

export const env: BackendEnv = parsed.data;
