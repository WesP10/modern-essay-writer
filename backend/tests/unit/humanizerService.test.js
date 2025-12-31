import { HumanizerService } from '../../services/humanizerService.js';
import { logger } from '../../utils/logger.js';
import { jest, describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';

describe('HumanizerService', () => {
  let mockClient;
  let humanizerService;

  beforeAll(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => { });
    jest.spyOn(logger, 'error').mockImplementation(() => { });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockClient = {
      generate: jest.fn(),
      defaultModel: 'test-model'
    };
    humanizerService = new HumanizerService(mockClient);
  });

  test('should humanize text successfully', async () => {
    mockClient.generate.mockResolvedValue('Humanized text content');

    const result = await humanizerService.humanize({
      text: 'Robot text',
      tone: 'casual'
    });

    expect(result.success).toBe(true);
    expect(result.humanizedText).toBe('Humanized text content');
    expect(result.originalText).toBe('Robot text');
    expect(mockClient.generate).toHaveBeenCalled();
  });

  test('should calculate improvement metrics', () => {
    const metrics = humanizerService.calculateImprovementMetrics('Robot text', 'Humanized text content');
    expect(metrics.naturalness).toBeDefined();
    expect(metrics.diversityImprovement).toBeDefined();
  });
});
