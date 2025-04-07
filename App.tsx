import { Button, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
    setRecordedUri([...recordedUri, uri ? uri : ""]);
    setRecording(null);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
    }
  };

  const playSound = async (vnUri: string, index: number) => {
    if (sound.current) {
      await sound.current.unloadAsync();
      sound.current.setOnPlaybackStatusUpdate(null);
      sound.current = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: vnUri },
      { shouldPlay: true },
      onPlaybackStatusUpdate
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
    <View style={{ padding: 20 }}>
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {recordedUri.map((item, index) => (
        <View style={styles.audioBox} key={index}>
          <Text style={styles.label}>Voice note {index + 1}</Text>
          <Button title='Play' onPress={() => playSound(item, index)} />

          {currentIndex === index && (
            <>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor='#1FB28A'
                maximumTrackTintColor='#ccc'
                thumbTintColor='#1FB28A'
              />

              <View style={styles.timerRow}>
                <Text>{formatMillis(position)}</Text>
                <Text>{formatMillis(duration)}</Text>
              </View>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  audioBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  slider: {
    marginTop: 10,
    width: "100%",
    height: 40,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
