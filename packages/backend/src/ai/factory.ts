import { IAiProvider } from './provider.interface.js';
import { MockAiProvider } from './providers/mock.provider.js';
import { GeminiAiProvider } from './providers/gemini.provider.js';

export class AiProviderFactory {
  static getProvider(): IAiProvider {
    const providerType = process.env.AI_PROVIDER || 'mock';

    if (providerType === 'gemini') {
      return new GeminiAiProvider();
    }

    // Default to Mock for zero-dependency local execution
    return new MockAiProvider();
  }
}
