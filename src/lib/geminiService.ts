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
  private chatHistory: ChatMessage[] = [];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    this.loadHistory();
  }

  private loadHistory() {
    try {
      const savedHistory = localStorage.getItem('geminiChatHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as ChatMessage[];
        // Son 1 haftalık mesajları filtrele
        const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        this.chatHistory = parsedHistory.filter(msg => msg.timestamp > oneWeekAgo);
        this.saveHistory(); // Filtrelenmiş geçmişi kaydet
      }
    } catch (error) {
      console.error('Geçmiş yüklenirken hata:', error);
      this.chatHistory = [];
    }
  }

  private saveHistory() {
    try {
      localStorage.setItem('geminiChatHistory', JSON.stringify(this.chatHistory));
    } catch (error) {
      console.error('Geçmiş kaydedilirken hata:', error);
    }
  }

  private formatChatHistory(): string {
    // Son 1 haftalık mesajları filtrele
    const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const recentMessages = this.chatHistory.filter(msg => msg.timestamp > oneWeekAgo);
    
    return recentMessages
      .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`)
      .join('\n');
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      // Kullanıcı mesajını geçmişe ekle
      this.chatHistory.push({
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      });

      // Tüm sohbet geçmişini içeren prompt oluştur
      const fullPrompt = `Önceki konuşma geçmişi (son 1 hafta):\n${this.formatChatHistory()}\n\nYeni kullanıcı mesajı: ${prompt}\n\nLütfen yukarıdaki konuşma geçmişini dikkate alarak yanıt ver.`;

      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: fullPrompt,
      });

      const responseText = response.text || '';
      
      // Model yanıtını geçmişe ekle
      this.chatHistory.push({
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      });

      // Geçmişi kaydet
      this.saveHistory();

      return responseText;
    } catch (error) {
      console.error('Gemini API Hatası:', error);
      throw error;
    }
  }

  async generateStreamingResponse(prompt: string, onChunk: (text: string) => void): Promise<void> {
    try {
      // Kullanıcı mesajını geçmişe ekle
      this.chatHistory.push({
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      });

      // Tüm sohbet geçmişini içeren prompt oluştur
      const fullPrompt = `Önceki konuşma geçmişi (son 1 hafta):\n${this.formatChatHistory()}\n\nYeni kullanıcı mesajı: ${prompt}\n\nLütfen yukarıdaki konuşma geçmişini dikkate alarak yanıt ver.`;

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
      this.chatHistory.push({
        role: 'model',
        content: fullResponse,
        timestamp: Date.now()
      });

      // Geçmişi kaydet
      this.saveHistory();
    } catch (error) {
      console.error('Gemini API Stream Hatası:', error);
      throw error;
    }
  }

  // Sohbet geçmişini temizle
  clearHistory(): void {
    this.chatHistory = [];
    this.saveHistory();
  }

  // Sohbet geçmişini al
  getHistory(): ChatMessage[] {
    // Son 1 haftalık mesajları filtrele
    const oneWeekAgo = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return this.chatHistory.filter(msg => msg.timestamp > oneWeekAgo);
  }
}

export const geminiService = new GeminiService(); 