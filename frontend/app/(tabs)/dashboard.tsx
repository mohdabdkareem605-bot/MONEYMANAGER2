import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Dashboard</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },
});
