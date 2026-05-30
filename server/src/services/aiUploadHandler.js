/**
 * AI Upload Handler
 * Semi-automated file processing with AI assistance
 * Watches incoming uploads folder and processes files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import sharp from 'sharp';
import prisma from '../db/prisma.js';
import { devLogger } from './devLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INCOMING_DIR = path.join(__dirname, '../../uploads/incoming');
const BRANDS_DIR = path.join(__dirname, '../../uploads/brands');
const PRODUCTS_DIR = path.join(__dirname, '../../uploads/products');
const CATEGORIES_DIR = path.join(__dirname, '../../uploads/categories');

// Ensure directories exist
[INCOMING_DIR, BRANDS_DIR, PRODUCTS_DIR, CATEGORIES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class AIUploadHandler {
  constructor() {
    this.watcher = null;
    this.processing = new Set();
  }

  /**
   * Start watching for incoming files
   */
  startWatching() {
    this.watcher = chokidar.watch(INCOMING_DIR, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', (filePath) => {
      this.handleFileUpload(filePath);
    });

    devLogger.info(`AI Upload Handler started. Watching: ${INCOMING_DIR}`);
  }

  /**
   * Stop watching
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      devLogger.info('AI Upload Handler stopped');
    }
  }

  /**
   * Handle incoming file
   */
  async handleFileUpload(filePath) {
    const fileName = path.basename(filePath);
    
    // Prevent double processing
    if (this.processing.has(fileName)) {
      return;
    }
    
    this.processing.add(fileName);
    devLogger.info(`Processing upload: ${fileName}`);

    try {
      // Analyze file
      const analysis = await this.analyzeFile(filePath);
      devLogger.info(`File analysis: ${JSON.stringify(analysis)}`);

      // Determine destination based on AI analysis
      const destination = await this.determineDestination(analysis, filePath);
      
      // Process and move file
      const result = await this.processAndMove(filePath, destination, analysis);
      
      devLogger.info(`✓ Processed: ${fileName} -> ${result.destination}`);
      
      return result;
    } catch (error) {
      devLogger.error(`✗ Failed to process ${fileName}: ${error.message}`);
      throw error;
    } finally {
      this.processing.delete(fileName);
    }
  }

  /**
   * Analyze uploaded file
   */
  async analyzeFile(filePath) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Image analysis using sharp
    let imageInfo = null;
    try {
      const metadata = await sharp(filePath).metadata();
      imageInfo = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
      };
    } catch (error) {
      // Not an image or sharp error
    }

    // AI-based classification (simplified - in production would use actual AI)
    const classification = this.classifyFile(fileName, imageInfo);

    return {
      fileName,
      originalPath: filePath,
      size: stats.size,
      uploadTime: stats.mtime,
      extension: ext,
      imageInfo,
      classification,
    };
  }

  /**
   * Classify file based on name and metadata
   * In production, this would use actual AI/ML
   */
  classifyFile(fileName, imageInfo) {
    const lowerName = fileName.toLowerCase();
    
    // Brand logo detection
    if (lowerName.includes('brand') || lowerName.includes('logo')) {
      return {
        type: 'brand-logo',
        confidence: 0.9,
        suggestedAction: 'resize_and_save_to_brands',
      };
    }
    
    // Product image detection
    if (lowerName.includes('product') || lowerName.includes('item')) {
      return {
        type: 'product-image',
        confidence: 0.8,
        suggestedAction: 'resize_and_save_to_products',
      };
    }
    
    // Category icon detection
    if (lowerName.includes('category') || lowerName.includes('icon')) {
      return {
        type: 'category-icon',
        confidence: 0.8,
        suggestedAction: 'resize_and_save_to_categories',
      };
    }
    
    // Default: treat as generic image
    return {
      type: 'unknown',
      confidence: 0.5,
      suggestedAction: 'manual_review',
    };
  }

  /**
   * Determine destination based on classification
   */
  async determineDestination(analysis, filePath) {
    const { classification } = analysis;
    
    switch (classification.type) {
      case 'brand-logo':
        return {
          dir: BRANDS_DIR,
          resize: { width: 200, height: 200 },
          format: 'png',
        };
      
      case 'product-image':
        return {
          dir: PRODUCTS_DIR,
          resize: { width: 800, height: 600 },
          format: 'jpeg',
          quality: 85,
        };
      
      case 'category-icon':
        return {
          dir: CATEGORIES_DIR,
          resize: { width: 100, height: 100 },
          format: 'png',
        };
      
      default:
        // Keep in incoming for manual review
        return {
          dir: INCOMING_DIR,
          action: 'manual_review',
        };
    }
  }

  /**
   * Process and move file to destination
   */
  async processAndMove(filePath, destination, analysis) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputFileName = `${fileName}-${Date.now()}.${destination.format || 'png'}`;
    const outputPath = path.join(destination.dir, outputFileName);

    // If manual review needed, just move without processing
    if (destination.action === 'manual_review') {
      fs.renameSync(filePath, path.join(destination.dir, `${fileName}_REVIEW_${path.extname(filePath)}`));
      return {
        destination: path.join(destination.dir, `${fileName}_REVIEW`),
        action: 'manual_review',
      };
    }

    // Process image with sharp
    let processor = sharp(filePath);
    
    // Resize if specified
    if (destination.resize) {
      processor = processor.resize(destination.resize.width, destination.resize.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });
    }
    
    // Convert format
    if (destination.format === 'jpeg') {
      processor = processor.jpeg({ quality: destination.quality || 85 });
    } else if (destination.format === 'png') {
      processor = processor.png();
    } else if (destination.format === 'webp') {
      processor = processor.webp({ quality: destination.quality || 80 });
    }
    
    // Save processed image
    await processor.toFile(outputPath);
    
    // Remove original
    fs.unlinkSync(filePath);

    return {
      destination: outputPath,
      action: 'processed',
      analysis,
    };
  }

  /**
   * Manual upload handler (for API)
   */
  async manualUpload(fileData, options = {}) {
    const { fileName, data, type = 'unknown' } = options;
    const filePath = path.join(INCOMING_DIR, fileName);
    
    // Write file
    fs.writeFileSync(filePath, data);
    
    // Process
    return await this.handleFileUpload(filePath);
  }
}

// Export singleton
export const aiUploadHandler = new AIUploadHandler();
export default aiUploadHandler;
