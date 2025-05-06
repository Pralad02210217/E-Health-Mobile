// src/screens/users/StudentHealthVisitsScreen.tsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { format, parseISO } from 'date-fns';

import { useAuthContext } from '../../context/auth-context';
import { fetchStudentTreatmentFn, fetchProgrammesFn } from '../../api/api';


interface Treatment {
    treatmentId: string;
    patientId: string;
    doctorId: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    notes: string;
    leaveNotes?: string;
    createdAt: string;
    departmentId: string;
    patientName: string;
    patientGender: string;
    studentNumber: string;
    patientType: string;
    bloodPressure?: string | null;
    forwardedByHospital?: boolean | null;
    forwardedToHospital?: boolean | null;
}

interface Department {
    programme_id: string;
    programme_name: string;
}

interface FetchTreatmentsResponse {
    treatments: Treatment[];
}

interface FetchProgrammesResponse {
    message: string;
    departments: Department[];
}


const formatVisitDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};

const formatVisitTime = (dateString: string): string => {
     if (!dateString) return 'N/A';
    try {
        return format(parseISO(dateString), 'hh:mm a');
    } catch (e) {
         console.error("Error formatting time:", dateString, e);
        return 'Invalid Time';
    }
};

const getSeverityColor = (severity: Treatment['severity']): string => {
  switch (severity) {
    case 'MILD': return '#28a745';
    case 'MODERATE': return '#ffc107';
    case 'SEVERE': return '#dc3545';
    default: return '#6c757d';
  }
};


const StudentHealthVisitsScreen = () => {
  const { user, isLoading: isAuthLoading } = useAuthContext();

  const [activeTab, setActiveTab] = useState<'filter' | 'search'>('filter');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [searchStudentNumber, setSearchStudentNumber] = useState('');
  const [searchDepartmentId, setSearchDepartmentId] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);


  const {
    data: treatmentsData,
    isLoading: isTreatmentsLoading,
    isError: isTreatmentsError,
    error: treatmentsErrorObject,
  } = useQuery<FetchTreatmentsResponse>({
    queryKey: ['studentTreatments'],
    queryFn: async () => {
      console.log(`Fetching student treatments...`);
      const response = await fetchStudentTreatmentFn();
      console.log('Fetch student treatments response:', response.data);
      return { treatments: Array.isArray(response.data?.treatments) ? response.data.treatments : [] };
    },
    enabled: !!user,
  });

   const {
    data: programmesData,
    isLoading: isProgrammesLoading,
    isError: isProgrammesError,
    error: programmesErrorObject,
  } = useQuery<FetchProgrammesResponse>({
    queryKey: ['programmes'],
    queryFn: async () => {
      const response = await fetchProgrammesFn();
      console.log('Fetch programmes response:', response.data);
      return response.data;
    },
    enabled: true,
    staleTime: Infinity,
  });

   const programmesDepartments = programmesData?.departments || [];

  const departmentsForPicker = useMemo(() => {
      if (!programmesDepartments) return [];
      return [{ programme_id: '', programme_name: 'Select Department' }, ...programmesDepartments];
  }, [programmesDepartments]);


  const filteredTreatments = useMemo(() => {
    if (!treatmentsData?.treatments) return [];

    let treatments = treatmentsData.treatments;

    treatments = treatments.filter((treatment) => {
        const treatmentDate = formatVisitDate(treatment.createdAt);
        const selectedDateFormatted = formatVisitDate(selectedDate.toISOString());
        return treatmentDate === selectedDateFormatted;
    });

    if (activeTab === 'filter') {
       if (user?.department_id) {
         treatments = treatments.filter((treatment) => treatment.departmentId === user.department_id);
       } else {
           treatments = [];
       }
    } else if (activeTab === 'search' && isSearchActive) {
           let searchResults = treatmentsData.treatments;

           searchResults = searchResults.filter((treatment) => {
               const treatmentDate = formatVisitDate(treatment.createdAt);
               const selectedDateFormatted = formatVisitDate(selectedDate.toISOString());
               return treatmentDate === selectedDateFormatted;
           });

           const hasStudentNumberSearch = searchStudentNumber.trim() !== '';
           const hasDepartmentSearch = searchDepartmentId !== '';

           if (hasStudentNumberSearch) {
             searchResults = searchResults.filter((treatment) =>
               treatment.studentNumber?.toLowerCase() === searchStudentNumber.trim().toLowerCase()
             );
           }

           if (hasDepartmentSearch) {
              searchResults = searchResults.filter((treatment) =>
                 treatment.departmentId === searchDepartmentId
              );
           }

           if (isSearchActive && !hasStudentNumberSearch && !hasDepartmentSearch) {
              searchResults = [];
           }

           treatments = searchResults;
    } else if (activeTab === 'search') {
        treatments = [];
    }

    return treatments;
  }, [treatmentsData, selectedDate, activeTab, user, searchStudentNumber, searchDepartmentId, isSearchActive]);


   const onChangeDate = (event: any, selectedDate?: Date) => {
     const currentDate = selectedDate || new Date();
     setShowDatePicker(Platform.OS === 'ios');
     if (selectedDate) {
       setSelectedDate(currentDate);
     }
   };

   const showDatePickerModal = () => {
       setShowDatePicker(true);
   };

    const handleSearch = () => {
        if (searchStudentNumber.trim() === '' && searchDepartmentId === '') {
             Alert.alert('Search Required', 'Please enter a Student Number or select a Department to search.');
            setIsSearchActive(false);
             return;
        }
       setIsSearchActive(true);
    };

    const handleResetSearch = () => {
        setSearchStudentNumber('');
        setSearchDepartmentId('');
        setIsSearchActive(false);
        setSelectedDate(new Date());
    };
    const getSeverityText = (severity: string) => {
      switch (severity.toLowerCase()) {
          case 'mild': return 'No Rest Required';
          case 'moderate': return 'Maybe Rest Required';
          case 'severe': return 'Rest Required';
          default: return severity;
      }
    };

  const isLoading = isAuthLoading || isTreatmentsLoading || isProgrammesLoading;
  const isError = isTreatmentsError || isProgrammesError;


  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

   if (isError) {
        console.error('StudentHealthVisitsScreen: Error:', treatmentsErrorObject || programmesErrorObject);
       return (
           <View style={styles.centeredContainer}>
               <Text style={styles.errorText}>Failed to load data.</Text>
           </View>
       );
   }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.pageTitle}>Student Health Visits</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'filter' && styles.activeTab]}
            onPress={() => setActiveTab('filter')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'filter' && styles.activeTabText]}>
              My Department Visits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
             <Text style={[styles.tabButtonText, activeTab === 'search' && styles.activeTabText]}>
              Other Department Search Visits
            </Text>
          </TouchableOpacity>
        </View>


        <View style={styles.controlsContainer}>
            {activeTab === 'filter' ? (
                 <View style={styles.filterControls}>
                     <View style={styles.datePickerContainer}>
                        <Text style={styles.label}>Select Date:</Text>
                         <TouchableOpacity onPress={showDatePickerModal} style={styles.datePickerButton}>
                            <Ionicons name="calendar-outline" size={20} color="#333" style={styles.datePickerIcon} />
                            <Text style={styles.datePickerText}>{formatVisitDate(selectedDate.toISOString())}</Text>
                         </TouchableOpacity>
                     </View>

                     <Text style={styles.filterInfoText}>
                         Showing visits for {formatVisitDate(selectedDate.toISOString())} from your department.
                     </Text>
                 </View>
            ) : (
                 <View style={styles.searchControls}>
                     <Text style={styles.label}>Search by:</Text>
                     <TextInput
                        style={styles.searchInput}
                        placeholder="Student Number"
                        value={searchStudentNumber}
                        onChangeText={setSearchStudentNumber}
                        keyboardType="number-pad"
                        autoCapitalize="none"
                     />

                     {/* <View style={styles.pickerContainer}>
                          <Picker
                             selectedValue={searchDepartmentId}
                             onValueChange={(itemValue) => setSearchDepartmentId(itemValue)}
                             style={styles.picker}
                          >
                             {departmentsForPicker.map((dept) => (
                                 <Picker.Item key={dept.programme_id} label={dept.programme_name} value={dept.programme_id} />
                             ))}
                          </Picker>
                     </View> */}

                     <View style={styles.datePickerContainer}>
                        <Text style={styles.label}>Visit Date:</Text>
                         <TouchableOpacity onPress={showDatePickerModal} style={styles.datePickerButton}>
                            <Ionicons name="calendar-outline" size={20} color="#333" style={styles.datePickerIcon} />
                            <Text style={styles.datePickerText}>{formatVisitDate(selectedDate.toISOString())}</Text>
                         </TouchableOpacity>
                     </View>


                     <View style={styles.searchButtonRow}>
                          {isSearchActive && (
                              <TouchableOpacity style={styles.resetButton} onPress={handleResetSearch}>
                                  <Text style={styles.buttonText}>Reset Search</Text>
                              </TouchableOpacity>
                          )}
                         <TouchableOpacity
                             style={[styles.searchButton, (!searchStudentNumber.trim() && searchDepartmentId === '' && !isSearchActive) && styles.buttonDisabled]}
                             onPress={handleSearch}
                             disabled={!searchStudentNumber.trim() && searchDepartmentId === '' && !isSearchActive}
                         >
                             <Text style={styles.buttonText}>Search</Text>
                         </TouchableOpacity>
                     </View>
                 </View>
            )}

            {showDatePicker && (
                 <DateTimePicker
                     testID="dateTimePicker"
                     value={selectedDate}
                     mode="date"
                     is24Hour={false}
                     onChange={onChangeDate}
                     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                 />
            )}

        </View>


         {filteredTreatments!.length > 0 ? (
             <FlatList
               data={filteredTreatments}
               keyExtractor={(item) => item.treatmentId}
               renderItem={({ item }) => (
                 <View style={styles.treatmentItemCard}>
                    <View style={styles.itemRow}>
                       <View style={styles.flexShrink}>
                            <Text style={styles.itemLabel}>Student:</Text>
                            <Text style={styles.itemValueText}>{item.patientName} ({item.studentNumber})</Text>
                       </View>
                       <View style={styles.severityBadge}>
                           <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
                               {getSeverityText(item.severity)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.itemRow}>
                        <View style={styles.itemDateTime}>
                             <Text style={styles.itemLabel}>Date:</Text>
                             <Text style={styles.itemValueText}>{formatVisitDate(item.createdAt)}</Text>
                        </View>
                        <View style={styles.itemDateTime}>
                             <Text style={styles.itemLabel}>Time:</Text>
                             <Text style={styles.itemValueText}>{formatVisitTime(item.createdAt)}</Text>
                        </View>
                    </View>
                        {item.severity !== 'MILD' && (
                          <View style={styles.itemDateTime}>
                            <Text style={styles.itemLabel}>{item.leaveNotes}</Text>
                          </View>
                        )}
                 </View>
               )}
               contentContainerStyle={styles.listContentContainer}
             />
         ) : (
             <View style={styles.emptyContainer}>
                <Text>😕 </Text>
                 <Text style={styles.emptyText}>No visits found for the selected criteria.</Text>

                 {activeTab === "filter" && (
                      <TouchableOpacity
                          style={styles.emptyStateButton}
                          onPress={() => setSelectedDate(new Date())}
                      >
                          <Text style={styles.emptyStateButtonText}>Reset Date</Text>
                      </TouchableOpacity>
                   )}
                  {activeTab === "search" && isSearchActive && (
                     <TouchableOpacity
                          style={styles.emptyStateButton}
                          onPress={handleResetSearch}
                       >
                         <Text style={styles.emptyStateButtonText}>Reset Search Filters</Text>
                     </TouchableOpacity>
                  )}
             </View>
         )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
  },
   emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 200,
    },
    emptyText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    emptyStateButton: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#e9ecef',
        borderRadius: 5,
    },
     emptyStateButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },

  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007bff',
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
   activeTabText: {
       color: '#fff',
   },

  controlsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
   label: {
       fontSize: 13,
       fontWeight: 'bold',
       color: '#555',
       marginBottom: 5,
   },

   filterControls: {
   },

   searchControls: {
   },
    searchInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#fff',
        marginBottom: 10,
    },
     pickerContainer: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '#fff',
         marginBottom: 10,
     },
     picker: {
         height: 40,
         width: '100%',
     },
     searchButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
     },
      searchButton: {
          flex: 1,
          backgroundColor: '#007bff',
          paddingVertical: 10,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
           marginRight: 5,
      },
       resetButton: {
           flex: 1,
           backgroundColor: '#6c757d',
           paddingVertical: 10,
           borderRadius: 5,
           alignItems: 'center',
           justifyContent: 'center',
            marginLeft: 5,
       },
       buttonDisabled: {
           backgroundColor: '#a0a0a0',
       },
       buttonText: {
         color: 'white',
         fontSize: 16,
         fontWeight: 'bold',
       },


   datePickerContainer: {
       marginBottom: 10,
   },
    datePickerButton: {
       flexDirection: 'row',
       alignItems: 'center',
       borderColor: '#ccc',
       borderWidth: 1,
       borderRadius: 5,
       paddingHorizontal: 10,
       paddingVertical: 8,
       backgroundColor: '#fff',
    },
     datePickerIcon: {
         marginRight: 8,
     },
     datePickerText: {
         fontSize: 15,
         color: '#333',
     },
    filterInfoText: {
        fontSize: 13,
        color: '#555',
        marginTop: 5,
        textAlign: 'center',
    },


   listContentContainer: {
       paddingBottom: 20,
   },
   treatmentItemCard: {
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
   },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
     itemLabel: {
         fontSize: 12,
         fontWeight: 'bold',
         color: '#666',
         marginRight: 5,
     },
      itemValueText: {
          fontSize: 15,
          color: '#333',
      },
      itemDateTime: {
          flexDirection: 'row',
          alignItems: 'center',
      },
      flexShrink: {
          flexShrink: 1,
      },
      severityBadge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
      },
       severityText: {
           fontSize: 13,
           fontWeight: 'bold',
       },
});

export default StudentHealthVisitsScreen;
