import { useAuth } from "@/services/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export default function ReportBugScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!summary.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill out both fields.");
      return;
    }

    setSubmitting(true);

    try {
      const toEmail = "itsveedev@gmail.com";
      const subject = `Bug Report: ${summary.trim()}`;

      // Build HTML email body
      let bodyHtml = `
        <p><strong>User:</strong> ${session?.user?.email ?? "Not logged in"}</p>
        <p><strong>Summary:</strong><br>${summary.trim()}</p>
        <p><strong>Description:</strong><br>${description.trim()}</p>
      `;

      if (imageBase64) {
        bodyHtml += `<p><strong>Screenshot:</strong><br><img src="data:image/jpeg;base64,${imageBase64}" style="max-width:100%; height:auto;" /></p>`;
      }

      const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(bodyHtml)}`;

      await Linking.openURL(mailtoUrl);

      Alert.alert("Redirecting to Email", "Your email client is opening.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Could not open email client", err);
      Alert.alert("Error", "Could not open your email client.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#041b0c", "rgba(2,23,9,0.55)", "rgba(2,23,9,0.2)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView
        intensity={25}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Report a Bug</Text>
          <Text style={styles.screenSubtitle}>
            Help us improve the app by describing the issue you've encountered.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Summary</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 'Save Changes' button not working"
            placeholderTextColor="#ffffff90"
            value={summary}
            onChangeText={setSummary}
          />

          <Text style={styles.formLabel}>Detailed Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please provide steps to reproduce the bug, what you expected to happen, and what actually happened."
            placeholderTextColor="#ffffff90"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>
              {imageUri ? "Change Screenshot" : "Attach Screenshot (optional)"}
            </Text>
          </TouchableOpacity>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#041b0c" />
            ) : (
              <>
                <FontAwesome5
                  name="paper-plane"
                  size={18}
                  color="#041b0c"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 120, alignItems: "center" },
  headerContainer: { width: "100%", marginBottom: 30, alignSelf: "flex-start" },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#9ec5acff",
    marginBottom: 5,
  },
  screenSubtitle: { fontSize: 16, color: "#ffffffa0", lineHeight: 22 },
  formCard: {
    backgroundColor: "rgba(2, 23, 9, 0.65)",
    padding: 25,
    borderRadius: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b3d4bfff",
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  textArea: { height: 150, textAlignVertical: "top", paddingTop: 15 },
  imageButton: {
    marginTop: 15,
    backgroundColor: "#9ec5ac55",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  imageButtonText: { color: "#ffffff", fontWeight: "600" },
  previewImage: {
    marginTop: 10,
    width: "100%",
    height: 200,
    borderRadius: 15,
    resizeMode: "contain",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9ec5acff",
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    height: 55,
  },
  submitButtonText: { color: "#041b0c", fontSize: 18, fontWeight: "700" },
  submitButtonDisabled: { backgroundColor: "#9ec5ac99" },
});
