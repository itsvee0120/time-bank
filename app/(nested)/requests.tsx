import { useAuth } from "@/services/AuthContext";
import { supabase } from "@/services/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RequestsScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const availableLocations = ["in-person", "online", "both"];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeOffered, setTimeOffered] = useState("");
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState("");
  const [attachment, setAttachment] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // Fetch user's current time balance to validate the 'timeOffered' field
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUserBalance = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("time_balance")
        .eq("id", session.user.id)
        .single();
      if (!error && data) setUserBalance(data.time_balance ?? 0);
    };
    fetchUserBalance();
  }, [session?.user?.id]);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "image/*",
        "application/pdf",
        "text/plain", // <-- Add this for .txt files
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      Alert.alert("Error", "You must be logged in to create a request.");
      return;
    }

    const time = parseFloat(timeOffered);
    if (
      !title.trim() ||
      !description.trim() ||
      !timeOffered ||
      !availability ||
      !location.trim()
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (isNaN(time) || time <= 0) {
      Alert.alert(
        "Invalid Time",
        "Please enter a valid number for hours offered."
      );
      return;
    }
    // Check if the user has enough balance to offer the time
    if (time > userBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You cannot offer more time than you have. Your current balance is ${userBalance} hours.`
      );
      return;
    }

    setLoading(true);

    try {
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: title.trim(),
          description: description.trim(),
          availability,
          location: location.trim(),
          created_by: session.user.id,
          time_offered: time,
          status: "Open",
          timestamp: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (taskError) throw taskError;
      const taskId = taskData.id;

      if (attachment) {
        try {
          const fileExt = attachment.uri.split(".").pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;

          const formData = new FormData();
          formData.append("file", {
            uri: attachment.uri,
            name: fileName,
            type: attachment.mimeType,
          } as any);

          const { error: uploadError } = await supabase.storage
            .from("task_attachments")
            .upload(filePath, formData);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("task_attachments")
            .getPublicUrl(filePath);
          const attachmentUrl = urlData.publicUrl;

          const { error: attachmentError } = await supabase
            .from("task_attachments")
            .insert({
              task_id: taskId,
              file_url: attachmentUrl,
              uploaded_by: session.user.id,
              timestamp: new Date().toISOString(),
            });

          if (attachmentError) throw attachmentError;
        } catch (uploadErr: any) {
          // Catch network errors specifically from the upload process
          console.error("File upload error:", uploadErr);
          Alert.alert(
            "Upload Failed",
            "Could not upload the attachment. Please check your network connection and try again."
          );
          // Stop execution and loading state, but don't crash
          setLoading(false);
          return;
        }
      }

      Alert.alert("Success", "Your request has been submitted.", [
        { text: "OK", onPress: () => router.back() }, // Use router.back() to return to the previous screen
      ]);
    } catch (err: any) {
      console.error("Submission error:", err);
      Alert.alert("Error", "Failed to submit the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#041b0c", "rgba(2,23,9,0.55)", "rgba(2,23,9,0.2)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView
        intensity={25}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Request Help</Text>
          <Text style={styles.screenSubtitle}>
            Describe the task you need assistance with and the time credits
            you'll offer.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Mow the front lawn"
            placeholderTextColor="#ffffff90"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.formLabel}>Detailed Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Be specific about what needs to be done..."
            placeholderTextColor="#ffffff90"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.row}>
            <View style={styles.rowInputWrapper}>
              <Text style={styles.formLabel}>Time Offered (Hours)</Text>
              <TextInput
                style={styles.input}
                placeholder="1.0"
                placeholderTextColor="#ffffff90"
                keyboardType="numeric"
                value={timeOffered}
                onChangeText={setTimeOffered}
              />
            </View>
            <View style={styles.rowInputWrapper}>
              <Text style={styles.formLabel}>
                Availability Mode (select one)
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={availability}
                  onValueChange={(itemValue: string) =>
                    setAvailability(itemValue)
                  }
                  style={styles.picker}
                  dropdownIconColor="#ffffff"
                >
                  <Picker.Item label="Select a mode..." value="" />
                  {availableLocations.map((loc, index) => (
                    <Picker.Item
                      key={index}
                      label={loc.charAt(0).toUpperCase() + loc.slice(1)}
                      value={loc}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My City, WA"
            placeholderTextColor="#ffffff90"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.formLabel}>Attachment (Optional)</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handlePickFile}
          >
            <FontAwesome5 name="paperclip" size={16} color="#9ec5acff" />
            <Text style={styles.imagePickerButtonText}>
              {attachment ? "Change Attachment" : "Add Attachment"}
            </Text>
          </TouchableOpacity>

          {attachment && (
            <View style={styles.attachmentPreviewContainer}>
              {attachment.mimeType?.startsWith("image/") ? (
                <Image
                  source={{ uri: attachment.uri }}
                  style={styles.imagePreview}
                />
              ) : (
                <View style={styles.filePreview}>
                  <FontAwesome5 name="file-alt" size={24} color="#ffffff" />
                  <Text style={styles.fileNameText} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setAttachment(null)}
                style={styles.removeImageButton}
              >
                <Text style={styles.removeImageText}>&times;</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#041b0c" />
            ) : (
              <>
                <FontAwesome5
                  name="paper-plane"
                  size={20}
                  color="#041b0c"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  headerContainer: {
    width: "100%",
    marginTop: 30,
    marginBottom: 30,
    alignSelf: "flex-start",
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#9ec5acff",
    marginBottom: 5,
  },
  screenSubtitle: {
    fontSize: 16,
    color: "#ffffffa0",
  },
  formCard: {
    backgroundColor: "rgba(2, 23, 9, 0.55)",
    padding: 25,
    borderRadius: 40,
    width: "100%",
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b3d4bfff",
    marginTop: 15,
    marginBottom: 5,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowInputWrapper: {
    flex: 1,
    marginRight: 10,
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
    justifyContent: "center",
  },
  picker: {
    color: "#ffffff",
    height: 55,
    width: "100%",
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
  submitButtonText: {
    color: "#041b0c",
    fontSize: 18,
    fontWeight: "700",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ec5ac99",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  imagePickerButtonText: {
    color: "#9ec5acff",
    marginLeft: 10,
    fontSize: 16,
  },
  attachmentPreviewContainer: {
    marginTop: 15,
    alignItems: "center",
    position: "relative",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffffff30",
    width: "100%",
  },
  fileNameText: {
    color: "#ffffff",
    marginLeft: 15,
    fontSize: 16,
    flex: 1,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: 50,
    backgroundColor: "#DC2626",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
