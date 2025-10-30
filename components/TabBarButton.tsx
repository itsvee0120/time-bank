// components/TabBarButton.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import Animated, { Layout, FadeIn, FadeOut } from "react-native-reanimated";

export interface TabBarButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  isFocused: boolean;
  routeName: string;
  label: string;
  color: string; // Active pill background
  contentColor: string; // Icon/text color
  style?: ViewStyle;
  icon?: React.ReactNode;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({
  onPress,
  onLongPress,
  isFocused,
  label,
  color,
  contentColor,
  style,
  icon,
}) => {
  // Pill background style: active or inactive
  const pillStyle: ViewStyle = isFocused
    ? { backgroundColor: color, ...styles.activePill }
    : styles.inactivePill;

  // Label text style
  const textStyle: TextStyle = {
    color: contentColor,
    fontSize: 15,
    fontWeight: isFocused ? "700" : "500",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[styles.contentBase, pillStyle]}
        layout={Layout.duration(300)}
      >
        {icon}
        {isFocused && (
          <Animated.View
            key="label-text"
            entering={FadeIn.duration(300).delay(100)}
            exiting={FadeOut.duration(100)}
            style={styles.labelWrapper}
          >
            <Text style={textStyle}>{label}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 30,
  },
  inactivePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "transparent",
  },
  labelWrapper: {
    marginLeft: 6,
  },
});

export default TabBarButton;
