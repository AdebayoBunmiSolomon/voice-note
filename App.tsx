import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const sound = useRef<Audio.Sound | null>(null);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log(uri);
    setRecordedUri([...recordedUri, uri || ""]);
    setRecording(null);
  };

  const playSound = async (vnUri: string) => {
    if (sound.current) {
      await sound.current.unloadAsync();
      sound.current = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({
      uri: vnUri,
    });
    sound.current = newSound;
    await newSound.playAsync();
  };

  useEffect(() => {
    const getPermission = async () => {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }
    };

    getPermission();

    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />
      {recordedUri &&
        recordedUri.map((item, index) => (
          <View style={{ marginTop: 20 }} key={index}>
            <Text>Voice note saved!</Text>
            <Button title='Play Recording' onPress={() => playSound(item)} />
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
