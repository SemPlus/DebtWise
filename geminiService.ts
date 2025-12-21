
import { GoogleGenAI, Type } from "@google/genai";
import { Debt, DebtType, Group } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDebtInsights = async (debts: Debt[]) => {
  if (debts.length === 0) return "Add some debts to get AI-powered insights on your financial balance!";

  const debtSummary = debts.map(d => ({
    type: d.type === DebtType.I_OWE ? "You owe" : "Owed to you",
    name: d.name,
    amount: d.amount,
    description: d.description,
    date: d.date
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these debts and provide a short, helpful financial insight (max 3 sentences). 
      Look for patterns, like if the same person appears multiple times, or if the total balance is heavily skewed.
      Be encouraging and concise.
      
      Debts Data: ${JSON.stringify(debtSummary)}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "Unable to generate insights at this moment.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "The AI is currently analyzing your finances. Please try again in a moment.";
  }
};

export const simplifyGroupDebts = async (groupName: string, debts: Debt[]) => {
  const summary = debts.map(d => ({
    from: d.type === DebtType.I_OWE ? "Me" : d.name,
    to: d.type === DebtType.I_OWE ? d.name : "Me",
    amount: d.amount
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a financial simplification assistant for a group called "${groupName}".
        The goal is to minimize the total number of transactions needed to settle all debts.
        
        Current debts:
        ${JSON.stringify(summary)}
        
        Instructions:
        1. Calculate the net balance for every individual (including "Me").
        2. Propose the most efficient way to settle everyone to zero.
        3. Format your response as a clear, bulleted list of transactions.
        4. Be very concise.
      `,
      config: {
        temperature: 0.1,
      }
    });

    return response.text || "No simplification needed or available.";
  } catch (error) {
    console.error("Simplification Error:", error);
    return "Failed to calculate simplification. Please check your connection.";
  }
};

export const generateNudgeMessage = async (contactName: string, amount: number, isOwedToMe: boolean, reliability: number) => {
  const tone = reliability > 80 ? "very friendly and casual" : reliability > 50 ? "polite but clear" : "firm and professional";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft a ${tone} reminder message for ${contactName}. 
      ${isOwedToMe ? `They owe me ${amount} USD.` : `I owe them ${amount} USD and want to acknowledge it.`}
      Keep it under 30 words. No subject line. Just the message body.`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text?.trim() || "Hey, just a reminder about our balance!";
  } catch (error) {
    return "Hey, just checking in on our pending balance when you have a moment!";
  }
};
