import { HumanizerService } from './services/humanizerService.js';

try {
  console.log('Testing HumanizerService...');
  const mockClient = { generate: async () => 'humanized' };
  const service = new HumanizerService(mockClient);
  console.log('Service instantiated.');

  const metrics = service.calculateImprovementMetrics('orig', 'humanized');
  console.log('Metrics:', metrics);
} catch (e) {
  console.error('Error:', e);
}
