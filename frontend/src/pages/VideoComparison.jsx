"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera as IconCamera, Play as IconPlay, Square as IconStop, Upload as IconUpload, Volume2 as IconVolumeOn, VolumeX as IconVolumeOff } from "lucide-react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

const MIN_KEYPOINT_SCORE = 0.3;
const ANGLE_DIFF_THRESHOLD = 15;

const JOINTS = {
  left_elbow: ["left_shoulder", "left_elbow", "left_wrist"],
  right_elbow: ["right_shoulder", "right_elbow", "right_wrist"],
  left_shoulder: ["left_elbow", "left_shoulder", "left_hip"],
  right_shoulder: ["right_elbow", "right_shoulder", "right_hip"],
  left_knee: ["left_hip", "left_knee", "left_ankle"],
  right_knee: ["right_hip", "right_knee", "right_ankle"],
  left_hip: ["left_shoulder", "left_hip", "left_knee"],
  right_hip: ["right_shoulder", "right_hip", "right_knee"],
};

// Skeleton edges for drawing
const SKELETON_EDGES = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

const REQUIRED_KEYPOINTS = [
  "left_shoulder", "left_elbow", "left_wrist",
  "right_shoulder", "right_elbow", "right_wrist",
  "left_hip", "left_knee", "left_ankle",
  "right_hip", "right_knee", "right_ankle",
];

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function computeAngle(a, b, c) {
  if (!a || !b || !c) return null;
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return null;
  let cosine = dot / (magAB * magCB);
  cosine = Math.min(1, Math.max(-1, cosine));
  const angle = Math.acos(cosine);
  return radiansToDegrees(angle);
}

function getPointByName(pose, name) {
  if (!pose?.keypoints) return null;
  const kp = pose.keypoints.find((k) => (k.name || k.part) === name);
  if (!kp || (kp.score ?? kp.confidence ?? 0) < MIN_KEYPOINT_SCORE) return null;
  return { x: kp.x, y: kp.y, score: kp.score ?? kp.confidence ?? 0 };
}

function computeAllAngles(pose) {
  const result = {};
  if (!pose) return result;
  Object.entries(JOINTS).forEach(([joint, [aName, bName, cName]]) => {
    const a = getPointByName(pose, aName);
    const b = getPointByName(pose, bName);
    const c = getPointByName(pose, cName);
    const angle = computeAngle(a, b, c);
    if (angle != null) result[joint] = angle;
  });
  return result;
}

function getMissingByRegion(pose) {
  const result = {
    upperLeft: 0,
    upperRight: 0,
    lowerLeft: 0,
    lowerRight: 0,
    totalMissing: 0,
    missingNames: [],
  };
  if (!pose?.keypoints) return result;
  const vis = (name) => {
    const kp = pose.keypoints.find((k) => (k.name || k.part) === name);
    return kp && (kp.score ?? kp.confidence ?? 0) >= MIN_KEYPOINT_SCORE;
  };
  REQUIRED_KEYPOINTS.forEach((name) => {
    if (!vis(name)) {
      result.totalMissing += 1;
      result.missingNames.push(name);
      if (name.startsWith("left_")) {
        if (name.includes("shoulder") || name.includes("elbow") || name.includes("wrist")) result.upperLeft += 1;
        if (name.includes("hip") || name.includes("knee") || name.includes("ankle")) result.lowerLeft += 1;
      } else if (name.startsWith("right_")) {
        if (name.includes("shoulder") || name.includes("elbow") || name.includes("wrist")) result.upperRight += 1;
        if (name.includes("hip") || name.includes("knee") || name.includes("ankle")) result.lowerRight += 1;
      }
    }
  });
  return result;
}

function generateVisibilityAdvice(livePose) {
  const advice = [];
  const kp = (livePose?.keypoints || []).filter((k) => (k.score ?? k.confidence ?? 0) >= MIN_KEYPOINT_SCORE).length;
  const miss = getMissingByRegion(livePose);
  if (kp < 8) {
    advice.push("Step back a bit so your full body is visible");
  }
  if (miss.upperLeft >= 2) advice.push("Bring your left arm into frame");
  if (miss.upperRight >= 2) advice.push("Bring your right arm into frame");
  if (miss.lowerLeft >= 2 || miss.lowerRight >= 2) advice.push("Move back so your legs are visible");
  if (!advice.length && kp < REQUIRED_KEYPOINTS.length) advice.push("Improve lighting and face the camera");
  return advice.slice(0, 2);
}

function diffAngles(userAngles, refAngles) {
  const diffs = {};
  Object.keys(JOINTS).forEach((joint) => {
    const ua = userAngles?.[joint];
    const ra = refAngles?.[joint];
    if (ua != null && ra != null) {
      diffs[joint] = Math.abs(ua - ra);
    }
  });
  return diffs;
}

function generateFeedback(userAngles, refAngles) {
  const u = userAngles || {};
  const r = refAngles || {};
  const suggestions = [];

  const sideWord = (side) => (side === "left" ? "left" : "right");
  const pushIf = (cond, diff, msg) => {
    if (cond && diff >= ANGLE_DIFF_THRESHOLD) suggestions.push({ diff, msg });
  };

  ["left", "right"].forEach((side) => {
    const elbow = `${side}_elbow`;
    if (u[elbow] != null && r[elbow] != null) {
      const diff = Math.abs(u[elbow] - r[elbow]);
      pushIf(u[elbow] > r[elbow] + ANGLE_DIFF_THRESHOLD, diff, `Bend your ${sideWord(side)} elbow more`);
      pushIf(u[elbow] < r[elbow] - ANGLE_DIFF_THRESHOLD, diff, `Straighten your ${sideWord(side)} elbow`);
    }

    const shoulder = `${side}_shoulder`;
    if (u[shoulder] != null && r[shoulder] != null) {
      const diff = Math.abs(u[shoulder] - r[shoulder]);
      pushIf(u[shoulder] < r[shoulder] - ANGLE_DIFF_THRESHOLD, diff, `Raise your ${sideWord(side)} arm higher`);
      pushIf(u[shoulder] > r[shoulder] + ANGLE_DIFF_THRESHOLD, diff, `Lower your ${sideWord(side)} arm slightly`);
    }

    const knee = `${side}_knee`;
    if (u[knee] != null && r[knee] != null) {
      const diff = Math.abs(u[knee] - r[knee]);
      pushIf(u[knee] > r[knee] + ANGLE_DIFF_THRESHOLD, diff, `Bend your ${sideWord(side)} knee more`);
      pushIf(u[knee] < r[knee] - ANGLE_DIFF_THRESHOLD, diff, `Straighten your ${sideWord(side)} knee`);
    }

    const hip = `${side}_hip`;
    if (u[hip] != null && r[hip] != null) {
      const diff = Math.abs(u[hip] - r[hip]);
      pushIf(u[hip] > r[hip] + ANGLE_DIFF_THRESHOLD, diff, "Bring torso more upright");
      pushIf(u[hip] < r[hip] - ANGLE_DIFF_THRESHOLD, diff, "Lean forward slightly");
    }
  });

  if (!suggestions.length) return ["Great! Keep it up."];
  suggestions.sort((a, b) => b.diff - a.diff);
  const top = suggestions.slice(0, 2).map((s) => s.msg);
  return top.length ? top : ["Great! Keep it up."];
}

const VideoComparison = () => {
  const [refVideoUrl, setRefVideoUrl] = useState(null);
  const [refImageUrl, setRefImageUrl] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(10);
  const [feedback, setFeedback] = useState("Upload a reference video, then start the camera.");

  const [userAngles, setUserAngles] = useState({});
  const [referenceAngles, setReferenceAngles] = useState({});
  const [angleDifferences, setAngleDifferences] = useState({});
  const [tips, setTips] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    backend: "",
    detectorReady: false,
    cameraOn: false,
    liveSize: "",
    refSize: "",
    liveKP: 0,
    refKP: 0,
    liveAngles: 0,
    refAngles: 0,
    topDiffs: [],
    similarity: 0,
  });

  const liveVideoRef = useRef(null);
  const refVideoRef = useRef(null);
  const refImageRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const renderRafRef = useRef(null);
  const lastRunRef = useRef(0);
  const streamRef = useRef(null);
  const analyzingRef = useRef(false);


  const latestLivePoseRef = useRef(null);
  const latestSimilarityRef = useRef(0);
  const latestTopDiffsRef = useRef([]);
  const latestTipsRef = useRef([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const lastSpeakAtRef = useRef(0);
  const lastSpokenRef = useRef("");
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const selectedVoiceRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const ADVICE_INTERVAL_MS = 5000;
  const prevAnglesRef = useRef({});
  const stillTicksRef = useRef(0);

  const canAnalyze = useMemo(() => Boolean(isCameraOn && (refVideoUrl || refImageUrl)), [isCameraOn, refVideoUrl, refImageUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await tf.ready();
      try {
        await tf.setBackend("webgl");
      } catch {}
      const backend = tf.getBackend();
      console.log("[Pose] Backend:", backend);
      if (cancelled) return;
      

      
      // lazy-create; we'll also ensure when camera starts
      try {
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        console.log("[Pose] Detector created: MoveNet SINGLEPOSE_LIGHTNING");
        setDebugInfo((d) => ({ ...d, backend, detectorReady: true }));
      } catch (e) {
        console.warn("[Pose] Detector create error:", e?.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureModelReady = async () => {
    if (detectorRef.current) return true;
    try {
      detectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      setDebugInfo((d) => ({ ...d, detectorReady: true }));
      console.log("[Pose] Detector ready (ensure)");
      // warm-up if video is ready
      try {
        if (liveVideoRef.current?.videoWidth) {
          await detectorRef.current.estimatePoses(liveVideoRef.current, { flipHorizontal: true });
        }
      } catch {}
      return true;
    } catch (e) {
      console.warn("[Pose] ensureModelReady error:", e?.message);
      return false;
    }
  };

  // init speech synthesis
  useEffect(() => {
    const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSupportsSpeech(hasSpeech);
    if (!hasSpeech) return;
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) {
      selectedVoiceRef.current = pickBestVoice(voices);
      setSpeechReady(true);
    } else {
      const onVoices = () => {
        voices = window.speechSynthesis.getVoices();
        selectedVoiceRef.current = pickBestVoice(voices);
        setSpeechReady(true);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      // trigger load
      window.speechSynthesis.getVoices();
      const t = setTimeout(() => {
        if (!speechReady) setSpeechReady(true); // proceed even if voices list is empty
      }, 1500);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        clearTimeout(t);
      };
    }
  }, []);

  const pickBestVoice = (voices) => {
    const langPref = navigator.language || "en-US";
    return (
      voices.find((v) => v.lang === langPref && v.localService) ||
      voices.find((v) => v.lang.startsWith(langPref.split("-")[0])) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0] || null
    );
  };

  useEffect(() => {
    return () => {
      // Clean up all resources on unmount
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (renderRafRef.current) {
        cancelAnimationFrame(renderRafRef.current);
        renderRafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (detectorRef.current?.dispose) {
        detectorRef.current.dispose();
      }
      
      // Clear any remaining timeouts
      if (window.analysisTimeout) {
        clearTimeout(window.analysisTimeout);
        window.analysisTimeout = null;
      }
      if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
        window.countdownInterval = null;
      }
      
    };
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("[Ref] Selected file:", file.name, `${(file.size / (1024*1024)).toFixed(1)}MB`, file.type);
    const url = URL.createObjectURL(file);
    if (file.type?.startsWith("image/")) {
      setRefImageUrl(url);
      setRefVideoUrl(null);
      setFeedback("Photo loaded. Start camera, then Start Analysis.");
      setTimeout(() => {
        if (refImageRef.current) {
          refImageRef.current.onload = () => {
            console.log("[Ref] Image loaded:", refImageRef.current.naturalWidth, "x", refImageRef.current.naturalHeight);
            setDebugInfo((d) => ({ ...d, refSize: `${refImageRef.current.naturalWidth}x${refImageRef.current.naturalHeight}` }));
          };
        }
      }, 0);
    } else {
      setRefVideoUrl(url);
      setRefImageUrl(null);
      setFeedback("Reference loaded. Start camera, then Start Analysis.");
      // autoplay on load
      setTimeout(() => {
        if (refVideoRef.current) {
          refVideoRef.current.muted = true;
          refVideoRef.current.loop = true;
          refVideoRef.current.onloadedmetadata = () => {
            console.log("[Ref] Video loaded:", refVideoRef.current.videoWidth, "x", refVideoRef.current.videoHeight);
            setDebugInfo((d) => ({ ...d, refSize: `${refVideoRef.current.videoWidth}x${refVideoRef.current.videoHeight}` }));
          };
          refVideoRef.current.play().catch((err) => {
            console.warn("[Ref] Play failed:", err?.message);
          });
        }
      }, 0);
    }
  };

  const getConstraintCandidates = async () => {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
    const firstId = devices[0]?.deviceId;
    const list = [];
    // Preferred user-facing at 1280x720
    list.push({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    // Generic user-facing
    list.push({ video: { facingMode: "user" }, audio: false });
    // Specific deviceId
    if (firstId) list.push({ video: { deviceId: { exact: firstId } }, audio: false });
    // Very permissive
    list.push({ video: true, audio: false });
    return list;
  };

  const startCamera = async () => {
    try {
      setFeedback("Starting camera...");
      
      // Check if camera is already running
      if (streamRef.current) {
        stopCamera();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for cleanup
      }
      
      const candidates = await getConstraintCandidates();
      let stream = null;
      let lastErr = null;
      
      for (const c of candidates) {
        try {
          console.log("[Cam] Trying constraint:", c);
          stream = await navigator.mediaDevices.getUserMedia(c);
          if (stream) {
            console.log("[Cam] Success with constraint:", c);
            break;
          }
        } catch (e) {
          lastErr = e;
          console.warn("[Cam] constraint failed:", c, e?.name || e?.message);
        }
      }
      
      if (!stream) {
        throw lastErr || new Error("No camera stream available");
      }
      
      if (!liveVideoRef.current) {
        throw new Error("Video element not ready");
      }
      
      // Set stream and wait for video to be ready
      liveVideoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video metadata to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Video metadata timeout")), 10000);
        
        liveVideoRef.current.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        liveVideoRef.current.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Video element error"));
        };
      });
      
      // Try to play video with retry logic
      let playSuccess = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await liveVideoRef.current.play();
          playSuccess = true;
          break;
        } catch (e) {
          console.warn(`[Cam] Play attempt ${attempt + 1} failed:`, e?.message);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!playSuccess) {
        throw new Error("Failed to start video playback");
      }
      
      setIsCameraOn(true);
      setFeedback("Camera started. Click Start Analysis when ready.");
      
      const { videoWidth, videoHeight } = liveVideoRef.current;
      console.log("[Cam] Started successfully:", videoWidth, "x", videoHeight);
      setDebugInfo((d) => ({ ...d, cameraOn: true, liveSize: `${videoWidth}x${videoHeight}` }));
      
      // Start overlay preview loop
      if (renderRafRef.current) cancelAnimationFrame(renderRafRef.current);
      renderRafRef.current = requestAnimationFrame(renderOverlay);
      
      // Ensure and warm-up model
      await ensureModelReady();
      
    } catch (e) {
      console.error("[Cam] Error:", e);
      
      // Clean up any partial state
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsCameraOn(false);
      
      // Provide specific error messages
      let errorMessage = "Unable to access camera. ";
      if (e.name === 'NotAllowedError') {
        errorMessage += "Please allow camera access and try again.";
      } else if (e.name === 'NotFoundError') {
        errorMessage += "No camera found. Please check your device.";
      } else if (e.name === 'NotReadableError') {
        errorMessage += "Camera is in use by another application.";
      } else if (e.message.includes("timeout")) {
        errorMessage += "Camera startup timed out. Please try again.";
      } else {
        errorMessage += "Please check permissions and try again.";
      }
      
      setFeedback(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
    if (renderRafRef.current) cancelAnimationFrame(renderRafRef.current);
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const analyzeOnce = async () => {
    const detector = detectorRef.current;
    if (!detector || !liveVideoRef.current || (!refVideoRef.current && !refImageRef.current)) {
      console.log("[Analyze] Skipped: detector or media not ready");
      return;
    }

    const usingVideo = Boolean(refVideoUrl && refVideoRef.current);
    if (usingVideo && refVideoRef.current.readyState < 2) {
      console.log("[Analyze] Ref video not ready (readyState:", refVideoRef.current.readyState, ")");
      try { await refVideoRef.current.play(); } catch {}
      return;
    }

    let livePoses = [];
    let refPoses = [];
    try {
      const refSource = usingVideo ? refVideoRef.current : refImageRef.current;
      [livePoses, refPoses] = await Promise.all([
        detector.estimatePoses(liveVideoRef.current, { flipHorizontal: true }),
        detector.estimatePoses(refSource, { flipHorizontal: true }),
      ]);
    } catch (err) {
      console.warn("[Analyze] estimatePoses error:", err?.message);
      return;
    }

    const livePose = livePoses?.[0];
    const refPose = refPoses?.[0];
    if (!livePose || !refPose) {
      console.log("[Analyze] Missing pose:", { livePose: !!livePose, refPose: !!refPose });
      return;
    }

    const liveAngles = computeAllAngles(livePose);
    const refAngles = computeAllAngles(refPose);
    const diffs = diffAngles(liveAngles, refAngles);
    let messages = [];
    const visAdvice = generateVisibilityAdvice(livePose);
    if (visAdvice.length) {
      messages = visAdvice;
    } else {
      messages = generateFeedback(liveAngles, refAngles);
    }

    setUserAngles(liveAngles);
    setReferenceAngles(refAngles);
    setAngleDifferences(diffs);
    setTips(messages);
    latestTipsRef.current = messages;

    const liveKP = (livePose.keypoints || []).filter((k) => (k.score ?? k.confidence ?? 0) >= MIN_KEYPOINT_SCORE).length;
    const refKP = (refPose.keypoints || []).filter((k) => (k.score ?? k.confidence ?? 0) >= MIN_KEYPOINT_SCORE).length;
    const topDiffs = Object.entries(diffs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([joint, diff]) => ({ joint, diff, ua: liveAngles[joint], ra: refAngles[joint] }));
    const values = Object.values(diffs);
    const avgDiff = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const similarityNow = Math.max(0, Math.min(100, 100 - (avgDiff / 45) * 100));
    setDebugInfo((d) => ({
      ...d,
      liveKP,
      refKP,
      liveAngles: Object.keys(liveAngles).length,
      refAngles: Object.keys(refAngles).length,
      topDiffs,
      similarity: similarityNow,
    }));
    latestLivePoseRef.current = livePose;
    latestSimilarityRef.current = similarityNow;
    latestTopDiffsRef.current = topDiffs;
    console.log("[Analyze] KP live/ref:", liveKP, "/", refKP, ", angles live/ref:", Object.keys(liveAngles).length, "/", Object.keys(refAngles).length);
    console.log("[Analyze] top diffs:", topDiffs);

    // stillness detection (avoid spamming when user stands still and is correct)
    const prev = prevAnglesRef.current || {};
    let maxDelta = 0;
    Object.keys(liveAngles).forEach((k) => {
      if (prev[k] != null) maxDelta = Math.max(maxDelta, Math.abs(liveAngles[k] - prev[k]));
    });
    if (maxDelta < 3) stillTicksRef.current += 1; else stillTicksRef.current = 0;
    prevAnglesRef.current = liveAngles;
    if (!visAdvice.length && stillTicksRef.current > 30 && similarityNow > 75) {
      setTips(["Waiting for movement…"]);
      latestTipsRef.current = ["Waiting for movement…"];
    }

    // voice advice (throttled)
    maybeSpeakAdvice();
  };

  const analyzeLoop = async (timestamp) => {
    if (!analyzingRef.current) {
      // Not analyzing, stop loop
      return;
    }
    
    try {
      if (timestamp - lastRunRef.current > 100) {
        lastRunRef.current = timestamp;
        await analyzeOnce();
      }
      
      // Continue loop only if still analyzing
      if (analyzingRef.current) {
        rafRef.current = requestAnimationFrame(analyzeLoop);
      }
    } catch (error) {
      console.error("[Analyze] Loop error:", error);
      
      // If there's a critical error, stop analysis
      if (error.message?.includes("detector") || error.message?.includes("model")) {
        console.warn("[Analyze] Critical error - stopping analysis");
        stopAnalysis();
        setFeedback("Analysis error. Please try again.");
        return;
      }
      
      // For non-critical errors, continue but log
      if (analyzingRef.current) {
        rafRef.current = requestAnimationFrame(analyzeLoop);
      }
    }
  };

  const startAnalysis = () => {
    if (!canAnalyze) {
      setFeedback("Upload a reference and start camera first.");
      return;
    }
    if (!detectorRef.current) {
      console.warn("[Analyze] Detector not ready yet");
      setFeedback("Model still loading. Please wait a moment.");
      return;
    }
    if (!isCameraOn || !liveVideoRef.current?.srcObject) {
      setFeedback("Camera not ready. Please start camera first.");
      return;
    }
    
    console.log("[Analyze] Start requested");
    
    // Sync reference video to start for consistent comparison
    try {
      if (refVideoRef.current) {
        refVideoRef.current.currentTime = 0;
        refVideoRef.current.play().catch((e) => console.warn("[Analyze] Ref play error:", e?.message));
      }
    } catch {}
    
    setIsCountdown(true);
    setCountdownValue(10);
    setFeedback("Get ready... 10");
    
    const countdownInterval = setInterval(() => {
      setCountdownValue((v) => {
        if (v <= 1) {
          clearInterval(countdownInterval);
          setIsCountdown(false);
          setIsAnalyzing(true);
          analyzingRef.current = true;
          setFeedback("Analyzing... Move naturally.");
          console.log("[Analyze] GO");
          
          // Start analysis with timeout protection
          const analysisTimeout = setTimeout(() => {
            if (analyzingRef.current) {
              console.warn("[Analyze] Analysis timeout - stopping");
              stopAnalysis();
              setFeedback("Analysis timed out. Please try again.");
            }
          }, 300000); // 5 minutes timeout
          
          // Store timeout reference for cleanup
          window.analysisTimeout = analysisTimeout;
          
          rafRef.current = requestAnimationFrame(analyzeLoop);
          setupOverlay();
          return 0;
        }
        const next = v - 1;
        setFeedback(`Get ready... ${next}`);
        return next;
      });
    }, 1000);
    
    // Store interval reference for cleanup
    window.countdownInterval = countdownInterval;
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    analyzingRef.current = false;
    
    // Clear all timeouts and intervals
    if (window.analysisTimeout) {
      clearTimeout(window.analysisTimeout);
      window.analysisTimeout = null;
    }
    if (window.countdownInterval) {
      clearInterval(window.countdownInterval);
      window.countdownInterval = null;
    }
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    setFeedback("Analysis stopped.");
    console.log("[Analyze] Stopped");
    
    // Stop rendering
    if (renderRafRef.current) {
      cancelAnimationFrame(renderRafRef.current);
      renderRafRef.current = null;
    }
    
    // Stop any queued speech
    try { 
      window.speechSynthesis?.cancel(); 
    } catch {}
    
    // Reset countdown if it was active
    if (isCountdown) {
      setIsCountdown(false);
      setCountdownValue(10);
    }
  };

  const similarity = useMemo(() => {
    const values = Object.values(angleDifferences ?? {});
    if (!values.length) return 0;
    const avgDiff = values.reduce((a, b) => a + b, 0) / values.length;
    const score = Math.max(0, Math.min(100, 100 - (avgDiff / 45) * 100));
    return score;
  }, [angleDifferences]);

  const topDiffs = useMemo(() => {
    const sorted = Object.entries(angleDifferences || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return sorted.map(([joint, diff]) => ({
      joint,
      diff,
      ua: userAngles?.[joint],
      ra: referenceAngles?.[joint],
    }));
  }, [angleDifferences, userAngles, referenceAngles]);

  // --- Overlay drawing helpers ---
  const drawKeypoints = (ctx, keypoints) => {
    keypoints.forEach((k) => {
      const score = k.score ?? k.confidence ?? 0;
      if (score < MIN_KEYPOINT_SCORE) return;
      ctx.beginPath();
      ctx.arc(k.x, k.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee"; // cyan-400
      ctx.fill();
    });
  };

  const drawSkeleton = (ctx, pose) => {
    SKELETON_EDGES.forEach(([a, b]) => {
      const pa = pose.keypoints.find((k) => (k.name || k.part) === a);
      const pb = pose.keypoints.find((k) => (k.name || k.part) === b);
      const sa = (pa?.score ?? pa?.confidence ?? 0) >= MIN_KEYPOINT_SCORE;
      const sb = (pb?.score ?? pb?.confidence ?? 0) >= MIN_KEYPOINT_SCORE;
      if (!pa || !pb || !sa || !sb) return;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = "#60a5fa"; // blue-400
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  };

  const drawHud = (ctx, w, h) => {
    // similarity pill
    const sim = latestSimilarityRef.current || 0;
    const bg = sim >= 75 ? "#16a34a" : sim >= 50 ? "#f59e0b" : "#ef4444";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(w - 190, 16, 170, 40);
    ctx.fillStyle = bg;
    ctx.fillRect(w - 190, 16, (170 * sim) / 100, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px ui-sans-serif, system-ui";
    ctx.textBaseline = "middle";
    ctx.fillText(`Similarity ${sim.toFixed(0)}%`, w - 185, 36);

    // top diffs
    const diffs = latestTopDiffsRef.current || [];
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    const boxH = 26 + 22 * Math.max(1, diffs.length);
    ctx.fillRect(16, 16, 260, boxH);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px ui-sans-serif, system-ui";
    ctx.fillText("Top differences", 24, 34);
    ctx.font = "13px ui-sans-serif, system-ui";
    diffs.forEach((d, i) => {
      const color = d.diff >= 20 ? "#ef4444" : d.diff >= 10 ? "#f59e0b" : "#16a34a";
      ctx.fillStyle = color;
      ctx.fillText(`${d.joint.replace(/_/g, " ")}: ${d.diff.toFixed(1)}°`, 24, 56 + i * 20);
    });

    // guidance text
    const tips = latestTipsRef.current || [];
    if (tips.length) {
      const advice = tips[0];
      const pad = 10;
      ctx.font = "bold 16px ui-sans-serif, system-ui";
      const tw = ctx.measureText(advice).width;
      const boxW = Math.min(w - 32, tw + pad * 2);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(16, h - 56, boxW, 40);
      ctx.fillStyle = "#fff";
      ctx.fillText(advice, 16 + pad, h - 36);
    }
  };

  const renderOverlay = () => {
    const canvas = overlayCanvasRef.current;
    const video = liveVideoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (vw === 0 || vh === 0) {
      // try again; keep video visible below canvas
      renderRafRef.current = requestAnimationFrame(renderOverlay);
      return;
    }
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }
    // Draw video frame first so the recording contains the video, then overlay
    ctx.drawImage(video, 0, 0, vw, vh);
    // Draw pose overlay if available
    const pose = latestLivePoseRef.current;
    if (pose?.keypoints?.length) {
      drawSkeleton(ctx, pose);
      drawKeypoints(ctx, pose.keypoints);
    }
    // Draw HUD (similarity + diffs)
    drawHud(ctx, vw, vh);

    if (analyzingRef.current) {
      renderRafRef.current = requestAnimationFrame(renderOverlay);
    }
  };

  const setupOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    
    // Start render loop for analysis overlay only
    if (renderRafRef.current) cancelAnimationFrame(renderRafRef.current);
    renderRafRef.current = requestAnimationFrame(renderOverlay);
    
    console.log("[Overlay] Analysis overlay started");
  };



  const buildAdviceFromTopDiff = () => {
    const diffs = latestTopDiffsRef.current || [];
    if (!diffs.length) return "";
    const top = diffs[0];
    const [side, jointName] = top.joint.split("_");
    const ua = top.ua ?? 0;
    const ra = top.ra ?? 0;
    const sideWord = side === "left" ? "left" : side === "right" ? "right" : "";
    const dir = ua - ra;
    if (jointName === "shoulder") {
      if (ua < ra - ANGLE_DIFF_THRESHOLD) return `Raise your ${sideWord} arm`;
      if (ua > ra + ANGLE_DIFF_THRESHOLD) return `Lower your ${sideWord} arm`;
    } else if (jointName === "elbow") {
      if (ua > ra + ANGLE_DIFF_THRESHOLD) return `Bend your ${sideWord} elbow more`;
      if (ua < ra - ANGLE_DIFF_THRESHOLD) return `Straighten your ${sideWord} elbow`;
    } else if (jointName === "knee") {
      if (ua > ra + ANGLE_DIFF_THRESHOLD) return `Bend your ${sideWord} knee more`;
      if (ua < ra - ANGLE_DIFF_THRESHOLD) return `Straighten your ${sideWord} knee`;
    } else if (jointName === "hip") {
      if (ua > ra + ANGLE_DIFF_THRESHOLD) return "Bring your torso more upright";
      if (ua < ra - ANGLE_DIFF_THRESHOLD) return "Lean forward slightly";
    }
    // fallback to existing first tip
    return (latestTipsRef.current && latestTipsRef.current[0]) || "Good form";
  };

  const maybeSpeakAdvice = () => {
    if (!voiceOn || !supportsSpeech || !speechReady) return;
    if (document.visibilityState === "hidden") return;
    const primary = buildAdviceFromTopDiff();
    if (!primary) return;
    const now = Date.now();
    if (primary === lastSpokenRef.current && now - lastSpeakAtRef.current < ADVICE_INTERVAL_MS) return;
    if (isSpeakingRef.current && now - lastSpeakAtRef.current < ADVICE_INTERVAL_MS) return;
    try {
      const utter = new SpeechSynthesisUtterance(primary);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      if (selectedVoiceRef.current) utter.voice = selectedVoiceRef.current;
      utter.onstart = () => { isSpeakingRef.current = true; };
      utter.onend = () => { isSpeakingRef.current = false; };
      window.speechSynthesis.speak(utter);
      lastSpokenRef.current = primary;
      lastSpeakAtRef.current = now;
    } catch (e) {
      console.warn("[TTS] speak error:", e?.message);
    }
  };



  const handleToggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (next) {
      if (!supportsSpeech) {
        setFeedback("Voice not supported by this browser.");
        return;
      }
      try {
        const utter = new SpeechSynthesisUtterance("Voice guidance on");
        if (selectedVoiceRef.current) utter.voice = selectedVoiceRef.current;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch {}
    } else {
      try { window.speechSynthesis?.cancel(); } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Form Comparison</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload a reference video/photo and mirror your movement with live feedback.</p>
          </div>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-2 items-center">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm cursor-pointer">
              <IconUpload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm text-gray-800 dark:text-gray-200">Upload reference</span>
              <input type="file" accept="video/*,image/*" onChange={handleUpload} className="hidden" />
            </label>
            {!isCameraOn ? (
              <div className="flex gap-2">
                <button 
                  onClick={startCamera} 
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm inline-flex items-center gap-2 transition-colors duration-200"
                >
                  <IconCamera className="w-4 h-4" /> Start Camera
                </button>
                {feedback.includes("Unable to access camera") && (
                  <button 
                    onClick={startCamera} 
                    className="px-2 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm inline-flex items-center gap-2 transition-colors duration-200"
                    title="Retry camera startup"
                  >
                    <IconCamera className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={stopCamera} 
                className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 inline-flex items-center gap-2 transition-colors duration-200"
              >
                <IconCamera className="w-4 h-4" /> Stop Camera
              </button>
            )}
            {!isAnalyzing ? (
              <button onClick={startAnalysis} disabled={!canAnalyze || isCountdown || !debugInfo.detectorReady} className={`px-3 py-2 rounded-lg inline-flex items-center gap-2 ${!canAnalyze || isCountdown || !debugInfo.detectorReady ? "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500" : "bg-green-600 text-white shadow-sm"}`}>
                <IconPlay className="w-4 h-4" /> Start Analysis
              </button>
            ) : (
              <button onClick={stopAnalysis} className="px-3 py-2 rounded-lg bg-red-600 text-white shadow-sm inline-flex items-center gap-2"><IconStop className="w-4 h-4" /> Stop Analysis</button>
            )}
            {isCountdown && (
              <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 font-medium">{countdownValue}</span>
            )}

            <button onClick={handleToggleVoice} className={`px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-2 ${voiceOn ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300" : "bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-200"}`}>
              {voiceOn ? <IconVolumeOn className="w-4 h-4" /> : <IconVolumeOff className="w-4 h-4" />} {voiceOn ? "Voice on" : "Voice off"}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-5">
          {/* Reference panel */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="col-span-12 md:col-span-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="font-medium text-gray-900 dark:text-gray-100">Reference</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{refVideoUrl ? "Video" : refImageUrl ? "Photo" : "None"}</div>
              </div>
              <div className="aspect-video bg-black">
                {refVideoUrl ? (
                  <video ref={refVideoRef} src={refVideoUrl} playsInline muted loop className="w-full h-full object-cover" />
                ) : refImageUrl ? (
                  <img ref={refImageRef} src={refImageUrl} alt="reference" className="w-full h-full object-contain bg-black" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Upload a video or photo</div>
                )}
              </div>
              {(refVideoUrl || refImageUrl) && (
                <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-800">Size: {debugInfo.refSize || "-"}</div>
              )}
            </div>
          </motion.div>

          {/* Live + Analysis */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-12 md:col-span-8 flex flex-col gap-5">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden relative">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="font-medium text-gray-900 dark:text-gray-100">Live Camera</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Size: {debugInfo.liveSize || "-"}</div>
              </div>
              <div className="aspect-video bg-black relative">
                {/* Keep the video visible to confirm camera works; overlay draws on top */}
                <video ref={liveVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                {isAnalyzing && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow">Analyzing</div>
                )}
                {isCountdown && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-black/50 text-white flex items-center justify-center text-3xl font-bold">
                      {countdownValue}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="font-medium text-gray-900 dark:text-gray-100">Real-time Analysis</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Similarity: <span className="font-semibold">{similarity.toFixed(1)}%</span></div>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all`} style={{ width: `${similarity}%`, backgroundColor: similarity >= 75 ? "#16a34a" : similarity >= 50 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-200">Guidance</div>
                    <div className="flex flex-wrap gap-2">
                      {tips.length ? (
                        tips.map((t, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{t}</span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feedback}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-200">Top differences</div>
                    {topDiffs.length ? (
                      <div className="flex flex-col gap-2">
                        {topDiffs.map((d) => (
                          <div key={d.joint} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            <div className="text-sm font-medium capitalize text-gray-900 dark:text-gray-200">{d.joint.replace(/_/g, " ")}</div>
                            <div className={`text-sm font-semibold ${d.diff >= 20 ? "text-red-600" : d.diff >= 10 ? "text-amber-600" : "text-green-600"}`}>{d.diff.toFixed(1)}°</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-300">Move into frame to see differences.</div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button onClick={() => setShowDetails((s) => !s)} className="text-sm px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {showDetails ? "Hide details" : "Show details"}
                  </button>
                  {showDetails && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="font-medium mb-2 text-sm text-gray-900 dark:text-gray-200">Your angles</div>
                        <AngleList angles={userAngles} />
                      </div>
                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="font-medium mb-2 text-sm text-gray-900 dark:text-gray-200">Reference angles</div>
                        <AngleList angles={referenceAngles} />
                      </div>
                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="font-medium mb-2 text-sm text-gray-900 dark:text-gray-200">Differences</div>
                        <AngleList angles={angleDifferences} suffix="°" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


          </motion.div>
        </div>

        {showDebug && (
          <div className="mt-5 p-3 border rounded-lg text-xs font-mono bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm">
            <div className="font-semibold mb-2">Debug</div>
            <div className="grid grid-cols-2 md-grid-cols-4 md:grid-cols-4 gap-2">
              <div>backend: {debugInfo.backend || "(loading)"}</div>
              <div>detector: {debugInfo.detectorReady ? "ready" : "loading"}</div>
              <div>camera: {debugInfo.cameraOn ? "on" : "off"}</div>
              <div>live: {debugInfo.liveSize}</div>
              <div>ref: {debugInfo.refSize}</div>
              <div>kp live/ref: {debugInfo.liveKP}/{debugInfo.refKP}</div>
              <div>angles live/ref: {debugInfo.liveAngles}/{debugInfo.refAngles}</div>
              <div>similarity: {debugInfo.similarity.toFixed(1)}%</div>
            </div>
            <div className="mt-2">top diffs:</div>
            <ul className="list-disc ml-5">
              {debugInfo.topDiffs.map((d) => (
                <li key={d.joint}>{d.joint}: {d.diff.toFixed(1)}° (you {d.ua?.toFixed(1)}°, ref {d.ra?.toFixed(1)}°)</li>
              ))}
              {!debugInfo.topDiffs.length && <li>n/a</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

function AngleList({ angles, suffix = "°" }) {
  const entries = Object.entries(angles || {});
  if (!entries.length) return <div className="text-sm text-gray-500">No data</div>;
  return (
    <ul className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
      {entries.map(([k, v]) => (
        <li key={k} className="flex justify-between"><span>{k.replace(/_/g, " ")}</span><span>{v.toFixed(1)}{suffix}</span></li>
      ))}
    </ul>
  );
}

export default VideoComparison;


