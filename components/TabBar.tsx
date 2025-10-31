import { FontAwesome5 } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import TabBarButton from "./TabBarButton";

interface TabBarProps extends BottomTabBarProps {
  scrollY?: Animated.Value; // 👈 optional shared scroll position
}

const TabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
  scrollY,
}) => {
  const OPAQUE_GREEN_BG = "#041b0cff";

  // Define the height of the tab bar area for the animation
  const TAB_BAR_HEIGHT = 95; // Approximate height of the wrapper

  // Create an animated transform that moves the tab bar off-screen
  const transform = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 50], // The scroll distance to trigger the animation
        outputRange: [0, TAB_BAR_HEIGHT], // Move from on-screen (0) to off-screen
        extrapolate: "clamp",
      })
    : 0; // Fallback if scrollY is not provided

  const visibleRoutes = state.routes.filter((route) =>
    ["home", "dashboard", "profile"].includes(route.name)
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: transform }],
        },
      ]}
    >
      <View style={styles.tabbar}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          let iconName: keyof typeof FontAwesome5.glyphMap = "question";
          switch (route.name) {
            case "home":
              iconName = "home";
              break;
            case "dashboard":
              iconName = "tasks";
              break;
            case "profile":
              iconName = "user";
              break;
          }

          return (
            <TabBarButton
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              isFocused={isFocused}
              routeName={route.name}
              label={label}
              color={isFocused ? "#92f3c2ff" : "#c7e6dca1"}
              contentColor={isFocused ? "#060807ff" : "#c7e6dca1"}
              icon={
                <FontAwesome5
                  name={iconName}
                  size={20}
                  color={isFocused ? "#060807ff" : "#c7e6dca1"}
                />
              }
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 25,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#041b0cff",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 10,
    shadowOpacity: 0.2,
    elevation: 10,
  },
});

export default TabBar;
