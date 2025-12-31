import { DetectorService } from './services/detectorService.js';

async function run() {
  try {
    console.log('Testing DetectorService Class...');
    const mockClient = {
      generate: async (params) => {
        console.log('Mock generate called with:', params);
        return JSON.stringify({
          confidence: 90,
          reasoning: 'Test',
          flaggedPatterns: ['test pattern']
        });
      },
      defaultModel: 'test'
    };
    const service = new DetectorService(mockClient);
    console.log('Service instantiated.');

    const result = await service.detect({ text: 'test' });
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
