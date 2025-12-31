import { DetectorService } from '../../services/detectorService.js';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
// No mocks needed for modules!

describe('DetectorService', () => {
  let mockClient;
  let detectorService;

  beforeEach(() => {
    try {
      mockClient = {
        generate: jest.fn(),
        defaultModel: 'test-model'
      };
      detectorService = new DetectorService(mockClient);
    } catch (e) {
      fs.writeFileSync('error_log.txt', 'BEFORE EACH ERROR: ' + String(e.stack || e));
      throw e;
    }
  });

  test('should detect AI content successfully', async () => {
    try {
      const mockResponse = JSON.stringify({
        confidence: 95,
        reasoning: 'Repeated patterns',
        flaggedPatterns: ['repetition']
      });
      mockClient.generate.mockResolvedValue(mockResponse);

      console.log('Calling detect...');
      const result = await detectorService.detect({ text: 'Test text' });
      console.log('Detect result:', result);

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(95);
      expect(result.flaggedPatterns).toContain('repetition');
      expect(mockClient.generate).toHaveBeenCalled();
    } catch (e) {
      console.log('CAUGHT FROM TEST:', e);
      fs.writeFileSync('error_log.txt', String(e.stack || e));
      throw e;
    }
  });

  test('should calculate basic metrics when LLM fails', async () => {
    const metrics = detectorService.calculateBasicMetrics('However, therefore, moreover. Simple words.');
    expect(metrics.confidence).toBeDefined();
  });
});
