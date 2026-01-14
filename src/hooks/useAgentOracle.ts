import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useAgentOracle() {
  const [messages, setMessages] = useState<Array<{type: 'agent'|'user'|'system', text: string}>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const sendMessage = useCallback(async (userQuery: string, context: string, mode?: string) => {
    // Optimistic UI Update
    setMessages(prev => [...prev, { type: 'user', text: userQuery }]);
    setIsAiLoading(true);

    try {
      // THE WIRING: Matches the { message, context, mode } in index.ts
      const { data, error } = await supabase.functions.invoke('oracle', {
        body: { 
          message: userQuery, 
          context: context,
          // Pass the mode into the payload
          mode: mode 
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { type: 'agent', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        type: 'agent', 
        text: "I'm having trouble connecting to the network right now. Please try asking again in a moment." 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { type: 'system', text }]);
  }, []);

  return { messages, isAiLoading, sendMessage, addSystemMessage };
}
