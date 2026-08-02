import { startServer } from '@/app';
import { logger } from '@/shared/utils/logger';

startServer().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start GearUp API');
  process.exit(1);
});
