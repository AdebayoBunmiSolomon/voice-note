import {
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
  StatusBar as RNStatusBar,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Entypo } from "@expo/vector-icons";

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string[]>([]);
  const [playbackStates, setPlaybackStates] = useState<
    { position: number; duration: number; isPlaying: boolean }[]
  >([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

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
    if (uri) {
      setRecordedUri((prev) => [...prev, uri]);
      setPlaybackStates((prev) => [
        ...prev,
        { position: 0, duration: 1, isPlaying: false },
      ]);
    }
    setRecording(null);
  };

  const onPlaybackStatusUpdate = (status: any, index: number) => {
    if (status.isLoaded) {
      setPlaybackStates((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          position: status.positionMillis,
          duration: status.durationMillis || 1,
          isPlaying: status.isPlaying,
        };
        return updated;
      });
    }
  };

  const playSound = async (vnUri: string, index: number) => {
    // Stop previous playback if needed
    if (sound.current) {
      await sound.current.unloadAsync();
      sound.current.setOnPlaybackStatusUpdate(null);
      sound.current = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: vnUri },
      { shouldPlay: true },
      (status) => onPlaybackStatusUpdate(status, index)
    );

    sound.current = newSound;
    setCurrentIndex(index);
    await newSound.playAsync();
  };

  const handleSeek = async (value: number) => {
    if (sound.current) {
      await sound.current.setPositionAsync(value);
    }
  };

  const formatMillis = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
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
    <View
      style={{
        paddingTop: Platform.OS === "ios" ? 50 : RNStatusBar.currentHeight,
        paddingHorizontal: 15,
      }}>
      <StatusBar style='auto' />
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />

      <View style={styles.audioBoxContainer}>
        {recordedUri.map((item, index) => {
          const state = playbackStates[index] || {
            position: 0,
            duration: 1,
            isPlaying: false,
          };

          return (
            <View key={index} style={styles.audioBox}>
              <Text style={styles.label}>Voice note {index + 1}</Text>
              <View style={styles.vnActions}>
                <TouchableOpacity onPress={() => playSound(item, index)}>
                  <Entypo
                    name={
                      state.isPlaying ? "controller-paus" : "controller-play"
                    }
                    size={25}
                    color={"blue"}
                  />
                </TouchableOpacity>

                <View style={styles.sliderAndDurationContainer}>
                  <Text>{formatMillis(state.position)}</Text>
                  <View style={{ width: "65%" }}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={state.duration}
                      value={state.position}
                      onSlidingComplete={handleSeek}
                      minimumTrackTintColor='#1FB28A'
                      maximumTrackTintColor='#c8bebe'
                      thumbTintColor='#1FB28A'
                    />
                  </View>
                  <Text>{formatMillis(state.duration)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  audioBoxContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginVertical: 10,
    gap: 10,
  },
  audioBox: {
    padding: 10,
    borderRadius: 10,
    width: "80%",
    backgroundColor: "#f2f2f2",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderAndDurationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  vnActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
