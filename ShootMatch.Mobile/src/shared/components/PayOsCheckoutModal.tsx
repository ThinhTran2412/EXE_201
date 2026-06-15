import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface PayOsCheckoutModalProps {
  visible: boolean;
  checkoutUrl: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PayOsCheckoutModal: React.FC<PayOsCheckoutModalProps> = ({
  visible,
  checkoutUrl,
  onClose,
  onSuccess,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Thanh toán cọc qua PayOS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {checkoutUrl ? (
          <WebView
            source={{ uri: checkoutUrl }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              const { url } = request;
              // Detect non-http/https links (deep link schemes like momo://, vietqr://, etc.)
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                Linking.openURL(url).catch((err) => {
                  console.warn('Failed to open deep link:', err);
                });
                return false; // Stop WebView from loading this URL internally
              }
              return true;
            }}
            onNavigationStateChange={(navState) => {
              const { url } = navState;
              if (url.includes('cancel=true')) {
                onCancel();
              } else if (url.includes('payment-result')) {
                if (url.includes('cancel=true')) {
                    onCancel();
                } else {
                    onSuccess();
                }
              } else if (url.includes('cancel=false') || url.includes('success=true')) {
                onSuccess();
              }
            }}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
