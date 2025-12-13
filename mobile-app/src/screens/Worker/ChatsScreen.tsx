import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

type Chat = {
  id: string;
  job_id: string;
  company_user_id: string;
  helper_user_id: string;
  created_at: string;
  job?: {
    id: string;
    title: string;
    status: string;
  };
  company?: {
    id: string;
    full_name: string;
    email: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_user_id: string;
  };
  unread_count?: number;
};

export default function ChatsScreen() {
  const navigation = useNavigation<any>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [])
  );

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
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

      // Obtener chats del trabajador
      const { data: chatsData, error } = await supabase
        .from('VoyChats')
        .select(`
          id,
          job_id,
          company_user_id,
          helper_user_id,
          created_at,
          job:VoyJobs!job_id (
            id,
            title,
            status
          ),
          company:VoyUsers!company_user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('helper_user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      // Para cada chat, obtener el último mensaje y contar no leídos
      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat: any) => {
          // Último mensaje
          const { data: lastMessage } = await supabase
            .from('VoyMessages')
            .select('content, created_at, sender_user_id')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Contar mensajes no leídos
          const { count: unreadCount } = await supabase
            .from('VoyMessages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('sender_user_id', profile.id)
            .is('read_at', null);

          return {
            id: chat.id,
            job_id: chat.job_id,
            company_user_id: chat.company_user_id,
            helper_user_id: chat.helper_user_id,
            created_at: chat.created_at,
            job: chat.job?.[0] ? {
              id: chat.job[0].id,
              title: chat.job[0].title,
              status: chat.job[0].status,
            } : undefined,
            company: chat.company?.[0] ? {
              id: chat.company[0].id,
              full_name: chat.company[0].full_name,
              email: chat.company[0].email,
            } : undefined,
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0,
          };
        })
      );

      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const isUnread = (item.unread_count || 0) > 0;
    
    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          navigation.navigate('Chat', {
            jobId: item.job_id,
            otherUserId: item.company_user_id,
            otherUserName: item.company?.full_name || 'Empresa',
          })
        }
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
            <Text style={styles.avatarText}>
              {item.company?.full_name?.charAt(0).toUpperCase() || 'E'}
            </Text>
          </View>
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.companyName, isUnread && styles.unreadName]}>
              {item.company?.full_name || 'Empresa'}
            </Text>
            {item.last_message && (
              <Text style={styles.timeText}>
                {formatTime(item.last_message.created_at)}
              </Text>
            )}
          </View>
          
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.job?.title || 'Trabajo'}
          </Text>

          {item.last_message && (
            <Text
              style={[styles.lastMessage, isUnread && styles.unreadMessage]}
              numberOfLines={1}
            >
              {item.last_message.sender_user_id === currentUserId ? 'Tú: ' : ''}
              {item.last_message.content}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSubtitle}>
          {chats.length} {chats.length === 1 ? 'conversación' : 'conversaciones'}
        </Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No tienes conversaciones</Text>
            <Text style={styles.emptySubtext}>
              Cuando apliques a un trabajo y la empresa te contacte,
              verás tus conversaciones aquí
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  chatCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUnread: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  jobTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.gray,
  },
  unreadMessage: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});
