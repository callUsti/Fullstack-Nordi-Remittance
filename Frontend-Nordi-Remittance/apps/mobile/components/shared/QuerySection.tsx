import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';
import { useNetworkStatus } from '../../../mobile2/src/hooks/useNetworkStatus';

export interface QuerySectionProps {
  children: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | unknown;
  hasData?: boolean;
  title?: string;
  onRetry?: () => void;
  loadingSkeleton?: ReactNode;
  minHeight?: number;
}

interface RenderBoundaryState {
  hasRenderError: boolean;
  renderError: Error | null;
}

class SectionRenderBoundary extends Component<
  { children: ReactNode; title?: string; onRetry?: () => void },
  RenderBoundaryState
> {
  state: RenderBoundaryState = { hasRenderError: false, renderError: null };

  static getDerivedStateFromError(error: Error): RenderBoundaryState {
    return { hasRenderError: true, renderError: error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[QuerySection:${this.props.title || 'unknown'}] Render crash:`, error, info);
  }

  render() {
    if (this.state.hasRenderError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" style={styles.errorIcon} />
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.renderError?.message || 'A rendering error occurred.'}
            </Text>
          </View>
          {this.props.onRetry && (
            <TouchableOpacity
              onPress={() => {
                this.setState({ hasRenderError: false, renderError: null });
                this.props.onRetry?.();
              }}
              style={styles.retryButton}
            >
              <Ionicons name="refresh" size={16} color="#ef4444" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

export const QuerySection: React.FC<QuerySectionProps> = ({
  children,
  isLoading = false,
  isError = false,
  error,
  hasData = true,
  title,
  onRetry,
  loadingSkeleton,
  minHeight,
}) => {
  const { isOnline } = useNetworkStatus();

  const showLoading = isLoading && !hasData;
  const showError = isError && !hasData;
  const showStale = isError && hasData;
  const showOfflineStale = !isOnline && hasData && !isLoading;

  return (
    <View style={[styles.root, minHeight ? { minHeight } : null]}>
      <SectionRenderBoundary title={title} onRetry={onRetry}>
        {showLoading ? (
          loadingSkeleton || (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            </View>
          )
        ) : showError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>{title || 'Error loading data'}</Text>
              <Text style={styles.errorMessage}>
                {error instanceof Error ? error.message : 'Failed to load this section.'}
              </Text>
            </View>
            {onRetry && (
              <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <Ionicons name="refresh" size={16} color="#ef4444" />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {(showStale || showOfflineStale) && (
              <View style={styles.staleBadge}>
                <Ionicons
                  name={!isOnline ? 'cloud-offline' : 'time'}
                  size={12}
                  color="#d97706"
                />
                <Text style={styles.staleText}>
                  {!isOnline ? 'Offline - Showing cached data' : 'Data may be outdated'}
                </Text>
              </View>
            )}
            {children}
          </>
        )}
      </SectionRenderBoundary>
    </View>
  );
};

export default QuerySection;

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    width: '100%',
  },
  loadingContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: 8,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  errorMessage: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginLeft: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  staleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  staleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
  },
});
