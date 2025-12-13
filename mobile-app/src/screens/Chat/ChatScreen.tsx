import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

type ChatMessage = {
  id: string;
  chat_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type ChatScreenParams = {
  jobId: string;
  otherUserId: string;
  otherUserName: string;
};

export default function ChatScreen() {
  const route = useRoute<RouteProp<{ Chat: ChatScreenParams }, 'Chat'>>();
  const navigation = useNavigation();
  const { jobId, otherUserId, otherUserName } = route.params;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
  }, [jobId, otherUserId]);

  useEffect(() => {
    if (!chatId) return;

    // Suscribirse a nuevos mensajes
    const subscription = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'VoyMessages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Solo agregar si no existe ya (evitar duplicados con mensajes optimistas)
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) return prev;
            return [newMsg, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('VoyUsers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;
      setCurrentUserId(profile.id);

      // Buscar o crear chat
      const chat = await getOrCreateChat(jobId, profile.id, otherUserId);
      if (chat) {
        setChatId(chat.id);
        await loadMessages(chat.id);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateChat = async (jobId: string, userId: string, otherUserId: string) => {
    try {
      // Validar que tenemos todos los IDs necesarios
      if (!jobId || !userId || !otherUserId) {
        console.error('Missing required IDs:', { jobId, userId, otherUserId });
        return null;
      }

      // Buscar chat existente - buscar en ambas direcciones
      const { data: existingChats, error: searchError } = await supabase
        .from('VoyChats')
        .select('*')
        .eq('job_id', jobId);

      if (searchError) {
        console.error('Error searching chats:', searchError);
      }

      // Filtrar para encontrar el chat que coincida con los participantes
      const existingChat = existingChats?.find(chat => 
        (chat.company_user_id === userId && chat.helper_user_id === otherUserId) ||
        (chat.company_user_id === otherUserId && chat.helper_user_id === userId)
      );

      if (existingChat) {
        return existingChat;
      }

      // Determinar quién es empresa y quién es helper
      const { data: userProfile } = await supabase
        .from('VoyUsers')
        .select('role')
        .eq('id', userId)
        .single();

      const isUserCompany = userProfile?.role === 'COMPANY' || userProfile?.role === 'PARTICULAR';
      
      // Crear nuevo chat
      const { data: newChat, error } = await supabase
        .from('VoyChats')
        .insert({
          job_id: jobId,
          company_user_id: isUserCompany ? userId : otherUserId,
          helper_user_id: isUserCompany ? otherUserId : userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        throw error;
      }
      return newChat;
    } catch (error) {
      console.error('Error getting or creating chat:', error);
      return null;
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('VoyMessages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Marcar mensajes como leídos
      await supabase
        .from('VoyMessages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('sender_user_id', currentUserId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    try {
      const messageContent = newMessage.trim();
      const tempId = `temp-${Date.now()}`;
      
      // Agregar mensaje optimista al estado inmediatamente
      const optimisticMessage: ChatMessage = {
        id: tempId,
        chat_id: chatId,
        sender_user_id: currentUserId,
        content: messageContent,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      
      setMessages((prev) => [optimisticMessage, ...prev]);
      setNewMessage('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

      // Insertar en la base de datos
      const { data, error } = await supabase
        .from('VoyMessages')
        .insert({
          chat_id: chatId,
          sender_user_id: currentUserId,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Reemplazar mensaje temporal con el mensaje real de la BD
      if (data) {
        setMessages((prev) => prev.map(msg => 
          msg.id === tempId ? data as ChatMessage : msg
        ));
      }

      // Actualizar last_message_at en VoyChats
      await supabase
        .from('VoyChats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);

    } catch (error) {
      console.error('Error sending message:', error);
      // Remover mensaje optimista en caso de error
      setMessages((prev) => prev.filter(msg => !msg.id.startsWith('temp-')));
      setNewMessage(newMessage); // Restaurar el texto del mensaje
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.sender_user_id === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUserName}</Text>
          <Text style={styles.headerStatus}>Chat sobre trabajo</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyText}>No hay mensajes aún</Text>
              <Text style={styles.emptySubtext}>Envía el primer mensaje</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={COLORS.gray}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? COLORS.white : COLORS.gray}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.dark,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: COLORS.gray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
});
