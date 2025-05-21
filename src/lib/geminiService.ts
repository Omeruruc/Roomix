import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = 'AIzaSyAFPJbk6vUkfJkkVlG83AqgqTweZ0k9la0';
const GEMINI_MODEL = 'gemini-2.0-flash-001';
const HISTORY_EXPIRY_DAYS = 7; // 1 hafta

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number; // Unix timestamp
}

class GeminiService {
  private ai: GoogleGenAI;
  private chatHistories: Map<string, ChatMessage[]> = new Map(); // userId -> messages

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    this.loadAllHistories();
  }

  private getStorageKey(userId: string): string {
    return `geminiChatHistory_${userId}`;
  }

  private loadAllHistories() {
    try {
      // Tüm localStorage anahtarlarını kontrol et
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('geminiChatHistory_')) {
          const userId = key.replace('geminiChatHistory_', '');
          const savedHistory = localStorage.getItem(key);
          if (savedHistory) {
            const parsedHistory = JSON.parse(savedHistory) as ChatMessage[];
            // Son 1 haftalık mesajları filtrele
            const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
            const filteredHistory = parsedHistory.filter(msg => msg.timestamp > oneWeekAgo);
            this.chatHistories.set(userId, filteredHistory);
            // Filtrelenmiş geçmişi kaydet
            this.saveHistory(userId);
          }
        }
      }
    } catch (error) {
      console.error('Geçmişler yüklenirken hata:', error);
    }
  }

  private loadHistory(userId: string) {
    try {
      const savedHistory = localStorage.getItem(this.getStorageKey(userId));
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as ChatMessage[];
        // Son 1 haftalık mesajları filtrele
        const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const filteredHistory = parsedHistory.filter(msg => msg.timestamp > oneWeekAgo);
        this.chatHistories.set(userId, filteredHistory);
        // Filtrelenmiş geçmişi kaydet
        this.saveHistory(userId);
      } else {
        this.chatHistories.set(userId, []);
      }
    } catch (error) {
      console.error('Geçmiş yüklenirken hata:', error);
      this.chatHistories.set(userId, []);
    }
  }

  private saveHistory(userId: string) {
    try {
      const history = this.chatHistories.get(userId) || [];
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(history));
    } catch (error) {
      console.error('Geçmiş kaydedilirken hata:', error);
    }
  }

  private formatChatHistory(userId: string): string {
    const history = this.chatHistories.get(userId) || [];
    // Son 1 haftalık mesajları filtrele
    const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const recentMessages = history.filter(msg => msg.timestamp > oneWeekAgo);
    
    return recentMessages
      .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`)
      .join('\n');
  }

  async generateResponse(userId: string, prompt: string): Promise<string> {
    try {
      // Kullanıcının geçmişini yükle
      this.loadHistory(userId);
      const history = this.chatHistories.get(userId) || [];

      // Kullanıcı mesajını geçmişe ekle
      history.push({
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      });

      // Tüm sohbet geçmişini içeren prompt oluştur
      const fullPrompt = `Önceki konuşma geçmişi (son 1 hafta):\n${this.formatChatHistory(userId)}\n\nYeni kullanıcı mesajı: ${prompt}\n\nLütfen yukarıdaki konuşma geçmişini dikkate alarak yanıt ver.`;

      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: fullPrompt,
      });

      const responseText = response.text || '';
      
      // Model yanıtını geçmişe ekle
      history.push({
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      });

      // Geçmişi kaydet
      this.saveHistory(userId);

      return responseText;
    } catch (error) {
      console.error('Gemini API Hatası:', error);
      throw error;
    }
  }

  async generateStreamingResponse(userId: string, prompt: string, onChunk: (text: string) => void): Promise<void> {
    try {
      // Kullanıcının geçmişini yükle
      this.loadHistory(userId);
      const history = this.chatHistories.get(userId) || [];

      // Kullanıcı mesajını geçmişe ekle
      history.push({
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      });

      // Tüm sohbet geçmişini içeren prompt oluştur
      const fullPrompt = `Önceki konuşma geçmişi (son 1 hafta):\n${this.formatChatHistory(userId)}\n\nYeni kullanıcı mesajı: ${prompt}\n\nLütfen yukarıdaki konuşma geçmişini dikkate alarak yanıt ver.`;

      const response = await this.ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: fullPrompt,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        fullResponse += chunkText;
        onChunk(chunkText);
      }

      // Tam yanıtı geçmişe ekle
      history.push({
        role: 'model',
        content: fullResponse,
        timestamp: Date.now()
      });

      // Geçmişi kaydet
      this.saveHistory(userId);
    } catch (error) {
      console.error('Gemini API Stream Hatası:', error);
      throw error;
    }
  }

  // Sohbet geçmişini temizle
  clearHistory(userId: string): void {
    this.chatHistories.set(userId, []);
    this.saveHistory(userId);
  }

  // Sohbet geçmişini al
  getHistory(userId: string): ChatMessage[] {
    this.loadHistory(userId);
    const history = this.chatHistories.get(userId) || [];
    // Son 1 haftalık mesajları filtrele
    const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return history.filter(msg => msg.timestamp > oneWeekAgo);
  }
}

export const geminiService = new GeminiService(); 