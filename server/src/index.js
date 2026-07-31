import 'dotenv/config';
import { createServer } from './server.js';
import { connectDatabase } from './config/database.js';
import { initializeSupabaseBucket } from './services/supabase.service.js';

const port = process.env.PORT || 5000;

async function bootstrap() {
  await connectDatabase();
  await initializeSupabaseBucket();
  const app = createServer();

  app.listen(port, () => {
    console.log(`LegalEase API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
