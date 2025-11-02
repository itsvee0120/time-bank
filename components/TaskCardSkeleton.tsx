import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const SkeletonPiece = ({ style }: { style: any }) => (
  <View style={[styles.skeleton, style]} />
);

const Shimmer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350], // Should be wider than the card
  });

  return (
    <View style={styles.shimmerContainer}>
      {children}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.05)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const TaskCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <Shimmer>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <SkeletonPiece style={{ width: "80%", height: 20 }} />
            <SkeletonPiece style={{ width: "60%", height: 20, marginTop: 6 }} />
          </View>
          <SkeletonPiece style={{ width: 80, height: 30, borderRadius: 12 }} />
        </View>
        <SkeletonPiece style={{ width: "45%", height: 12, marginTop: 8 }} />
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <SkeletonPiece style={{ width: "40%", height: 14 }} />
          <SkeletonPiece style={{ width: "40%", height: 14 }} />
        </View>
      </Shimmer>
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: "hidden",
    backgroundColor: "rgba(2, 23, 9, 0.7)",
    borderRadius: 20,
  },
  card: {
    backgroundColor: "rgba(2, 23, 9, 0.7)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  skeleton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
