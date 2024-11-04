// middleware/validate.js
import { check, validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';
import { VALIDATION } from '../config/constants.js';

export const validateJobDescription = [
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ min: VALIDATION.MIN_JOB_DESCRIPTION_LENGTH })
    .withMessage(`Job description must be at least ${VALIDATION.MIN_JOB_DESCRIPTION_LENGTH} characters long`)
    .escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }
    next();
  }
];

export const validateResumeUpdate = [
  check('structuredJobDetails')
    .trim()
    .notEmpty()
    .withMessage('Structured job details are required')
    .custom((value) => {
      const lines = value.split('\n');
      if (lines.length < VALIDATION.MIN_JOB_DETAILS_LINES) {
        throw new Error('Invalid job details format');
      }
      if (lines.filter(line => line.trim().startsWith('•')).length > VALIDATION.MAX_BULLET_POINTS) {
        throw new Error(`Maximum ${VALIDATION.MAX_BULLET_POINTS} bullet points allowed`);
      }
      return true;
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }
    next();
  }
];