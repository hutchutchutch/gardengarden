import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FirebaseTest() {
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Testing...');

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Test Firebase import in React Native environment
        const firebaseApp = await import('@react-native-firebase/app');
        
        setFirebaseStatus('✅ Firebase module imported successfully in React Native!');
        console.log('Firebase module:', firebaseApp);
        console.log('Firebase module keys:', Object.keys(firebaseApp));
        
        // Try to access the default export or any available exports
        if (firebaseApp.default) {
          setFirebaseStatus('✅ Firebase default export found!');
        } else {
          setFirebaseStatus('⚠️ Firebase imported but no default export found');
        }
        
      } catch (error) {
        setFirebaseStatus(`❌ Firebase import failed: ${error}`);
        console.error('Firebase import error:', error);
      }
    };

    testFirebase();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      <Text style={styles.status}>{firebaseStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 