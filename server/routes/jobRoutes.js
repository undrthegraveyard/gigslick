// 6. routes/jobRoutes.js
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import JobService from '../services/jobService.js';
import { AppError } from '../utils/errors.js';
import { validateJobDescription } from '../middleware/validate.js';

const router = express.Router();

router.post('/structure-job-description', validateJobDescription, asyncHandler(async (req, res) => {
  if (!req.body?.description) {
    throw new AppError('Job description is required', 400);
  }

  const structuredText = await JobService.structureJobDescription(req.body.description);
  res.json({ structuredText });
}));

export default router;