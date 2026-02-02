import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

export default router;