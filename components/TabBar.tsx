import React from "react";
import { StyleSheet } from "react-native";
import { View } from "react-native"; // Switch from Animated.View to regular View
import TabBarButton from "./TabBarButton";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { FontAwesome5 } from "@expo/vector-icons";

// Remove scrollY from the interface
interface TabBarProps extends BottomTabBarProps {}

const TabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  // Define the fixed opaque green color (Original color: rgba(2, 21, 10, 1) or #9bc7ade1)
  const OPAQUE_GREEN_BG = "#062411ff"; // Or use a color that visually matches 'opaque green'

  return (
    // Use a regular View
    <View style={[styles.tabbar, { backgroundColor: OPAQUE_GREEN_BG }]}>
      {state.routes.map((route, index) => {
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
  );
};

const styles = StyleSheet.create({
  tabbar: {
    position: "absolute",
    bottom: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    // Background color is set inline now
    // backgroundColor: "#02150a", // Removed from here
  },
});

export default TabBar;
