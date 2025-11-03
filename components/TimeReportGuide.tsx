import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const steps = [
  {
    title: "Get Started with 2 Free Hours",
    description:
      "Welcome to Houreum! To get you started on your journey, every new user receives 2 hours in their time bank. Click 'Next' to learn how to utilize Houreum effectively.",
  },
  {
    title: "Set Up Your Profile",
    description:
      "Create your account, upload an avatar, and complete your profile. Add a description, your skill sets, location, and availability. You can edit your profile any time under 'Settings'.",
  },
  {
    title: "Browse Tasks",
    description:
      "Explore tasks posted by community members. You can see task details, attachments, estimated hours, and owner info under 'Tasks Available' on your dashboard.",
  },
  {
    title: "Offer Your Help",
    description:
      "Take on a task by offering your time. Assigned tasks appear under 'Current Requests'.",
  },
  {
    title: "Complete the Task",
    description:
      "Finish the task as agreed with the owner. Only verified tasks earn time credits.",
  },
  {
    title: "Report Your Hours",
    description:
      "Once you've finished, report your hours under the 'Report Time' tab. The task owner will be notified to review the time you submitted.",
  },
  {
    title: "Owner Approves & Completes",
    description:
      "After the owner approves your reported time, they will mark the task as 'Complete'. Your time balance will then be updated automatically.",
  },
  {
    title: "Can't Complete a Task?",
    description:
      "If you can no longer work on a task, please communicate with the task owner. They can unassign you, which makes the task available for others in the community.",
  },
  {
    title: "Enable Notifications for Updates",
    description:
      "Stay informed about your tasks. Go to 'Settings' > 'Notifications' to enable alerts for when your task is accepted, completed, or to get daily reminders.",
  },
];

export default function TimeReportGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const animateProgress = (toStep: number) => {
    Animated.timing(progress, {
      toValue: toStep / (steps.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      animateProgress(next);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      animateProgress(prev);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Initialize progress on first render
  useEffect(() => {
    animateProgress(currentStep);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
      <Text style={styles.stepDescription}>
        {steps[currentStep].description}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={prevStep}
          disabled={currentStep === 0}
          style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={nextStep}
          disabled={currentStep === steps.length - 1}
          style={[
            styles.navButton,
            currentStep === steps.length - 1 && styles.disabledButton,
          ]}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.stepCounter}>
        Step {currentStep + 1} of {steps.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    padding: 20,
    backgroundColor: "rgba(2,23,9,0.65)",
    borderRadius: 30,
    marginVertical: 20,
    alignItems: "center",
  },
  progressContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#ffffff30",
    borderRadius: 3,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#4ade80",
    borderRadius: 3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b3d4bfff",
    marginBottom: 10,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#9ec5acff",
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: "#041b0c",
    fontWeight: "700",
  },
  stepCounter: {
    fontSize: 14,
    color: "#ffffff90",
  },
});
