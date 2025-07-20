import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/lib/db/server';
import { conversations, messages } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const chatRouter = createTRPCRouter({
  getChats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('User not authenticated');
    return await db.select().from(conversations).where(eq(conversations.userId, ctx.user.id));
  }),

  createChat: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');
      const [newChat] = await db
        .insert(conversations)
        .values({
          userId: ctx.user.id,
          title: input.title,
        })
        .returning();
      return newChat;
    }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      return await db.select().from(messages).where(eq(messages.conversationId, input.conversationId));
    }),

  sendMessage: protectedProcedure
    .input(z.object({ message: z.string(), conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      // Insert user message
      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: 'user',
        content: input.message,
      });

      try {
        // Generate AI response
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(input.message);
        const response = await result.response;
        const aiContent = response.text();

        // Insert AI message
        await db.insert(messages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: aiContent,
        });

        return { success: true };
      } catch (error) {
        console.error('AI generation error:', error);
        
        // Insert fallback message
        await db.insert(messages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        });
        
        return { success: false, error: 'AI generation failed' };
      }
    }),
});
