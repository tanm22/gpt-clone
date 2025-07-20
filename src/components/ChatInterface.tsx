'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, LogOut} from 'lucide-react';
import { api } from '@/utils/api';
import { useAuth } from '@/components/AuthProvider';

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string | null;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date | null;
}

export default function ChatInterface() {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  //only make API calls if user is authenticated
  const { data: fetchedConversations, refetch: refetchConversations } = api.chat.getChats.useQuery(
    undefined, 
    { enabled: !!user }
  );
  
  const { data: fetchedMessages } = api.chat.getMessages.useQuery(
    { conversationId: currentConversation?.id || '' },
    { enabled: !!currentConversation && !!user }
  );

  const createChat = api.chat.createChat.useMutation({
    onSuccess: (newChat: Conversation) => {
      setConversations((prev) => [newChat, ...prev]);
      setCurrentConversation(newChat);
      setMessages([]);
      refetchConversations();
    },
  });

    const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setInput('');
      
      //invalidate and refetch messages for current conversation
      if (currentConversation) {
        utils.chat.getMessages.invalidate({
          conversationId: currentConversation.id
        });
      }
    },
    onError: (error) => {
      console.error('Send message error:', error);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (fetchedConversations) {
      const formattedConversations = fetchedConversations.map((conv) => ({
        ...conv,
        title: conv.title ?? 'New Chat',
        createdAt: conv.createdAt,
      }));
      setConversations(formattedConversations);
      if (!currentConversation && formattedConversations.length > 0) {
        setCurrentConversation(formattedConversations[0]);
      }
    }
  }, [fetchedConversations, currentConversation]);

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(
        fetchedMessages.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt ? msg.createdAt.toISOString() : null,
        }))
      );
    }
  }, [fetchedMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!currentConversation) {
      await createChat.mutateAsync({ title: input.slice(0, 50) });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    await sendMessage.mutateAsync({
      message: input,
      conversationId: currentConversation.id
    });
  };

  const handleNewChat = async () => {
    await createChat.mutateAsync({ title: 'New Chat' });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return <div>Please log in to use the chat interface.</div>;
  }

  return (
    <div className="chat-app">
      {/* Sidebar */}
      <div className={`chat-sidebar ${!sidebarOpen ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <button onClick={handleNewChat} className="btn btn--primary" style={{ width: '100%' }}>
            <Plus size={16} />
            New Chat
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversation(conv)}
                className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              >
                <div className="conversation-title">
                  {conv.title ?? 'New Chat'}
                </div>
                {conv.createdAt && (
                  <div className="conversation-date">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={handleSignOut} className="btn btn--secondary" style={{ width: '100%' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
          >
            <Menu size={20} />
          </button>
          <h1 className="chat-title">
            {currentConversation?.title || 'Your AI assistant for anything you need'}
          </h1>
        </div>

        <div className="messages-container">
          <div className="messages-list">
            {messages.length === 0 && !currentConversation ? (
              <div className="welcome-message">
                <h2>Your AI assistant for anything you need</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-bubble">
                    <div className="message-content">{message.content}</div>
                    <div className="message-timestamp">
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString()
                        : 'Just now'}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="message assistant">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="message-input-container">
          <form onSubmit={handleSubmit} className="message-input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              className="message-input"
              disabled={isLoading}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || isLoading}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
