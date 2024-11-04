import express from 'express';
import uploadMiddleware from '../middleware/upload.js';
import ResumeService from '../services/resumeService.js'; 
import asyncHandler from '../utils/asyncHandler.js';
import { validateResumeUpdate } from '../middleware/validate.js';

const router = express.Router();

router.post('/upload-resume', uploadMiddleware, asyncHandler(async (req, res) => {
  res.json({
    message: 'File uploaded successfully',
    path: req.file.path
  });
}));

router.post('/update-resume', uploadMiddleware, validateResumeUpdate, asyncHandler(async (req, res) => {
  const { structuredJobDetails } = req.body;
  if (!structuredJobDetails) {
    throw new Error('Structured job details are required');
  }

  const updatedResumePath = await ResumeService.processResume(  // Updated reference
    req.file.path,
    structuredJobDetails
  );

  res.json({
    success: true,
    message: 'Resume updated successfully',
    path: updatedResumePath
  });
}));

export default router;