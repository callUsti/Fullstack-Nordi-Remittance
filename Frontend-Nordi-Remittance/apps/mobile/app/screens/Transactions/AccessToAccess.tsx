import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import AccountCard from '@/components/AccountCard';
import { useRouter } from 'expo-router';
import ConvertFx from './ConvertFx';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

const AccessToAccess = () => {
  const theme = useMobileTheme();
  const styles = createStyles(theme);
  const [activeTab, setActiveTab] = useState('accessAccount');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const router = useRouter();

  const handleTabSwitch = (tab: React.SetStateAction<string>) => setActiveTab(tab);

  const validateForm = () => {
    if (accountNumber.length === 10 && accountName && amount && description) {
      setIsButtonEnabled(true);
    } else {
      setIsButtonEnabled(false);
    }
  };

  const handleAccountNumberChange = (value: string) => {
    if (value.length <= 10) {
      setAccountNumber(value);
      validateForm();
    }
  };

  const handleInputChange = (setter: any) => (value: any) => {
    setter(value);
    validateForm();
  };

  return (
    <View style={styles.container}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Access Transfers</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'accessAccount' && styles.activeTab]} onPress={() => handleTabSwitch('accessAccount')}>
          <Text style={styles.tabText}>Access Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'convertFx' && styles.activeTab]} onPress={() => handleTabSwitch('convertFx')}>
          <Text style={styles.tabText}>Convert FX</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content with Keyboard Avoidance */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'accessAccount' && (
            <>
              <AccountCard />

              <View style={styles.progressContainer}>
                <Text style={styles.limitText}>Daily Transaction Limit:</Text>
                <TouchableOpacity>
                  <Text style={styles.upgradeText}>Upgrade Now</Text>
                </TouchableOpacity>
              </View>

              <Progress.Bar progress={0.5} width={null} color={theme.primary} style={styles.progressBar} />

              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>Amount Used: $5,000</Text>
                <Text style={styles.amountText}>Amount Remaining: $5,000</Text>
              </View>

              {/* Beneficiaries Section */}
              <View style={styles.beneficiaryContainer}>
                <Text style={styles.beneficiaryText}>Frequent Beneficiaries</Text>
                <TouchableOpacity>
                  <Text style={styles.findText}>Find Beneficiaries</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <FontAwesome name="search" size={20} color={theme.iconMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="No frequent beneficiaries" placeholderTextColor={theme.textMuted} />
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <FontAwesome name="bank" size={20} color={theme.iconMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Account Number" placeholderTextColor={theme.textMuted} keyboardType="numeric" value={accountNumber} onChangeText={handleAccountNumberChange} />
                </View>
                <View style={styles.inputContainer}>
                  <FontAwesome name="user" size={20} color={theme.iconMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Account Name" placeholderTextColor={theme.textMuted} value={accountName} onChangeText={handleInputChange(setAccountName)} />
                </View>
                <View style={styles.inputContainer}>
                  <FontAwesome name="money" size={20} color={theme.iconMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={theme.textMuted} keyboardType="numeric" value={amount} onChangeText={handleInputChange(setAmount)} />
                </View>
                <View style={styles.inputContainer}>
                  <FontAwesome name="pencil" size={20} color={theme.iconMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Transfer Description" placeholderTextColor={theme.textMuted} value={description} onChangeText={handleInputChange(setDescription)} />
                </View>
              </View>
            </>
          )}

          {activeTab === 'convertFx' && (
            <View style={styles.convertFxContainer}>
              <Text style={styles.sectionTitle}>Convert FX</Text>
              {/* Add relevant FX form fields here */}
              <ConvertFx />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Proceed Button */}
      {activeTab === 'accessAccount' && (
        <View style={styles.proceedButtonContainer}>
          <TouchableOpacity style={[styles.proceedButton, { backgroundColor: isButtonEnabled ? '#2563eb' : '#9ca3af' }]} disabled={!isButtonEnabled}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AccessToAccess;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  appBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingVertical: 15, paddingHorizontal: 20, marginTop: 40 },
  appBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  tabButton: { paddingVertical: 15, width: '50%', alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.primary },
  tabText: { fontSize: 16, color: theme.text },
  scrollViewContent: { paddingBottom: 20 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.surface },
  limitText: { color: theme.text, fontSize: 14 },
  upgradeText: { color: theme.primary, fontSize: 14 },
  progressBar: { marginHorizontal: 20, marginBottom: 10 }, 
  amountContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 }, 
  amountText: { color: theme.text },
  beneficiaryContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.surface }, beneficiaryText: { color: theme.text },
  findText: { color: theme.primary },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, marginHorizontal: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 12, backgroundColor: theme.surface },
  inputIcon: { marginRight: 10 }, input: { flex: 1, fontSize: 16, color: theme.text },
  formContainer: { marginTop: 20 }, 
  convertFxContainer: { padding: 20 }, 
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.text },
  fxText: { fontSize: 16, color: theme.textMuted },
  proceedButtonContainer: { padding: 20, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  proceedButton: { paddingVertical: 15, borderRadius: 8, alignItems: 'center' }, 
  proceedButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
