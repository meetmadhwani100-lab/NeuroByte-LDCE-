/**
 * API Key Rotator for Gemini API
 * 
 * Automatically scans the .env file for all keys matching a specific prefix
 * and rotates them sequentially per API call to bypass rate limits.
 */

class APIKeyRotator {
  private keys: string[];
  private keyIndex: number = 0;

  constructor(prefix: string = "GEMINI_API_KEY_") {
    // Vacuum up all keys dynamically
    this.keys = [];
    
    // Collect all numbered API keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
    let index = 1;
    while (true) {
      const key = process.env[`${prefix}${index}`];
      if (!key || !key.trim()) break;
      this.keys.push(key.trim());
      index++;
    }

    // Fallback to single key if numbered ones aren't found
    if (this.keys.length === 0) {
      const singleKey = process.env.GEMINI_API_KEY;
      if (singleKey) {
        this.keys = [singleKey.trim()];
      } else {
        throw new Error(
          `No API keys found in .env starting with ${prefix} or GEMINI_API_KEY`
        );
      }
    }

    console.log(
      `✅ [APIKeyRotator] Loaded ${this.keys.length} API key(s) for rotation.`
    );
  }

  /**
   * Fetch the next API key in the rotation sequence
   */
  getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error("No API keys available");
    }
    const key = this.keys[this.keyIndex];
    this.keyIndex = (this.keyIndex + 1) % this.keys.length;
    return key;
  }

  /**
   * Get all available keys (for debugging)
   */
  getAllKeys(): string[] {
    return this.keys;
  }

  /**
   * Get the number of available keys
   */
  getKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Get current rotation index (for debugging)
   */
  getCurrentIndex(): number {
    return this.keyIndex;
  }
}

// Global instance to be imported across the app
let geminiRotator: APIKeyRotator | null = null;

export function getAPIKeyRotator(): APIKeyRotator {
  if (!geminiRotator) {
    geminiRotator = new APIKeyRotator();
  }
  return geminiRotator;
}

export { APIKeyRotator };
