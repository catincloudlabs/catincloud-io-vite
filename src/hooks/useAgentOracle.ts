import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

/* --- AGENT ORACLE HOOK --- */
/* Manages communication with the Supabase 'oracle' Edge Function */

export function useAgentOracle() {
  const [messages, setMessages] = useState<Array<{type: 'agent'|'user'|'system', text: string}>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const sendMessage = useCallback(async (userQuery: string, context: string, mode?: string) => {
    // Optimistic UI Update
    setMessages(prev => [...prev, { type: 'user', text: userQuery }]);
    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('oracle', {
        body: { 
          message: userQuery, 
          context: context,
          mode: mode // Optional: 'physicist', 'analyst', etc.
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { type: 'agent', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'agent', text: "ERR: Uplink failed. Connection refused." }]);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { type: 'system', text }]);
  }, []);

  return { messages, isAiLoading, sendMessage, addSystemMessage };
}
