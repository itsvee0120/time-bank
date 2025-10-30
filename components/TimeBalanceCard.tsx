import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TimeBalanceCardProps {
  balance: number; // total time balance
}

const TimeBalanceCard: React.FC<TimeBalanceCardProps> = ({ balance }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Time Balance</Text>
      <Text style={styles.balance}>{balance} hrs</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(5, 14, 6, 0.45)", // slightly more transparent for glass effect
    padding: 25,
    borderRadius: 60,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    alignSelf: "center",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.8,
    shadowRadius: 20,

    // optional: subtle border for glass effect
    borderWidth: 1,
    borderColor: "rgba(248, 248, 248, 0.22)",
  },
  label: {
    color: "#ebf3efff",
    fontSize: 18,
    marginBottom: 8,
  },
  balance: {
    color: "#aaffcbff",
    fontSize: 32,
    fontWeight: "700",
  },
});

export default TimeBalanceCard;
