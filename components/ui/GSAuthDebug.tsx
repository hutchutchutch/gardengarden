import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import colors from '@/constants/colors';

export function GSAuthDebug() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (user?.id) {
        // Get user details from users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserDetails(userData);

        // Get auth user details
        const { data: { user: authUserData } } = await supabase.auth.getUser();
        setAuthUser(authUserData);
      }
    };

    fetchDetails();
  }, [user?.id]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Not logged in</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Auth Debug Info</Text>
      
      <Text style={styles.subtitle}>Context User:</Text>
      <Text style={styles.text}>ID: {user?.id || 'Not logged in'}</Text>
      <Text style={styles.text}>Role: {user?.role || 'N/A'}</Text>
      <Text style={styles.text}>Name: {user?.name || 'N/A'}</Text>
      <Text style={styles.text}>Email: {user?.email || 'N/A'}</Text>

      <Text style={styles.subtitle}>Auth User:</Text>
      <Text style={styles.text}>ID: {authUser?.id || 'N/A'}</Text>
      <Text style={styles.text}>Email: {authUser?.email || 'N/A'}</Text>
      
      <Text style={styles.subtitle}>Database User Details:</Text>
      <Text style={styles.text}>{userDetails ? JSON.stringify(userDetails, null, 2) : 'Loading...'}</Text>
      
      <Text style={styles.subtitle}>Test Users:</Text>
      <Text style={styles.text}>Student: 9bc5a262-f6ce-4da5-bdfc-28a9383cabb2 (Hutch Herky)</Text>
      <Text style={styles.text}>Teacher: ee242274-2c32-4432-bfad-69cbeb9d1228 (Hutch Herchenbach)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning,
    padding: 10,
    margin: 5,
    borderRadius: 5,
    maxHeight: 300,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}); 