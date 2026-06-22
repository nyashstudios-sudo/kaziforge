import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { X, Send, Paperclip } from 'lucide-react';

/**
 * Reusable Chat Widget component for real-time private messaging.
 * 
 * @param {string} currentUserId - The ID of the authenticated user.
 * @param {object} targetUser - The user object to chat with (id, email).
 * @param {boolean} isOpen - Controls visibility.
 * @param {function} onClose - Callback to close the widget.
 */
export default function ChatWidget({ currentUserId, targetUser, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const [targetLastRead, setTargetLastRead] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !targetUser || !currentUserId) return;

    const room = [currentUserId, targetUser.id].sort().join('_');
    fetchMessages(room);

    const channel = supabase.channel(`room:${room}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const targetPresence = state[targetUser.id];
        setIsTargetTyping(!!targetPresence?.some(p => p.isTyping));
        
        const latestRead = targetPresence?.reduce((acc, p) => (!acc || p.lastReadTimestamp > acc) ? p.lastReadTimestamp : acc, null);
        setTargetLastRead(latestRead);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room=eq.${room}` 
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isOpen, targetUser, currentUserId]);

  const fetchMessages = async (room) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room', room)
      .order('timestamp', { ascending: true });
    
    if (data) setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUser) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    channelRef.current?.track({ isTyping: false, lastReadTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null });

    const room = [currentUserId, targetUser.id].sort().join('_');
    const { error } = await supabase.from('messages').insert([{
      room,
      sender_id: currentUserId,
      text: newMessage,
      type: 'text'
    }]);

    if (!error) setNewMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetUser || !currentUserId) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${currentUserId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading file: ' + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);
    isTypingRef.current = false;
    channelRef.current?.track({ isTyping: false, lastReadTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null });

    const room = [currentUserId, targetUser.id].sort().join('_');
    await supabase.from('messages').insert([{
      room,
      sender_id: currentUserId,
      text: publicUrl,
      type: 'file'
    }]);
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <div>
          <div className="font-bold text-sm">Chat</div>
          <div className="text-[10px] opacity-75">{targetUser.email}</div>
        </div>
        <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-lg transition">
          <X size={18} />
        </button>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50 flex flex-col">
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div 
              key={msg.id || idx} 
              className={`max-w-[80%] p-3 text-xs shadow-sm ${
                isMine 
                  ? 'self-end bg-indigo-600 text-white rounded-t-2xl rounded-bl-2xl' 
                  : 'self-start bg-white text-gray-800 border rounded-t-2xl rounded-br-2xl'
              }`}
            >
              <div className="flex flex-col">
                {msg.type === 'file' ? (
                <a href={msg.text} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline decoration-dotted">
                  <Paperclip size={12} /> {msg.text.split('/').pop()}
                </a>
              ) : (
                msg.text
              )}
                {isMine && targetLastRead && msg.timestamp <= targetLastRead && (
                  <span className="text-[7px] mt-1 text-right opacity-70 italic">Seen</span>
                )}
              </div>
            </div>
          );
        })}
        {isTargetTyping && (
          <div className="self-start bg-gray-200 text-gray-500 italic p-2 rounded-2xl text-[10px] animate-pulse">
            Typing...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-indigo-600 transition px-1"
        >
          <Paperclip size={18} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (channelRef.current) {
              isTypingRef.current = true;
              channelRef.current.track({ isTyping: true, lastReadTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null });
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false;
                channelRef.current?.track({ isTyping: false, lastReadTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null });
              }, 3000);
            }
          }}
          placeholder="Type a message..." 
          className="flex-1 bg-gray-100 border-0 rounded-2xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button type="submit" className="bg-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}