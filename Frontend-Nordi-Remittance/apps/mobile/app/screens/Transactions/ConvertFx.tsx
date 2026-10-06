import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // For currency dropdown
import { LinearGradient } from 'expo-linear-gradient';
import AccountCard from '@/components/AccountCard';
import { CURRENCY_CONVERSION_API_KEY } from '@env';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

const ConvertFx = () => {
  const theme = useMobileTheme();
  const styles = createStyles(theme);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [conversionRates, setConversionRates] = useState<{ [key: string]: number }>({});
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [rateChange, setRateChange] = useState('neutral'); // green or red based on gains/losses
  const [isReversed, setIsReversed] = useState(false);

  // Fetch conversion rates using the API
  const fetchConversionRates = async () => {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${CURRENCY_CONVERSION_API_KEY}/latest/${fromCurrency}`);
    const data = await response.json();
    setConversionRates(data.conversion_rates); // Contains all conversion rates
    setLastUpdate(data.time_last_update_utc); // Set last update time
    setConversionRate(data.conversion_rates[toCurrency]);
  };

  useEffect(() => {
    fetchConversionRates();
  }, [fromCurrency, toCurrency]);

  // Handle amount change and calculate conversion
  const handleAmountChange = (value: any) => {
    setAmount(value);
    if (conversionRate !== null) {
      const converted = (parseFloat(value) * conversionRate).toFixed(2);
      setConvertedAmount(converted);
    } else {
      setConvertedAmount('');
    }
  };

  // Reverse "From" and "To" currencies
  const reverseCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setIsReversed(!isReversed);
  };

  // Handle currency changes and calculate the gain/loss indicator
  const handleCurrencyChange = (newToCurrency: string) => {
    const previousRate = conversionRates[toCurrency];
    const newRate = conversionRates[newToCurrency];
    setToCurrency(newToCurrency);

    if (newRate > previousRate) {
      setRateChange('green'); // Gain
    } else if (newRate < previousRate) {
      setRateChange('red'); // Loss
    } else {
      setRateChange('neutral'); 
    }

    setConversionRate(newRate);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            <Ionicons name="information-circle-outline" size={16} color={theme.primary} /> Enter the amount to convert and select your currencies.
          </Text>
        </View>

        {/* Domiciliary Account Card */}
        <LinearGradient colors={['#0f172a', '#0284c7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.domiciliaryCard}>
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>Domiciliary Account</Text>
            <Text style={styles.cardSubText}>Balance: $10,000</Text>
            <Text style={styles.cardSubText}>Currency: USD</Text>
          </View>
        </LinearGradient>

        <AccountCard />

        {/* Currency Selection */}
        <View style={styles.currencySelectorContainer}>
          {/* From Currency */}
          <View style={styles.currencyPicker}>
            <Text style={styles.label}>From Currency</Text>
            <Picker selectedValue={fromCurrency} onValueChange={itemValue => setFromCurrency(itemValue)} style={styles.picker} itemStyle={{ color: theme.text }}>
              {Object.keys(conversionRates).map(currency => (
                <Picker.Item key={currency} label={currency} value={currency} />
              ))}
            </Picker>
          </View>

          {/* Reversal Button */}
          <TouchableOpacity onPress={reverseCurrencies} style={styles.reverseIconContainer}>
            <MaterialIcons name="swap-horiz" size={32} color={theme.primary} />
          </TouchableOpacity>

          {/* To Currency */}
          <View style={styles.currencyPicker}>
            <Text style={styles.label}>To Currency</Text>
            <Picker selectedValue={toCurrency} onValueChange={handleCurrencyChange} style={styles.picker} itemStyle={{ color: theme.text }}>
              {Object.keys(conversionRates).map(currency => (
                <Picker.Item key={currency} label={currency} value={currency} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount</Text>
          <TextInput style={styles.input} value={amount} onChangeText={handleAmountChange} placeholder="Enter amount" placeholderTextColor={theme.textMuted} keyboardType="numeric" />
        </View>

        {/* Converted Amount */}
        <View style={styles.convertedAmountContainer}>
          <Text style={styles.convertedText}>
            {amount} {fromCurrency} = {convertedAmount} {toCurrency}
          </Text>
        </View>

        {/* Conversion Rate */}
        <View style={styles.conversionRateContainer}>
          <Text style={styles.conversionRateText}>
            1 {fromCurrency} = {conversionRate} {toCurrency}
          </Text>
          <Text style={rateChange === 'green' ? styles.greenRate : rateChange === 'red' ? styles.redRate : styles.neutralRate}>
            {rateChange === 'green' ? '↑' : rateChange === 'red' ? '↓' : '↔'}
          </Text>
        </View>

        {/* Last Update Time */}
        <Text style={styles.lastUpdateText}>Last updated: {lastUpdate}</Text>

        {/* Transfer Button */}
        <TouchableOpacity style={[styles.transferButton, { backgroundColor: amount ? theme.primary : theme.iconMuted }]} disabled={!amount}>
          <Text style={styles.transferButtonText}>Transfer</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ConvertFx;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  container: { padding: 16, backgroundColor: theme.background },
  instructionsContainer: { backgroundColor: theme.primarySoft, padding: 10, borderRadius: 8, marginBottom: 20 },
  instructionsText: { fontSize: 14, color: theme.primary },
  domiciliaryCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  cardContent: { flexDirection: 'column', alignItems: 'flex-start' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  cardSubText: { fontSize: 14, color: '#f1f5f9', marginTop: 8 },
  currencySelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  currencyPicker: { flex: 1 },
  reverseIconContainer: { padding: 10 },
  label: { fontSize: 14, color: theme.text, marginBottom: 8 },
  picker: { backgroundColor: theme.surface, borderRadius: 8, padding: 10 },
  inputContainer: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, color: theme.text, backgroundColor: theme.surface },
  convertedAmountContainer: { padding: 20, backgroundColor: theme.primarySoft, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  convertedText: { fontSize: 18, fontWeight: 'bold', color: theme.primary },
  conversionRateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  conversionRateText: { fontSize: 16, color: theme.text, marginRight: 10 },
  greenRate: { color: '#16a34a', fontSize: 16 },
  redRate: { color: '#dc2626', fontSize: 16 },
  neutralRate: { color: theme.textMuted, fontSize: 16 },
  lastUpdateText: { fontSize: 12, color: theme.textMuted, marginBottom: 10 },
  transferButton: { padding: 16, borderRadius: 8, alignItems: 'center' },
  transferButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
