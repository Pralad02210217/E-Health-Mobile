// src/screens/HomeScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  BackHandler, 
  FlatList, 
  Alert, 
  ScrollView,
  RefreshControl,
  Image
} from 'react-native';
import Modal from 'react-native-modal';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '../../context/auth-context';
import { useNavigation } from '@react-navigation/native';
import API from '../../lib/axios';
import LinearGradient from 'react-native-linear-gradient';

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Medicine {
    medicineId: string;
    medicineName: string;
    medicineCount: number;
}

interface Illness {
    illnessId: string;
    illnessName: string;
    illnessType: string;
    illnessDescription: string;
}

interface Treatment {
    treatmentId: string;
    patientId: string;
    familyMemberId: string | null;
    doctorId: string | null;
    severity: "MILD" | "MODERATE" | "SEVERE";
    notes: string;
    bloodPressure: string | null; 
    forwardedToHospital: boolean;
    forwardedByHospital: boolean;
    createdAt: string;
    patientName: string;
    patientGender: string;
    patientBloodType: string;
    patientContactNumber: string;
    patientDateOfBirth: string;
    patientType: string;
    medicines: Medicine[] | null;
    illnesses: Illness[] | null;
    medicinesUsedCount: string;
}

interface FetchTreatmentsResponse {
    treatments: Treatment[];
}

const formatDate = (dateString: any) => {
  if (!dateString) return "";
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
          return "Invalid Date";
      }
      return date.toLocaleDateString("en-GB");
  } catch (e) {
      return "Error";
  }
};

const formatDateTime = (dateString: any) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        return date.toLocaleDateString("en-GB", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return "Error";
    }
};

const getSeverityColor = (severity: string) => {
  switch(severity) {
    case 'SEVERE':
      return { bg: '#ffebee', text: '#d32f2f', icon: 'alert-circle' };
    case 'MODERATE':
      return { bg: '#fff8e1', text: '#ff8f00', icon: 'alert' };
    case 'MILD':
      return { bg: '#e8f5e9', text: '#2e7d32', icon: 'information' };
    default:
      return { bg: '#e8f5e9', text: '#2e7d32', icon: 'information' };
  }
};

const EmptyStateComponent = () => (
  <View style={styles.emptyContainer}>
    <Image 
      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3588/3588455.png' }} 
      style={styles.emptyImage}
    />
    <Text style={styles.emptyTitle}>No Treatment Records</Text>
    <Text style={styles.emptyText}>Your medical history will appear here once you've received treatment.</Text>
  </View>
);

const ListSkeleton = () => (
  <>
    {[1, 2, 3].map((item) => (
      <View 
        key={item}
        style={[styles.treatmentCard, styles.skeletonCard]}
      >
        <View style={styles.skeletonDate} />
        <View style={styles.skeletonSeverity} />
        <View style={styles.skeletonText} />
        <View style={styles.skeletonText} />
        <View style={[styles.skeletonText, { width: '60%' }]} />
      </View>
    ))}
  </>
);

const HomeScreen = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuthContext();
  const navigation = useNavigation();
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: treatmentsData,
    isLoading: isTreatmentsLoading,
    isError: isTreatmentsError,
    error: treatmentsErrorObject,
    refetch: refetchTreatments,
  } = useQuery<FetchTreatmentsResponse>({
    queryKey: ['treatments', user?.id],
    queryFn: async () => {
      const response = await API.get(`/treatment/patient/${user?.id}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTreatments();
    setRefreshing(false);
  }, [refetchTreatments]);

  useEffect(() => {
    if (!user && !isAuthLoading) {
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'Login' }],
      // });
    }
  }, [user, isAuthLoading, navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (user) {
          Alert.alert("Exit App", "Do you want to exit?", [
            { text: "Cancel", onPress: () => null, style: "cancel" },
            { text: "YES", onPress: () => BackHandler.exitApp() }
          ]);
          return true;
        }
        return false;
      }
    );
    return () => backHandler.remove();
  }, [user]);

  const DetailItem = ({ label, value, icon }: { label: string; value?: string | null; icon?: string }) => (
    value ? (
      <View style={styles.detailItem}>
        {icon && <MaterialCommunityIcons name={icon as any} size={18} color="#666" style={styles.detailIcon} />}
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    ) : null
  );

  const renderTreatmentDetailsModal = () => (
    <Modal
      isVisible={!!selectedTreatment}
      onBackdropPress={() => setSelectedTreatment(null)}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionOutTiming={0}
      style={styles.modal}
      propagateSwipe={true}
    >
      <View style={styles.modalContent}>
        {selectedTreatment && (
          <>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons 
                name={getSeverityColor(selectedTreatment.severity).icon as any}
                size={24}
                color={getSeverityColor(selectedTreatment.severity).text}
                style={styles.modalHeaderIcon}
              />
              <Text style={styles.modalTitle}>Treatment Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedTreatment(null)}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <Ionicons name="person" size={18} color="#444" style={styles.sectionIcon} />
                  Patient Information
                </Text>
                <DetailItem label="Name" value={selectedTreatment.patientName} icon="account" />
                <DetailItem label="Gender" value={selectedTreatment.patientGender} icon="gender-male-female" />
                <DetailItem label="Blood Type" value={selectedTreatment.patientBloodType} icon="blood-bag" />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  <Ionicons name="medkit" size={18} color="#444" style={styles.sectionIcon} />
                  Treatment Information
                </Text>
                <DetailItem label="Date" value={formatDateTime(selectedTreatment.createdAt)} icon="calendar" />
                <View style={[
                  styles.severityBadge, 
                  { backgroundColor: getSeverityColor(selectedTreatment.severity).bg }
                ]}>
                  <MaterialCommunityIcons 
                    name={getSeverityColor(selectedTreatment.severity).icon as any} 
                    size={18} 
                    color={getSeverityColor(selectedTreatment.severity).text} 
                  />
                  <Text style={[
                    styles.severityBadgeText,
                    { color: getSeverityColor(selectedTreatment.severity).text }
                  ]}>
                    {selectedTreatment.severity}
                  </Text>
                </View>
                
                <DetailItem label="Blood Pressure" value={selectedTreatment.bloodPressure} icon="heart-pulse" />
                
                {(selectedTreatment.forwardedToHospital || selectedTreatment.forwardedByHospital) && (
                  <View style={styles.hospitalStatusContainer}>
                    {selectedTreatment.forwardedToHospital && (
                      <View style={styles.hospitalStatusBadge}>
                        <FontAwesome5 name="hospital" size={14} color="#1976d2" />
                        <Text style={styles.hospitalStatusText}>Forwarded to Hospital</Text>
                      </View>
                    )}
                    {selectedTreatment.forwardedByHospital && (
                      <View style={styles.hospitalStatusBadge}>
                        <FontAwesome5 name="hospital-user" size={14} color="#7b1fa2" />
                        <Text style={[styles.hospitalStatusText, {color: '#7b1fa2'}]}>Forwarded by Hospital</Text>
                      </View>
                    )}
                  </View>
                )}
                
                {selectedTreatment.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{selectedTreatment.notes}</Text>
                  </View>
                )}
              </View>

              {selectedTreatment.illnesses && selectedTreatment.illnesses.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    <FontAwesome5 name="disease" size={18} color="#444" style={styles.sectionIcon} />
                    Diagnosed Illnesses
                  </Text>
                  {selectedTreatment.illnesses.map((illness) => (
                    <View key={illness.illnessId} style={styles.listItem}>
                      <View style={styles.listItemHeader}>
                        <MaterialCommunityIcons name="virus" size={16} color="#d32f2f" style={styles.listItemIcon} />
                        <Text style={styles.listItemText}>{illness.illnessName}</Text>
                      </View>
                      <View style={styles.listItemDetail}>
                        <Text style={styles.listItemSubText}>
                          <Text style={styles.listItemSubLabel}>Type:</Text> {illness.illnessType}
                        </Text>
                        {illness.illnessDescription && (
                          <Text style={styles.listItemSubText}>{illness.illnessDescription}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {selectedTreatment.medicines && selectedTreatment.medicines.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    <MaterialCommunityIcons name="pill" size={18} color="#444" style={styles.sectionIcon} />
                    Prescribed Medicines
                  </Text>
                  {selectedTreatment.medicines.map((medicine) => (
                    <View key={medicine.medicineId} style={styles.medicineItem}>
                      <View style={styles.medicineItemHeader}>
                        <MaterialCommunityIcons name="medical-bag" size={16} color="#388e3c" style={styles.medicineItemIcon} />
                        <Text style={styles.medicineItemName}>{medicine.medicineName}</Text>
                      </View>
                      <View style={styles.medicineItemQuantity}>
                        <Text style={styles.medicineItemCount}>x{medicine.medicineCount}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTreatment(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );

  const renderTreatmentItem = ({ item }: { item: Treatment }) => {
    const severityInfo = getSeverityColor(item.severity);
    
    return (
      <View
        style={[styles.treatmentCard, { borderLeftColor: severityInfo.text, borderLeftWidth: 4 }]}
      >
        <TouchableOpacity 
          onPress={() => {
            setSelectedTreatment(item);
          }}
          style={styles.treatmentCardContent}
        >
          <View style={styles.treatmentCardHeader}>
            <Text style={styles.treatmentCardDate}>
              <Ionicons name="calendar" size={14} color="#888" /> {formatDateTime(item.createdAt)}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: severityInfo.bg }]}>
              <MaterialCommunityIcons name={severityInfo.icon as any} size={14} color={severityInfo.text} />
              <Text style={[styles.severityBadgeText, { color: severityInfo.text }]}>{item.severity}</Text>
            </View>
          </View>
          
          {item.notes && (
            <View style={styles.treatmentCardNotesContainer}>
              <Text style={styles.treatmentCardNotes}>{item.notes}</Text>
            </View>
          )}
          
          {item.bloodPressure && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="heart-pulse" size={16} color="#555" />
              <Text style={styles.treatmentCardDetail}>BP: {item.bloodPressure}</Text>
            </View>
          )}
          
          {(item.forwardedToHospital || item.forwardedByHospital) && (
            <View style={styles.hospitalInfoContainer}>
              {item.forwardedToHospital && (
                <View style={styles.infoChip}>
                  <FontAwesome5 name="hospital" size={12} color="#1976d2" />
                  <Text style={styles.infoChipText}>To Hospital</Text>
                </View>
              )}
              {item.forwardedByHospital && (
                <View style={styles.infoChip}>
                  <FontAwesome5 name="hospital-user" size={12} color="#7b1fa2" />
                  <Text style={[styles.infoChipText, {color: '#7b1fa2'}]}>From Hospital</Text>
                </View>
              )}
            </View>
          )}

          {item.illnesses && item.illnesses.length > 0 && (
            <View style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <FontAwesome5 name="disease" size={14} color="#d32f2f" />
                <Text style={styles.cardSectionTitle}>Illnesses</Text>
              </View>
              <View style={styles.cardSectionContent}>
                {item.illnesses.slice(0, 3).map((illness, index) => (
                  <Text key={illness.illnessId || index} style={styles.cardSectionItemText}>
                    • {illness.illnessName} 
                    <Text style={styles.cardItemType}>({illness.illnessType})</Text>
                  </Text>
                ))}
                {item.illnesses.length > 3 && (
                  <Text style={styles.moreItemsText}>+{item.illnesses.length - 3} more</Text>
                )}
              </View>
            </View>
          )}

          {item.medicines && item.medicines.length > 0 && (
            <View style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <MaterialCommunityIcons name="pill" size={14} color="#388e3c" />
                <Text style={styles.cardSectionTitle}>Medicines</Text>
              </View>
              <View style={styles.cardSectionContent}>
                {item.medicines.slice(0, 3).map((medicine, index) => (
                  <Text key={medicine.medicineId || index} style={styles.cardSectionItemText}>
                    • {medicine.medicineName}
                  </Text>
                ))}
                {item.medicines.length > 3 && (
                  <Text style={styles.moreItemsText}>+{item.medicines.length - 3} more</Text>
                )}
              </View>
            </View>
          )}
          
          <View style={styles.viewDetailsContainer}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Auth State...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#e3f2fd', '#f5f5f5']} 
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.pageTitle}>Your Treatment History</Text>
          <MaterialCommunityIcons name="clipboard-pulse" size={28} color="#2196F3" />
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        {isTreatmentsLoading ? (
          <ListSkeleton />
        ) : isTreatmentsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#dc3545" />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>Failed to load your treatment records.</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => refetchTreatments()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !treatmentsData || !Array.isArray(treatmentsData.treatments) || treatmentsData.treatments.length === 0 ? (
          <EmptyStateComponent />
        ) : (
          <FlatList
            data={treatmentsData.treatments}
            keyExtractor={(item) => item.treatmentId}
            renderItem={renderTreatmentItem}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
                tintColor="#2196F3"
              />
            }
          />
        )}

        {renderTreatmentDetailsModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Inter',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  treatmentCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  treatmentCardContent: {
    padding: 16,
  },
  treatmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treatmentCardDate: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  treatmentCardNotesContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  treatmentCardNotes: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentCardDetail: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
    fontFamily: 'Inter',
  },
  hospitalInfoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  infoChipText: {
    fontSize: 12,
    color: '#1976d2',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  cardSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    color: '#333',
    fontFamily: 'Inter',
  },
  cardSectionContent: {
    paddingLeft: 4,
  },
  cardSectionItemText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  cardItemType: {
    fontSize: 12,
    color: '#777',
    fontFamily: 'Inter',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
    fontStyle: 'italic',
    fontFamily: 'Inter',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.6,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 0,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderIcon: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    fontFamily: 'Inter',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
    fontFamily: 'Inter',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    width: 100,
    fontFamily: 'Inter',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontFamily: 'Inter',
  },
  hospitalStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 16,
  },
  hospitalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  hospitalStatusText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  notesContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  listItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemIcon: {
    marginRight: 8,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Inter',
  },
  listItemDetail: {
    paddingLeft: 24,
  },
  listItemSubText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  listItemSubLabel: {
    fontWeight: '500',
    color: '#555',
  },
  medicineItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicineItemIcon: {
    marginRight: 8,
  },
  medicineItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Inter',
  },
  medicineItemQuantity: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medicineItemCount: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Inter',
  },
  skeletonCard: {
    backgroundColor: '#f0f0f0',
    height: 220,
  },
  skeletonDate: {
    width: '40%',
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonSeverity: {
    width: '20%',
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  skeletonText: {
    width: '100%',
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  }
});
export default HomeScreen; // Add this at the end of the file