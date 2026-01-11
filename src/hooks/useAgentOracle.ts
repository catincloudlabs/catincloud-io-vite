import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Message {
  type: 'agent' | 'user' | 'system';
  text: string;
  timestamp: number;
}

export function useAgentOracle() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'agent', 
      text: `SYSTEM ONLINE v2.5.0\n-----------------------\n> "Physics": Explains motion model.\n> "Legend": Decodes signals.\n> "Strategy": Tactical guide.`,
      timestamp: Date.now()
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const sendMessage = useCallback(async (userQuery: string, context: string) => {
    // 1. Add User Message immediately
    const userMsg: Message = { type: 'user', text: userQuery, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      // 2. Invoke Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('oracle', {
        body: { message: userQuery, context }
      });

      if (error) throw error;

      // 3. Add AI Response
      const aiMsg: Message = { type: 'agent', text: data.reply, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        type: 'agent', 
        text: "ERR: Uplink failed. AI Oracle offline.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { type: 'agent', text, timestamp: Date.now() }]);
  }, []);

  return { messages, isAiLoading, sendMessage, addSystemMessage };
}
