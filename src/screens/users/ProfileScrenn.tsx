// src/screens/users/ProfileScreen.tsx

import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  TextInput, 
  ScrollView, 
  Alert,
  StatusBar,
  Image
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Picker } from '@react-native-picker/picker';

import { useAuthContext } from '../../context/auth-context';
import { fetchProgrammesFn, updateUserProfileFn } from '../../api/api';


interface Department {
    programme_id: string;
    programme_name: string;
}

interface FetchProgrammesResponse {
    message: string;
    departments: Department[];
}

interface UpdateProfilePayload {
    name: string;
    gender: "MALE" | "FEMALE" | "OTHERS";
    blood_type?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-" | undefined;
    contact_number: string;
}

const profileFormSchema = z.object({
    blood_type: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-","Unknown"]).optional(),
    contact_number: z.string().trim().min(8, "Invalid contact number").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const PICKER_BLOOD_TYPES = [...BLOOD_TYPES, 'Unknown'];


const ProfileScreen = () => {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuthContext();

  const {
    data: departmentsData,
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
    error: departmentsErrorObject,
  } = useQuery<FetchProgrammesResponse>({
    queryKey: ['departments'],
    queryFn: async () => {
      console.log(`Fetching departments...`);
      const response = await fetchProgrammesFn();
      console.log('Fetch departments response:', response.data);
      return response.data;
    },
    enabled: true,
    staleTime: Infinity,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      blood_type: user?.blood_type as z.infer<typeof profileFormSchema>['blood_type'] || 'Unknown',
      contact_number: user?.contact_number || '',
    },
    mode: 'onBlur',
  });

  const { control, handleSubmit, formState, reset } = form;
  const { errors } = formState;

  useEffect(() => {
    if (user) {
      reset({
        blood_type: user.blood_type as z.infer<typeof profileFormSchema>['blood_type'] || 'Unknown',
        contact_number: user.contact_number || '',
      });
    }
  }, [user, reset]);

  const {
    mutate: updateProfileMutation,
    isPending: isUpdatingProfile,
    isError: isUpdateError,
    error: updateErrorObject,
    isSuccess: isUpdateSuccess,
  } = useMutation({
    mutationFn: async (data: UpdateProfilePayload) => {
      const response = await updateUserProfileFn(data);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      Alert.alert('Success', response?.message || 'Profile updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.message || error.response?.data?.message || 'Failed to update profile.';
      Alert.alert('Update Failed', errorMessage);
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {

     if (!user?.id) {
         Alert.alert("Error", "User information missing. Cannot update profile.");
         return;
     }

     const payload: UpdateProfilePayload = {
         name: user.name,
         gender: user.gender as "MALE" | "FEMALE" | "OTHERS",
         blood_type: values.blood_type !== 'Unknown' ? values.blood_type : undefined,
         contact_number: values.contact_number!,
     };

     const cleanPayload = Object.fromEntries(
         Object.entries(payload).filter(([_, value]) => value !== undefined)
     ) as UpdateProfilePayload;

     updateProfileMutation(cleanPayload);
  };

  const getDepartmentName = (departmentId: string | null | undefined): string => {
      // Debug the department ID
      
      if (!departmentId) {
          return 'No Department Assigned';
      }
      
      if (!departmentsData?.departments || departmentsData.departments.length === 0) {
          return 'Department Data Unavailable';
      }
      
      // Log all departments for debugging
      
      const department = departmentsData.departments.find(dep => 
          dep.programme_id === departmentId || dep.programme_id.toLowerCase() === departmentId.toLowerCase()
      );
      
      if (department) {
          return department.programme_name;
      } else {
          // If department not found by exact match, try to find a similar one (in case of case sensitivity issues)
          const closestDepartment = departmentsData.departments.find(dep => 
              dep.programme_id.toLowerCase().includes(departmentId.toLowerCase()) || 
              departmentId.toLowerCase().includes(dep.programme_id.toLowerCase())
          );
          
          return closestDepartment ? closestDepartment.programme_name : 'Department Not Found';
      }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isAuthLoading || isDepartmentsLoading) {
      return (
          <View style={styles.loadingContainer}>
              <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>
                {isAuthLoading ? 'Loading your profile...' : 'Loading departments...'}
              </Text>
          </View>
      );
  }

   if (isDepartmentsError) {
       return (
           <View style={styles.errorContainer}>
               <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
               <Image 
                 source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6195/6195679.png' }} 
                 style={styles.errorIcon}
               />
               <Text style={styles.errorText}>Failed to load department data.</Text>
               <TouchableOpacity 
                 style={styles.retryButton}
                 onPress={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
               >
                 <Text style={styles.retryButtonText}>Retry</Text>
               </TouchableOpacity>
           </View>
       );
   }

   if (!user) {
       return (
           <View style={styles.errorContainer}>
               <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
               <Image 
                 source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2748/2748558.png' }} 
                 style={styles.errorIcon}
               />
               <Text style={styles.errorText}>User data not available.</Text>
           </View>
       );
   }

  
  // Log department info at render time
  const departmentName = getDepartmentName(user.department_id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileDepartment}>{departmentName}</Text>
        </View>

        {/* Profile Info Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{user.gender}</Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Blood Type</Text>
              <Controller
                control={control}
                name="blood_type"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.inputContainer, errors.blood_type && styles.inputError]}>
                    <Picker
                      selectedValue={value}
                      onValueChange={(itemValue) => onChange(itemValue)}
                      style={styles.picker}
                      dropdownIconColor="#6366f1"
                    >
                      {PICKER_BLOOD_TYPES.map((type) => (
                        <Picker.Item key={type} label={type} value={type === 'Unknown' ? 'Unknown' : type} />
                      ))}
                    </Picker>
                  </View>
                )}
              />
              {errors.blood_type && <Text style={styles.validationErrorText}>{errors.blood_type.message}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <Controller
                control={control}
                name="contact_number"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputContainer, errors.contact_number && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter contact number"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                )}
              />
              {errors.contact_number && <Text style={styles.validationErrorText}>{errors.contact_number.message}</Text>}
            </View>
          </View>
        </View>

        {/* Department Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Department Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{departmentName}</Text>
            </View>
            <Text style={styles.departmentId}>ID: {user.department_id || 'Not assigned'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isUpdatingProfile && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isUpdatingProfile}
          activeOpacity={0.8}
        >
          {isUpdatingProfile ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {isUpdateSuccess && (
          <Text style={styles.successText}>Profile updated successfully!</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4b5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileDepartment: {
    fontSize: 16,
    color: '#6b7280',
  },
  
  // Cards and Sections
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  valueContainer: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  valueText: {
    fontSize: 16,
    color: '#111827',
  },
  departmentId: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    paddingLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  validationErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    paddingLeft: 4,
  },
  picker: {
    height: 48,
    width: '100%',
    color: '#111827',
  },
  
  // Button Styles
  saveButton: {
    marginTop: 30,
    marginHorizontal: 16,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#c7d2fe',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successText: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;