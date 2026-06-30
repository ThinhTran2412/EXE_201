import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Linking, Platform } from 'react-native';
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
  React.useEffect(() => {
    if (Platform.OS === 'web' && visible && checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  }, [visible, checkoutUrl]);

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

        {Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <ActivityIndicator size="large" color="#E67E22" />
            <Text style={{ marginTop: 16, fontSize: 16, color: '#7F8C8D' }}>
              Đang chuyển hướng sang cổng thanh toán PayOS...
            </Text>
          </View>
        ) : checkoutUrl ? (
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
  webContainer: {
    flex: 1,
    backgroundColor: '#F9F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  webIcon: {
    marginBottom: 16,
  },
  webPrompt: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  webInstructions: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E67E22',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webHint: {
    fontSize: 13,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 16,
  },
  webActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '600',
  },
});
