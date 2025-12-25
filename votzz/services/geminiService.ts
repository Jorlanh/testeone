// geminiService.ts
import * as GoogleGenerativeAI from "@google/generative-ai";

const API_KEY = "AIzaSyDha13zsWaX9pPN2yE46hByExEQuzQRbJQS";

// Função auxiliar para inicializar o modelo de forma segura
const getModel = () => {
  // @ts-ignore - Contorna o erro de exportação no ambiente de desenvolvimento
  const client = new (GoogleGenerativeAI.GoogleGenAI || (GoogleGenerativeAI as any).default)(API_KEY);
  return client.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const generateAssemblyDescription = async (topic: string, details: string): Promise<string> => {
  try {
    const model = getModel();
    const prompt = `Atue como um gestor condominial profissional. Crie uma descrição formal e detalhada para uma pauta de assembleia com o tema: "${topic}". Detalhes adicionais: "${details}".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Não foi possível gerar a descrição com IA no momento.";
  }
};

export const generateNotificationDraft = async (assemblyTitle: string, endDate: string): Promise<string> => {
  try {
    const model = getModel();
    const prompt = `Escreva um rascunho de notificação para a assembleia "${assemblyTitle}". Fim em: ${new Date(endDate).toLocaleString()}.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "Erro ao gerar notificação.";
  }
};

export const analyzeSentiment = async (messages: string[]): Promise<string> => {
  if (messages.length === 0) return "Sem dados para análise.";
  try {
    const model = getModel();
    const textBlock = messages.join("\n");
    const prompt = `Analise as seguintes mensagens e forneça o sentimento geral:\n\n${textBlock}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "Não foi possível analisar o chat.";
  }
};