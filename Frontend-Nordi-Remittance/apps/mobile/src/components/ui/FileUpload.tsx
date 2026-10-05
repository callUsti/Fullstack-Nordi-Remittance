// ============================================================================
// FILE UPLOAD COMPONENT - Native document and photo picker for KYC/Onboarding
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, Image as ImageIcon, FileText, X, Upload } from 'lucide-react-native';
import { cn } from '@utils/cn';
import {
  ensureCameraPermission,
  ensureMediaLibraryPermission,
} from '@/core/utils/permission-handler';

export interface FileAsset {
  uri: string;
  name: string;
  type?: string;
  size?: number;
}

export interface FileUploadProps {
  id?: string;
  label?: string;
  description?: string;
  error?: string;
  value?: FileAsset | null;
  onChange: (file: FileAsset | null) => void;
  required?: boolean;
  maxSizeMB?: number;
  allowDocuments?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  error,
  value,
  onChange,
  required = false,
  maxSizeMB = 10,
  allowDocuments = true,
  className,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleCamera = async () => {
    setShowOptions(false);
    try {
      if (!(await ensureCameraPermission())) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photo verification.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onChange({
          uri: asset.uri,
          name: asset.fileName || 'camera-capture.jpg',
          type: 'image/jpeg',
          size: asset.fileSize,
        });
      }
    } catch (error) {
      console.error('Unable to open the camera:', error);
      Alert.alert('Error', 'Failed to open the camera.');
    }
  };

  const handleGallery = async () => {
    setShowOptions(false);
    try {
      if (!(await ensureMediaLibraryPermission())) {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to choose a photo.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onChange({
          uri: asset.uri,
          name: asset.fileName || 'selected-photo.jpg',
          type: 'image/jpeg',
          size: asset.fileSize,
        });
      }
    } catch (error) {
      console.error('Unable to open the photo library:', error);
      Alert.alert('Error', 'Failed to open the photo library.');
    }
  };

  const handleDocument = async () => {
    setShowOptions(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const doc = result.assets[0];
        if (doc.size && doc.size > maxSizeMB * 1024 * 1024) {
          Alert.alert('File too large', `Maximum allowed file size is ${maxSizeMB}MB.`);
          return;
        }

        onChange({
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || 'application/octet-stream',
          size: doc.size,
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const isImage = value?.type?.startsWith('image/') || value?.uri?.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <View className={cn('mb-4 w-full', className)}>
      {label && (
        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
          {label}
          {required && <Text className="text-error-500"> *</Text>}
        </Text>
      )}

      {description && (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          {description}
        </Text>
      )}

      {/* Selected File Card */}
      {value ? (
        <View className="flex-row items-center p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80">
          {isImage ? (
            <Image
              source={{ uri: value.uri }}
              className="w-12 h-12 rounded-lg bg-neutral-200"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-950/40 items-center justify-center">
              <FileText size={24} color="#1E3A8A" />
            </View>
          )}

          <View className="flex-1 ml-3 mr-2">
            <Text
              numberOfLines={1}
              className="text-sm font-semibold text-neutral-900 dark:text-white"
            >
              {value.name}
            </Text>
            {value.size && (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {(value.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onChange(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700"
          >
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      ) : (
        /* Empty Upload Trigger */
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowOptions(true)}
          className={cn(
            'border-2 border-dashed rounded-2xl p-6 items-center justify-center bg-neutral-50/60 dark:bg-neutral-800/30',
            error
              ? 'border-error-500 bg-error-50/30 dark:bg-error-950/20'
              : 'border-neutral-300 dark:border-neutral-700 active:border-primary-500',
          )}
        >
          <View className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-2">
            <Upload size={22} color="#1E3A8A" />
          </View>
          <Text className="text-sm font-bold text-neutral-900 dark:text-white">
            Upload document or photo
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Tap to capture or browse files (Max {maxSizeMB}MB)
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text className="text-xs font-medium text-error-600 dark:text-error-400 mt-1.5">
          {error}
        </Text>
      )}

      {/* Action Picker Sheet */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <View className="bg-white dark:bg-neutral-800 rounded-t-3xl p-6 pb-10 space-y-3">
            <Text className="text-base font-bold text-neutral-900 dark:text-white mb-2 text-center">
              Select Document Source
            </Text>

            <TouchableOpacity
              onPress={handleCamera}
              className="flex-row items-center p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-700/60"
            >
              <Camera size={20} color="#1E3A8A" />
              <Text className="ml-3 text-sm font-semibold text-neutral-900 dark:text-white">
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGallery}
              className="flex-row items-center p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-700/60"
            >
              <ImageIcon size={20} color="#1E3A8A" />
              <Text className="ml-3 text-sm font-semibold text-neutral-900 dark:text-white">
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            {allowDocuments && (
              <TouchableOpacity
                onPress={handleDocument}
                className="flex-row items-center p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-700/60"
              >
                <FileText size={20} color="#1E3A8A" />
                <Text className="ml-3 text-sm font-semibold text-neutral-900 dark:text-white">
                  Browse Files (PDF / Documents)
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowOptions(false)}
              className="mt-2 py-3 items-center"
            >
              <Text className="text-sm font-bold text-neutral-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default FileUpload;
