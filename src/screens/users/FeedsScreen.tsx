// src/screens/users/FeedsScreen.tsx

import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  ActivityIndicator, 
  Dimensions, 
  Image,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Modal,
  StatusBar,
  TouchableWithoutFeedback
} from 'react-native';
import Video from 'react-native-video';
import { useQuery } from '@tanstack/react-query';
import { fetchFeedsFn } from '../../api/api';
import Icon from 'react-native-vector-icons/Ionicons'; // Make sure to install this package

// Define types for the data structure based on your sample
interface Feed {
    id: string;
    user_id: string;
    title: string;
    description: string;
    image_urls: string[] | null;
    video_url: string[] | null;
    created_at: string;
    updated_at: string;
}

interface FetchFeedsResponse {
    message: string;
    feeds: Feed[];
}

// Image Viewer state interface
interface ImageViewerState {
  visible: boolean;
  imageUrl: string | null;
  imageIndex: number;
  feedIndex: number;
}

// A helper to format date-time string to readable format
const formatDateTime = (dateString: any) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error("Invalid date-time string for formatting:", dateString);
            return "Invalid Date";
        }
        
        // Calculate time difference
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        // Format as relative time if recent
        if (diffMins < 60) {
            return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
        } else if (diffHours < 24) {
            return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        } else {
            // Fall back to formatted date for older posts
            return date.toLocaleDateString("en-GB", {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    } catch (e) {
         console.error("Error formatting date-time:", e);
         return "Error";
    }
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const mediaWidth = screenWidth - 40;
const videoHeight = mediaWidth * (9 / 16);

const FeedsScreen = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  // Image viewer state
  const [imageViewer, setImageViewer] = useState<ImageViewerState>({
    visible: false,
    imageUrl: null,
    imageIndex: 0,
    feedIndex: 0
  });
  
  const {
    data: feedsData,
    isLoading: isFeedsLoading,
    isError: isFeedsError,
    error: feedsErrorObject,
    refetch: refetchFeeds,
  } = useQuery<FetchFeedsResponse>({
    queryKey: ['feeds'],
    queryFn: async () => {
      const response = await fetchFeedsFn();
      return response.data;
    },
  });

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchFeeds().finally(() => setRefreshing(false));
  }, [refetchFeeds]);

  // Open image viewer
  const openImageViewer = (url: string, imageIndex: number, feedIndex: number) => {
    setImageViewer({
      visible: true,
      imageUrl: url,
      imageIndex,
      feedIndex
    });
  };

  // Close image viewer
  const closeImageViewer = () => {
    setImageViewer(prev => ({
      ...prev,
      visible: false
    }));
  };

  // Navigate to previous image
  const showPreviousImage = () => {
    if (!feedsData || imageViewer.feedIndex < 0 || !imageViewer.imageUrl) return;
    
    const currentFeed = feedsData.feeds[imageViewer.feedIndex];
    if (!currentFeed.image_urls || currentFeed.image_urls.length <= 1) return;
    
    const newIndex = (imageViewer.imageIndex - 1 + currentFeed.image_urls.length) % currentFeed.image_urls.length;
    setImageViewer(prev => ({
      ...prev,
      imageIndex: newIndex,
      imageUrl: currentFeed.image_urls![newIndex]
    }));
  };

  // Navigate to next image
  const showNextImage = () => {
    if (!feedsData || imageViewer.feedIndex < 0 || !imageViewer.imageUrl) return;
    
    const currentFeed = feedsData.feeds[imageViewer.feedIndex];
    if (!currentFeed.image_urls || currentFeed.image_urls.length <= 1) return;
    
    const newIndex = (imageViewer.imageIndex + 1) % currentFeed.image_urls.length;
    setImageViewer(prev => ({
      ...prev,
      imageIndex: newIndex,
      imageUrl: currentFeed.image_urls![newIndex]
    }));
  };

  // --- Render Loading State ---
  if (isFeedsLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Feeds...</Text>
      </View>
    );
  }

  // --- Render Error State ---
  if (isFeedsError) {
    console.error('FeedsScreen: Error fetching feeds:', feedsErrorObject);
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={48} color="#dc3545" />
        <Text style={styles.errorText}>Failed to load feeds.</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => refetchFeeds()}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Render Empty State ---
  if (!feedsData || !Array.isArray(feedsData.feeds) || feedsData.feeds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="document-outline" size={48} color="#888" />
          <Text style={styles.emptyText}>No feeds available.</Text>
          <Text style={styles.emptySubText}>Check back later for updates.</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Feed Card Item ---
  const renderFeedItem = ({ item, index }: { item: Feed, index: number }) => {
    return (
      <Animated.View style={styles.feedCard}>
        {/* Header with optional user info - could expand in future */}
        <View style={styles.feedHeader}>
          <View style={styles.feedAuthorPlaceholder} />
          <View style={styles.feedHeaderContent}>
            <Text style={styles.feedTitle}>{item.title}</Text>
            <Text style={styles.feedDate}>{formatDateTime(item.created_at)}</Text>
          </View>
        </View>

        {/* Feed Content */}
        <Text style={styles.feedDescription}>{item.description}</Text>

        {/* Display Images */}
        {item.image_urls && item.image_urls.length > 0 && (
          <View style={styles.mediaContainer}>
            {item.image_urls.length === 1 ? (
              // Single image view
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => openImageViewer(item.image_urls![0], 0, index)}
              >
                <Image
                  source={{ uri: item.image_urls[0] }}
                  style={styles.singleImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              // Multiple images grid view
              <View style={styles.imageGrid}>
                {item.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                  <TouchableOpacity 
                    key={imgIndex} 
                    style={[
                      styles.gridImageContainer,
                      item.image_urls!.length === 3 && imgIndex === 0 && styles.fullWidthImage
                    ]}
                    activeOpacity={0.9}
                    onPress={() => openImageViewer(imageUrl, imgIndex, index)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                    {imgIndex === 3 && item.image_urls!.length > 4 && (
                      <View style={styles.moreImagesOverlay}>
                        <Text style={styles.moreImagesText}>
                          +{item.image_urls!.length - 4}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Display Videos */}
        {item.video_url && item.video_url.length > 0 && (
          <View style={styles.mediaContainer}>
            <Video
              source={{ uri: item.video_url[0] }}
              style={styles.feedVideo}
              controls={true}
              resizeMode="cover"
              posterResizeMode="cover"
            />
            {item.video_url.length > 1 && (
              <View style={styles.moreVideosIndicator}>
                <Text style={styles.moreVideosText}>+{item.video_url.length - 1} more videos</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  // --- Render Main UI ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <FlatList
        data={feedsData.feeds}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewer.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeImageViewer}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Main image */}
          <TouchableWithoutFeedback onPress={closeImageViewer}>
            <View style={styles.imageViewerContainer}>
              {imageViewer.imageUrl && (
                <Image
                  source={{ uri: imageViewer.imageUrl }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableWithoutFeedback>
          
          {/* Navigation arrows - only show if there are multiple images */}
          {feedsData && 
           imageViewer.feedIndex >= 0 && 
           feedsData.feeds[imageViewer.feedIndex]?.image_urls && 
           feedsData.feeds[imageViewer.feedIndex]?.image_urls!.length > 1 && (
            <>
              <TouchableOpacity 
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={showPreviousImage}
              >
                <Icon name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.navButton, styles.navButtonRight]}
                onPress={showNextImage}
              >
                <Icon name="chevron-forward" size={28} color="#fff" />
              </TouchableOpacity>
              
              {/* Image counter */}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {imageViewer.imageIndex + 1}/{feedsData.feeds[imageViewer.feedIndex]?.image_urls!.length}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- Base Container Styles ---
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Lighter background for better contrast
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 80, // Extra space at bottom
  },

  // --- Loading State Styles ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // --- Error State Styles ---
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- Empty State Styles ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- Feed Card Styles ---
  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  feedAuthorPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e8ed',
    marginRight: 12,
  },
  feedHeaderContent: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14171a',
    marginBottom: 3,
  },
  feedDate: {
    fontSize: 13,
    color: '#657786',
  },
  feedDescription: {
    fontSize: 15,
    color: '#14171a',
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  // --- Media Styles ---
  mediaContainer: {
    marginBottom: 8,
  },
  singleImage: {
    width: '100%',
    height: mediaWidth * 0.66,
    borderRadius: 0,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridImageContainer: {
    width: '49.5%',
    height: mediaWidth * 0.33,
    marginBottom: 1,
    overflow: 'hidden',
  },
  fullWidthImage: {
    width: '100%',
    height: mediaWidth * 0.5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedVideo: {
    width: '100%',
    height: videoHeight,
    backgroundColor: '#000',
  },
  moreVideosIndicator: {
    paddingVertical: 6,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
  },
  moreVideosText: {
    fontSize: 12,
    color: '#666',
  },

  // --- Image Viewer Modal Styles ---
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FeedsScreen;