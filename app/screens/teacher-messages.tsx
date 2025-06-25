import React, { useState, useEffect } from 'react';
import { View, Image, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageService, Message } from '@/services/message-service';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageStore } from '@/store/message-store';
import {
  GSModeToggle,
  GSCard,
  GSIconButton,
  GSSearchBar,
  GSChip,
  Text
} from '@/components/ui';

export default function TeacherMessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { messages, isLoading: isLoadingMessages, fetchTeacherMessages, markAsRead } = useMessageStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'online'>('all');

  // Fetch messages on component mount and when filters change
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, selectedFilter, searchQuery]);

  const fetchMessages = async () => {
    if (!user) return;
    
    await fetchTeacherMessages(user.id, {
      search: searchQuery,
      filter: selectedFilter
    });
  };

  // Filter messages based on search and filter criteria
  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchQuery || 
      message.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.last_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'unread' && message.unread_count > 0) ||
      (selectedFilter === 'online' && message.is_online);
    
    return matchesSearch && matchesFilter;
  });

  const handleMessagePress = async (messageId: string) => {
    // Mark message as read
    await markAsRead(messageId);
    
    // Navigate to individual message thread
    router.push({
      pathname: '/ai-chat',
      params: { studentId: messageId }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Fixed Mode Toggle at the top */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: 'white' }}>
        <GSModeToggle />
      </View>

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#000' }}>Messages</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GSIconButton icon="magnify" onPress={() => {}} size={24} />
            <GSIconButton icon="filter" onPress={() => {}} size={24} />
          </View>
        </View>

        {/* Search Bar */}
        <GSSearchBar
          placeholder="Search students or messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <GSChip 
            label="All" 
            variant={selectedFilter === 'all' ? 'primary' : 'default'}
            onPress={() => setSelectedFilter('all')}
          />
          <GSChip 
            label="Unread" 
            variant={selectedFilter === 'unread' ? 'primary' : 'default'}
            onPress={() => setSelectedFilter('unread')}
          />
          <GSChip 
            label="Online" 
            variant={selectedFilter === 'online' ? 'primary' : 'default'}
            onPress={() => setSelectedFilter('online')}
          />
        </View>
      </View>

      {/* Messages List */}
      {isLoadingMessages ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleMessagePress(item.id)}>
              <GSCard variant="filled" padding="medium" margin="none" style={{ marginHorizontal: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Student Avatar with Online Status */}
                  <View style={{ position: 'relative' }}>
                    <Image 
                      source={{ uri: item.student_avatar || 'https://picsum.photos/40/40?random=default' }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                    {item.is_online && (
                      <View style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        right: 0, 
                        width: 14, 
                        height: 14, 
                        backgroundColor: '#10B981', 
                        borderRadius: 7, 
                        borderWidth: 2, 
                        borderColor: 'white' 
                      }} />
                    )}
                  </View>

                  {/* Message Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#000' }}>{item.student_name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#666' }}>{MessageService.formatTimestamp(item.timestamp)}</Text>
                        {item.unread_count > 0 && (
                          <View style={{ 
                            backgroundColor: '#3B82F6', 
                            borderRadius: 10, 
                            minWidth: 20, 
                            height: 20, 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            paddingHorizontal: 6 
                          }}>
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                              {item.unread_count}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }} numberOfLines={2}>
                      {item.last_message}
                    </Text>
                    
                    {/* Plant Info */}
                    {item.plant_name && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Image 
                          source={{ uri: item.plant_image || 'https://picsum.photos/24/24?random=plant' }}
                          style={{ width: 24, height: 24, borderRadius: 4 }}
                        />
                        <Text style={{ fontSize: 12, color: '#666' }}>{item.plant_name}</Text>
                      </View>
                    )}
                  </View>

                  {/* Message Icon */}
                  <GSIconButton icon="message-text" onPress={() => {}} size={20} />
                </View>
              </GSCard>
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
              <GSIconButton icon="message-text" onPress={() => {}} size={48} />
              <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#000' }}>
                No messages found
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                {searchQuery ? 'Try adjusting your search or filters.' : 'Your students haven\'t sent any messages yet.'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
} 