import axios from 'axios';
import { logger } from '../utils/logger.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b';
const AUTOCOMPLETE_MODEL = process.env.OLLAMA_AUTOCOMPLETE_MODEL || 'gemma3:1b';

class OllamaClient {
  constructor() {
    this.baseUrl = OLLAMA_BASE_URL;
    this.defaultModel = DEFAULT_MODEL;
    this.autocompleteModel = AUTOCOMPLETE_MODEL;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logger.info(`Ollama client initialized with base URL: ${this.baseUrl}, default model: ${this.defaultModel}`);
  }

  /**
   * Generate text using Ollama
   */
  async generate({ model, prompt, temperature = 0.7, max_tokens = 500, stop = [] }) {
    const modelToUse = model || this.defaultModel;
    
    try {
      const response = await this.client.post('/api/generate', {
        model: modelToUse,
        prompt,
        options: {
          temperature,
          num_predict: max_tokens,
          stop
        },
        stream: false
      });

      return response.data.response;
    } catch (error) {
      logger.error(`Ollama generate error for model ${modelToUse}:`, error.message);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  /**
   * Stream text generation (for long-form content)
   */
  async *generateStream({ model, prompt, temperature = 0.7, max_tokens = 500 }) {
    try {
      const response = await this.client.post('/api/generate', {
        model,
        prompt,
        options: {
          temperature,
          num_predict: max_tokens
        },
        stream: true
      }, {
        responseType: 'stream'
      });

      for await (const chunk of response.data) {
        const text = chunk.toString();
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      logger.error(`Ollama stream error for model ${model}:`, error.message);
      throw new Error(`Ollama streaming failed: ${error.message}`);
    }
  }

  /**
   * Check if Ollama is running and model is available
   */
  async checkModel(model) {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      const modelExists = models.some(m => m.name === model);
      
      if (!modelExists) {
        logger.warn(`Model ${model} not found in Ollama. Available models:`, 
          models.map(m => m.name).join(', '));
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to check Ollama models:', error.message);
      return false;
    }
  }

  /**
   * Pull a model if not available
   */
  async pullModel(model) {
    try {
      logger.info(`Pulling model ${model}...`);
      await this.client.post('/api/pull', { name: model });
      logger.info(`✅ Model ${model} pulled successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to pull model ${model}:`, error.message);
      return false;
    }
  }

  /**
   * Test Ollama connection
   */
  async testConnection() {
    try {
      const response = await this.client.get('/api/tags');
      logger.info('✅ Ollama connection successful');
      logger.info(`Available models: ${response.data.models?.length || 0}`);
      return true;
    } catch (error) {
      logger.error('❌ Ollama connection failed:', error.message);
      logger.error(`Make sure Ollama is running at ${this.baseUrl}`);
      return false;
    }
  }
}

export const ollamaClient = new OllamaClient();
export default ollamaClient;
