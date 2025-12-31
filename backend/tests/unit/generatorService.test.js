import { GeneratorService } from '../../services/generatorService.js';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

describe('GeneratorService', () => {
  let mockClient;
  let generatorService;

  beforeEach(() => {
    mockClient = {
      generate: jest.fn(),
      defaultModel: 'test-model'
    };
    generatorService = new GeneratorService(mockClient);
  });

  test('getLengthTokens should return correct values', () => {
    expect(generatorService.getLengthTokens('short')).toBe(200);
    expect(generatorService.getLengthTokens('long')).toBe(700);
    expect(generatorService.getLengthTokens('invalid')).toBe(400); // default
  });

  test('generate should call Ollama with prompt', async () => {
    mockClient.generate.mockResolvedValue('Generated Essay');

    const result = await generatorService.generate({
      prompt: 'Topic',
      length: 'short'
    });

    expect(result.success).toBe(true);
    expect(result.content).toBe('Generated Essay');
    expect(mockClient.generate).toHaveBeenCalledWith(expect.objectContaining({
      max_tokens: 200
    }));
  });
});
