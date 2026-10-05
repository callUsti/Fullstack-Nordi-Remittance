import { configureDefaultStorage } from '@nordi/shared/core/platform/storage';
import { configurePersistStorage } from '@nordi/shared/store/persistStorage';
import { asyncStorageAdapter } from './platform/storage';

// Configure persistence before importing Zustand stores, which hydrate on load.
configureDefaultStorage(asyncStorageAdapter);
configurePersistStorage(asyncStorageAdapter);
