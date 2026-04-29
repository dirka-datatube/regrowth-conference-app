import { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { T } from './Type';
import { Button } from './Button';

export function ScannerModal({
  onClose,
  onScanned,
}: {
  onClose: () => void;
  onScanned: (token: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-midnight">
        <View className="flex-row items-center justify-between p-5 pt-16">
          <T variant="caption">Scan a QR</T>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={(res) => {
              if (lockRef.current || scanned) return;
              lockRef.current = true;
              setScanned(true);
              onScanned(res.data);
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <T variant="h3" className="text-center">We need camera access</T>
            <T variant="body" className="mt-2 text-cloud/80 text-center">
              We'll use it to scan QR codes — never anything more.
            </T>
            <View className="mt-6 w-full">
              <Button label="Allow camera" onPress={() => requestPermission()} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
