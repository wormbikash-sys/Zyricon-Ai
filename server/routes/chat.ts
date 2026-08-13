import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthRequest, chatRateLimiter } from '../middleware/auth.js';
import { executeCompletionStream, fetchModelCatalog } from '../services/aicredits.js';
import { Conversation, Message, Usage } from '../types.js';

const router = Router();

const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  model: z.string().optional(),
});

// POST /api/chat - Stream Chat Completions
router.post('/chat', requireAuth, chatRateLimiter, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const isUserAdmin = req.user!.role === 'ADMIN';

    // Security Check: Reject forbidden parameters submitted from frontend
    if ('systemPrompt' in req.body || 'premium' in req.body || 'dailyChatsUsed' in req.body) {
      return res.status(400).json({ error: 'System configuration parameters cannot be set by client.' });
    }

    if (req.body.role === 'system' || req.body.role === 'developer' || req.body.role === 'tool') {
      return res.status(400).json({ error: 'Unauthorized role parameter in request.' });
    }

    const settings = await db.getSettings();

    if (settings.maintenanceMode && !isUserAdmin) {
      return res.status(503).json({ error: 'System is currently in maintenance mode. Please try again later.' });
    }

    const validation = chatRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid chat request format' });
    }

    const { conversationId, message, model: requestedModel } = validation.data;

    // Check message length limit
    if (message.length > settings.maxMessageLength) {
      return res.status(400).json({
        error: `Message exceeds the maximum length of ${settings.maxMessageLength} characters.`,
      });
    }

    // Verify User Limits
    const user = await db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (user.lastResetDate !== today) {
      user.dailyChatsUsed = 0;
      user.lastResetDate = today;
    }

    const effectiveLimit = user.premium ? settings.premiumDailyLimit : user.dailyChatLimit || settings.freeDailyLimit;
    if (user.dailyChatsUsed >= effectiveLimit && !isUserAdmin) {
      return res.status(429).json({
        error: `Daily chat limit reached (${user.dailyChatsUsed}/${effectiveLimit}). Upgrade to Premium for higher limits!`,
      });
    }

    // Determine model server-side
    // Normal users always use backend defaultModel. Only admins can optionally specify a test model.
    const selectedModelId = isUserAdmin && requestedModel ? requestedModel : settings.defaultModel;
    const publicModelDisplayName = 'Zyricon AI';

    const catalog = await fetchModelCatalog();
    const modelMeta = catalog.find(m => m.id === selectedModelId);

    if (modelMeta && !modelMeta.isEnabled && !isUserAdmin) {
      return res.status(400).json({ error: 'The AI model is currently undergoing routine maintenance.' });
    }

    if (modelMeta && modelMeta.isPremiumOnly && !user.premium && !isUserAdmin) {
      return res.status(403).json({ error: 'This AI configuration is reserved for Premium subscribers.' });
    }

    // Load or Create Conversation
    let conversation: Conversation | null = null;
    const now = new Date().toISOString();

    if (conversationId) {
      conversation = await db.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
      if (conversation.userId !== userId && !isUserAdmin) {
        return res.status(403).json({ error: 'Unauthorized access to this conversation.' });
      }
      conversation.model = selectedModelId;
      conversation.updatedAt = now;
      await db.updateConversation(conversation);
    } else {
      // Auto-generate title from first 40 chars of message
      const generatedTitle = message.slice(0, 40).replace(/\n/g, ' ') + (message.length > 40 ? '...' : '');
      const newConvId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      conversation = {
        id: newConvId,
        userId,
        title: generatedTitle,
        model: selectedModelId,
        createdAt: now,
        updatedAt: now,
      };
      await db.createConversation(conversation);
    }

    // Fetch conversation message history
    const existingMessages = await db.getMessagesByConversationId(conversation.id);

    // Filter message history to include ONLY user and assistant messages
    const cleanHistory = existingMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Save User Message
    const userMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_u`;
    const userMessageObj: Message = {
      id: userMsgId,
      conversationId: conversation.id,
      role: 'user',
      content: message,
      model: isUserAdmin ? selectedModelId : publicModelDisplayName,
      createdAt: now,
    };
    await db.createMessage(userMessageObj);

    // Prepare message context for AI completion - SYSTEM PROMPT STRICTLY AT INDEX 0
    const messagesForAI: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: settings.systemPrompt },
      ...cleanHistory,
      { role: 'user', content: message },
    ];

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send metadata header first (displaying publicModelDisplayName to non-admins)
    const clientModelLabel = isUserAdmin ? selectedModelId : publicModelDisplayName;
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: conversation.id, model: clientModelLabel })}\n\n`);

    let accumulatedResponse = '';

    await executeCompletionStream({
      messages: messagesForAI,
      primaryModel: selectedModelId,
      fallbackModels: settings.fallbackModels,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      onChunk: (chunkText) => {
        accumulatedResponse += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
      },
      onDone: async (fullText, actualModel) => {
        const assistantMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_a`;
        const assistantMessageObj: Message = {
          id: assistantMsgId,
          conversationId: conversation!.id,
          role: 'assistant',
          content: fullText,
          model: isUserAdmin ? actualModel : publicModelDisplayName,
          createdAt: new Date().toISOString(),
        };
        await db.createMessage(assistantMessageObj);

        // Update User Usage
        user.dailyChatsUsed += 1;
        user.totalChats += 1;
        user.updatedAt = new Date().toISOString();
        await db.updateUser(user);

        const inputTokens = Math.ceil((message.length + settings.systemPrompt.length) / 4);
        const outputTokens = Math.ceil(fullText.length / 4);
        const usageObj: Usage = {
          id: `usg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          date: today,
          requests: 1,
          inputTokens,
          outputTokens,
          estimatedCost: (inputTokens * 0.000001) + (outputTokens * 0.000002),
          model: actualModel,
        };
        await db.recordUsage(usageObj);

        res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMsgId, modelUsed: clientModelLabel })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      onError: (err) => {
        console.error('[AICredits Stream Execution Error]:', err);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'AI service encountered an issue. Please try again in a moment.' })}\n\n`);
        res.end();
      },
    });

  } catch (err) {
    console.error('[POST /api/chat Handler Error]:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal chat server error.' });
    }
  }
});

// GET /api/chats - Get user conversations
router.get('/chats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversations = await db.getConversationsByUserId(userId);
    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

// POST /api/chats - Create new conversation
router.post('/chats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, model } = req.body;
    const settings = await db.getSettings();

    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: title || 'New Conversation',
      model: model || settings.defaultModel,
      createdAt: now,
      updatedAt: now,
    };

    await db.createConversation(newConv);
    return res.status(201).json({ conversation: newConv });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

// GET /api/chats/:id - Get conversation details & messages
router.get('/chats/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const conversation = await db.getConversationById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (conversation.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access to conversation.' });
    }

    const messages = await db.getMessagesByConversationId(id);
    return res.json({ conversation, messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve conversation messages.' });
  }
});

// PATCH /api/chats/:id - Rename conversation
router.patch('/chats/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Conversation title cannot be empty.' });
    }

    const conversation = await db.getConversationById(id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    if (conversation.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    conversation.title = title.trim();
    conversation.updatedAt = new Date().toISOString();
    await db.updateConversation(conversation);

    return res.json({ conversation });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update conversation title.' });
  }
});

// DELETE /api/chats/:id - Delete conversation
router.delete('/chats/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const conversation = await db.getConversationById(id);

    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    if (conversation.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await db.deleteConversation(id);
    return res.json({ message: 'Conversation deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

// GET /api/chats/:id/export - Export chat history
router.get('/chats/:id/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const format = (req.query.format as string) || 'md';

    const user = await db.getUserById(req.user!.id);
    if (!user?.premium && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chat export feature is exclusive to Premium users.' });
    }

    const conversation = await db.getConversationById(id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    if (conversation.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const messages = await db.getMessagesByConversationId(id);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
      return res.send(JSON.stringify({ conversation, messages }, null, 2));
    }

    if (format === 'txt') {
      let text = `Title: ${conversation.title}\nModel: ${conversation.model}\nDate: ${conversation.createdAt}\n\n`;
      messages.forEach(m => {
        text += `[${m.role.toUpperCase()}] (${m.createdAt}):\n${m.content}\n\n-------------------------\n\n`;
      });
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, '_')}.txt"`);
      return res.send(text);
    }

    // Default markdown
    let md = `# ${conversation.title}\n\n- **Model**: \`${conversation.model}\`\n- **Exported At**: ${new Date().toISOString()}\n\n---\n\n`;
    messages.forEach(m => {
      const sender = m.role === 'user' ? '👤 User' : '🤖 Assistant';
      md += `### ${sender}\n\n${m.content}\n\n---\n\n`;
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, '_')}.md"`);
    return res.send(md);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export conversation.' });
  }
});

export default router;
