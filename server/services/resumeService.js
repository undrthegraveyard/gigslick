import JSZip from 'jszip';
import fs from 'fs/promises';
import { DOMParser, XMLSerializer } from 'xmldom';
import path from 'path';
import { 
  ERROR_MESSAGES, 
  UPLOAD_CONFIG,
  SUCCESS_MESSAGES 
} from '../config/constants.js';
import logger from './logService.js';

class ResumeService {
  /**
   * Main method to process resume
   * @param {string} filePath - File path
   * @param {string} structuredJobDetails - Job details
   * @returns {Promise<string>} Updated file path
   */
  async processResume(filePath, structuredJobDetails) {
    try {
      logger.info('Starting resume processing', { filePath });
      
      // Read and load the document
      const buffer = await fs.readFile(filePath);
      const zip = new JSZip();
      await zip.loadAsync(buffer);

      // Load all document parts
      const parts = await this.loadDocumentParts(zip);
      
      // Process the document
      const processedDoc = await this.processDocument(
        parts.documentXml,
        parts.stylesXml,
        parts.numbersXml,
        parts.themeXml,
        structuredJobDetails
      );

      // Update document parts
      await this.updateDocumentParts(
        zip, 
        processedDoc, 
        parts.docRels,
        parts.fontTable,
        parts.settings
      );

      // Generate and save the updated document
      const updatedFilePath = await this.generateUpdatedDocument(zip, filePath);

      logger.info('Resume processing completed successfully');
      return updatedFilePath;
    } catch (error) {
      logger.error('Error processing resume:', error);
      throw new Error(`Resume processing failed: ${error.message}`);
    }
  }

  /**
   * Loads and parses all necessary document parts from a DOCX file
   */
  async loadDocumentParts(zip) {
    try {
      logger.info('Loading document parts');
      
      // Load required document.xml first
      const documentXml = await zip.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error(ERROR_MESSAGES.INVALID_RESUME_FORMAT);
      }

      // Load optional parts with null fallback
      const [stylesXml, numbersXml, themeXml, docRels, fontTable, settings] = await Promise.all([
        zip.file('word/styles.xml')?.async('string').catch(() => null),
        zip.file('word/numbering.xml')?.async('string').catch(() => null),
        zip.file('word/theme/theme1.xml')?.async('string').catch(() => null),
        zip.file('word/_rels/document.xml.rels')?.async('string').catch(() => null),
        zip.file('word/fontTable.xml')?.async('string').catch(() => null),
        zip.file('word/settings.xml')?.async('string').catch(() => null)
      ]);

      return {
        documentXml,
        stylesXml,
        numbersXml,
        themeXml,
        docRels,
        fontTable,
        settings
      };
    } catch (error) {
      logger.error('Error loading document parts:', error);
      throw new Error(`Failed to load document components: ${error.message}`);
    }
  }

  /**
   * Process document and add new job entry
   */
  async processDocument(documentXml, stylesXml, numbersXml, themeXml, structuredJobDetails) {
    logger.info('Processing document content');
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    // Parse optional components
    const styles = stylesXml ? parser.parseFromString(stylesXml, 'text/xml') : null;
    const numbering = numbersXml ? parser.parseFromString(numbersXml, 'text/xml') : null;
    const theme = themeXml ? parser.parseFromString(themeXml, 'text/xml') : null;

    // Parse job details
    const jobLines = structuredJobDetails.split('\n');
    if (jobLines.length < 2) {
      throw new Error(ERROR_MESSAGES.INVALID_JOB_DETAILS);
    }

    const title = jobLines[0];
    const period = jobLines[1];
    const bullets = jobLines.slice(2)
      .filter(point => point.trim().startsWith('-'))
      .map(point => point.trim().substring(2));

    // Find and validate experience section
    const experienceSection = this.findExperienceSection(doc);
    if (!experienceSection) {
      throw new Error(ERROR_MESSAGES.EXPERIENCE_SECTION_NOT_FOUND);
    }

    // Get and validate template
    const template = this.getJobEntryTemplate(experienceSection);
    if (!template) {
      throw new Error(ERROR_MESSAGES.TEMPLATE_NOT_FOUND);
    }

    // Create new job entry
    const newJobEntry = this.createJobEntry(doc, template, {
      title,
      period,
      bullets
    });

    // Find insertion point and insert new entry
    const insertionPoint = this.findInsertionPoint(experienceSection);
    if (!insertionPoint) {
      throw new Error(ERROR_MESSAGES.TEMPLATE_NOT_FOUND);
    }

    insertionPoint.parentNode.insertBefore(newJobEntry, insertionPoint);

    return {
      document: doc,
      styles,
      numbering,
      theme
    };
  }

  /**
   * Find the experience section in the document
   */
  findExperienceSection(doc) {
    const paragraphs = doc.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphs.length; i++) {
      const text = this.getParagraphText(paragraphs[i]).toLowerCase();
      if (text.includes('experience') || text.includes('employment history')) {
        return paragraphs[i].parentNode;
      }
    }
    return null;
  }
  /**
   * Get template for job entry
   */
  getJobEntryTemplate(section) {
    const paragraphs = section.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphs.length; i++) {
      const text = this.getParagraphText(paragraphs[i]);
      if (text.includes('(') && text.includes(')') && /\d{4}/.test(text)) {
        return {
          title: paragraphs[i],
          period: paragraphs[i + 1] || paragraphs[i],
          bullet: this.findBulletTemplate(paragraphs, i + 2)
        };
      }
    }
    return null;
  }

  /**
   * Find bullet template from existing entries
   */
  findBulletTemplate(paragraphs, startIndex) {
    for (let i = startIndex; i < Math.min(startIndex + 5, paragraphs.length); i++) {
      const text = this.getParagraphText(paragraphs[i]);
      if (text.trim().startsWith('•') || text.trim().startsWith('-')) {
        return paragraphs[i];
      }
    }
    return paragraphs[startIndex];
  }

  /**
   * Create a new job entry based on template
   */
  createJobEntry(doc, template, jobData) {
    logger.info('Creating new job entry');
    const fragment = doc.createDocumentFragment();

    // Title paragraph
    const titlePara = this.cloneNodeWithStyles(template.title);
    this.setTextContentPreservingStyle(titlePara, jobData.title);
    fragment.appendChild(titlePara);

    // Period paragraph
    const periodPara = this.cloneNodeWithStyles(template.period);
    this.setTextContentPreservingStyle(periodPara, jobData.period);
    fragment.appendChild(periodPara);

    // Bullet points
    jobData.bullets.forEach(bullet => {
      const bulletPara = this.cloneNodeWithStyles(template.bullet);
      this.setTextContentPreservingStyle(bulletPara, `• ${bullet}`);
      fragment.appendChild(bulletPara);
    });

    // Add spacing paragraph
    const spacingPara = this.cloneNodeWithStyles(template.title);
    this.setTextContentPreservingStyle(spacingPara, '');
    fragment.appendChild(spacingPara);

    return fragment;
  }

  /**
   * Clone node while preserving styles
   */
  cloneNodeWithStyles(node) {
    const clone = node.cloneNode(true);
    
    const pPr = node.getElementsByTagName('w:pPr')[0];
    if (pPr) {
      const clonePPr = clone.getElementsByTagName('w:pPr')[0] || 
                       clone.ownerDocument.createElement('w:pPr');
      
      Array.from(pPr.childNodes).forEach(child => {
        clonePPr.appendChild(child.cloneNode(true));
      });
      
      if (clone.firstChild) {
        clone.insertBefore(clonePPr, clone.firstChild);
      } else {
        clone.appendChild(clonePPr);
      }
    }
    
    return clone;
  }

  /**
   * Set text content while preserving style
   */
  setTextContentPreservingStyle(paragraph, text) {
    const runs = paragraph.getElementsByTagName('w:r');
    if (runs.length === 0) {
      return this.createNewFormattedRun(paragraph, text);
    }

    const firstRun = runs[0];
    const rPr = firstRun.getElementsByTagName('w:rPr')[0];

    const pPr = paragraph.getElementsByTagName('w:pPr')[0];
    while (paragraph.firstChild) {
      paragraph.removeChild(paragraph.firstChild);
    }
    if (pPr) {
      paragraph.appendChild(pPr.cloneNode(true));
    }

    const newRun = this.createRunWithFormatting(paragraph.ownerDocument, text, rPr);
    paragraph.appendChild(newRun);
  }

  /**
   * Create run with formatting
   */
  createRunWithFormatting(doc, text, rPr) {
    const run = doc.createElement('w:r');
    
    if (rPr) {
      run.appendChild(rPr.cloneNode(true));
    }

    const textElement = doc.createElement('w:t');
    if (text.startsWith(' ') || text.endsWith(' ')) {
      textElement.setAttribute('xml:space', 'preserve');
    }
    textElement.textContent = text;
    run.appendChild(textElement);

    return run;
  }

  /**
   * Create new formatted run
   */
  createNewFormattedRun(paragraph, text) {
    const doc = paragraph.ownerDocument;
    let pPr = paragraph.getElementsByTagName('w:pPr')[0];
    if (!pPr) {
      pPr = doc.createElement('w:pPr');
      paragraph.insertBefore(pPr, paragraph.firstChild);
    }

    const run = this.createRunWithFormatting(doc, text, null);
    paragraph.appendChild(run);
  }

  /**
   * Find insertion point for new entry
   */
  findInsertionPoint(section) {
    const paragraphs = section.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphs.length; i++) {
      const text = this.getParagraphText(paragraphs[i]).toLowerCase();
      if (text.includes('experience') || text.includes('employment history')) {
        return paragraphs[i + 1] || paragraphs[i];
      }
    }
    return paragraphs[0];
  }

  /**
   * Get text content from paragraph
   */
  getParagraphText(paragraph) {
    const texts = paragraph.getElementsByTagName('w:t');
    return Array.from(texts).map(t => t.textContent).join('');
  }

  /**
   * Update document parts in zip
   */
  async updateDocumentParts(zip, processedDoc, docRels, fontTable, settings) {
    logger.info('Updating document parts');
    const serializer = new XMLSerializer();
    
    zip.file('word/document.xml', serializer.serializeToString(processedDoc.document));
    
    if (processedDoc.styles) {
      zip.file('word/styles.xml', serializer.serializeToString(processedDoc.styles));
    }
    if (processedDoc.numbering) {
      zip.file('word/numbering.xml', serializer.serializeToString(processedDoc.numbering));
    }
    if (processedDoc.theme) {
      zip.file('word/theme/theme1.xml', serializer.serializeToString(processedDoc.theme));
    }
    if (docRels) {
      zip.file('word/_rels/document.xml.rels', docRels);
    }
    if (fontTable) {
      zip.file('word/fontTable.xml', fontTable);
    }
    if (settings) {
      zip.file('word/settings.xml', settings);
    }
  }

  /**
   * Generate updated document
   */
  async generateUpdatedDocument(zip, originalFilePath) {
    logger.info('Generating updated document');
    const updatedBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const parsedPath = path.parse(originalFilePath);
    const updatedFilePath = path.join(
      parsedPath.dir,
      `${parsedPath.name}_updated${parsedPath.ext}`
    );
    await fs.writeFile(updatedFilePath, updatedBuffer);
    return updatedFilePath;
  }
}

export default new ResumeService();