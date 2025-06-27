import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageService, MessageThread } from '@/services/message-service';
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
  const { messageThreads, isLoading: isLoadingMessages, fetchTeacherMessageThreads, markThreadAsRead } = useMessageStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'online'>('all');

  // Helper function to get student initials
  const getStudentInitials = (studentName?: string) => {
    if (!studentName) return 'U';
    return studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  // Fetch messages on component mount and when filters change
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, selectedFilter, searchQuery]);

  const fetchMessages = async () => {
    if (!user) return;
    
    await fetchTeacherMessageThreads(user.id, {
      search: searchQuery,
      filter: selectedFilter
    });
  };

  // Filter messages based on search and filter criteria
  const filteredMessages = messageThreads.filter(thread => {
    const matchesSearch = !searchQuery || 
      thread.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'unread' && (thread.unread_count || 0) > 0);
    
    return matchesSearch && matchesFilter;
  });

  const handleMessagePress = async (thread: MessageThread) => {
    // Mark thread messages as read
    if (user && thread.unread_count && thread.unread_count > 0) {
      await markThreadAsRead(thread.id, user.id);
    }
    
    // Navigate to individual message thread
    router.push({
      pathname: '/ai-chat',
      params: { 
        threadId: thread.id, 
        studentId: thread.student_id,
        mode: 'teacher'
      }
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
            <Pressable onPress={() => handleMessagePress(item)}>
              <GSCard variant="filled" padding="medium" margin="none" style={{ marginHorizontal: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Student Avatar - Display Initials */}
                  <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: '#3B82F6',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ 
                      color: 'white', 
                      fontSize: 18, 
                      fontWeight: '600' 
                    }}>
                      {getStudentInitials(item.student?.name)}
                    </Text>
                  </View>

                  {/* Message Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#000' }}>
                        {item.student?.name || 'Unknown Student'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          {item.last_message ? MessageService.formatTimestamp(item.last_message.created_at) : 'No messages'}
                        </Text>
                        {item.unread_count && item.unread_count > 0 && (
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
                      {item.last_message?.content?.startsWith('DOCUMENT_REF:') 
                        ? 'Document shared' 
                        : (item.last_message?.content || 'No messages yet')}
                    </Text>
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