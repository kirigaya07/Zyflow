"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Play,
  Square,
  Settings,
  Zap,
  DollarSign,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Activity,
  Mic,
  Brain,
  Cloud,
  Bell,
} from "lucide-react";

export default function ZoomWatcherControl() {
  const [isWatching, setIsWatching] = useState(false);
  const [zoomFolderPath, setZoomFolderPath] = useState(
    "C:\\Users\\anmol\\OneDrive\\Documents\\Zoom"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [enableWhisper, setEnableWhisper] = useState(true);
  const [dailyBudget, setDailyBudget] = useState([2.0]); // $2.00 default
  const [processedToday, setProcessedToday] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState("idle");

  // Simulate real-time updates
  useEffect(() => {
    if (isWatching) {
      const interval = setInterval(() => {
        // Simulate random activity updates
        const activities = [
          "Watching for new meetings...",
          "Scanning folder structure...",
          "Ready to process audio files",
          "Monitoring file changes...",
        ];
        setCurrentStatus(
          activities[Math.floor(Math.random() * activities.length)]
        );
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setCurrentStatus("idle");
    }
  }, [isWatching]);

  const startWatcher = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/zoom-watcher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          zoomFolderPath: zoomFolderPath,
        }),
      });

      const result = await response.json();

      if (result.message === "success") {
        setIsWatching(true);
        toast.success("🚀 Zoom Automation Started!", {
          description: "Your meeting summaries are now automated!",
        });
      } else {
        toast.error(`Failed to start watcher: ${result.message}`);
      }
    } catch (error) {
      toast.error("Error starting watcher");
      console.error("Start watcher error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopWatcher = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/zoom-watcher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "stop",
        }),
      });

      const result = await response.json();

      if (result.message === "success") {
        setIsWatching(false);
        toast.success("⏹️ Automation Stopped", {
          description: "Zoom folder monitoring has been disabled",
        });
      } else {
        toast.error(`Failed to stop watcher: ${result.message}`);
      }
    } catch (error) {
      toast.error("Error stopping watcher");
      console.error("Stop watcher error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testTranscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-bypass": "1",
        },
        body: JSON.stringify({
          path: "C:\\Users\\anmol\\OneDrive\\Documents\\Zoom\\2025-10-22 10.51.33 kirigaya kirito's Zoom Meeting\\audio1474378777.m4a",
        }),
      });

      const result = await response.json();

      if (result.message === "ok") {
        toast.success("🎤 Test Transcription Complete!", {
          description: "Check your Google Drive for the results",
        });
        setProcessedToday((prev) => prev + 1);
        setLastActivity(new Date().toLocaleTimeString());
      } else {
        toast.error("Test transcription failed");
      }
    } catch (error) {
      toast.error("Error testing transcription");
      console.error("Test transcription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedCostPerMeeting = enableWhisper ? 0.005 : 0.0001;
  const dailyMeetingLimit = Math.floor(
    dailyBudget[0] / estimatedCostPerMeeting
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Control Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                🎥 Zoom Meeting Automation
              </CardTitle>
              <CardDescription className="text-gray-600">
                Automatically convert your Zoom recordings into AI-powered
                meeting summaries
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Folder Path */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Zoom Recording Folder
            </label>
            <Input
              type="text"
              value={zoomFolderPath}
              onChange={(e) => setZoomFolderPath(e.target.value)}
              placeholder="C:\\Users\\anmol\\OneDrive\\Documents\\Zoom"
              className="font-mono text-sm"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            <Button
              onClick={startWatcher}
              disabled={isLoading || isWatching}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? "Starting..." : "Start Automation"}
            </Button>

            <Button
              onClick={stopWatcher}
              disabled={isLoading || !isWatching}
              variant="destructive"
              className="px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              {isLoading ? "Stopping..." : "Stop Automation"}
            </Button>

            <Button
              onClick={testTranscription}
              disabled={isLoading}
              variant="outline"
              className="px-6 py-2 rounded-lg font-semibold flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Mic className="h-4 w-4" />
              Test Transcription
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  isWatching ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
              <div>
                <p className="font-semibold text-gray-800">
                  {isWatching
                    ? "🟢 Automation Active"
                    : "⚫ Automation Inactive"}
                </p>
                <p className="text-sm text-gray-600">{currentStatus}</p>
              </div>
            </div>
            {lastActivity && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Last: {lastActivity}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Whisper Settings Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                🎤 Speech-to-Text Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure OpenAI Whisper for real-time audio transcription
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Whisper Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-800">
                  Enable Whisper Transcription
                </p>
                <p className="text-sm text-gray-600">
                  {enableWhisper
                    ? "Real audio-to-text conversion"
                    : "Placeholder transcripts only"}
                </p>
              </div>
            </div>
            <Switch
              checked={enableWhisper}
              onCheckedChange={setEnableWhisper}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          {/* Daily Budget */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-700">
                Daily Budget: ${dailyBudget[0].toFixed(2)}
              </label>
            </div>
            <Slider
              value={dailyBudget}
              onValueChange={setDailyBudget}
              max={10}
              min={0.5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0.50</span>
              <span>$10.00</span>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold">Per Meeting</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                ${estimatedCostPerMeeting.toFixed(4)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold">Daily Limit</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {dailyMeetingLimit} meetings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                📊 Today's Activity
              </CardTitle>
              <CardDescription className="text-gray-600">
                Track your automation performance and usage
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {processedToday}
              </div>
              <div className="text-sm text-gray-600">Meetings Processed</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                ${(processedToday * estimatedCostPerMeeting).toFixed(3)}
              </div>
              <div className="text-sm text-gray-600">Spent Today</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {(
                  ((processedToday * estimatedCostPerMeeting) /
                    dailyBudget[0]) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-gray-600">Budget Used</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Daily Budget Progress</span>
              <span>
                ${(processedToday * estimatedCostPerMeeting).toFixed(3)} / $
                {dailyBudget[0].toFixed(2)}
              </span>
            </div>
            <Progress
              value={
                ((processedToday * estimatedCostPerMeeting) / dailyBudget[0]) *
                100
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Automation Flow Card */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Brain className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                🔄 Complete Automation Flow
              </CardTitle>
              <CardDescription className="text-gray-600">
                See exactly how your meetings get processed automatically
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">1. File Detection</p>
                  <p className="text-xs text-gray-600">
                    Monitors Zoom folder for new recordings
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mic className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    2. Audio Transcription
                  </p>
                  <p className="text-xs text-gray-600">
                    {enableWhisper
                      ? "OpenAI Whisper converts audio to text"
                      : "Placeholder transcript generated"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Brain className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">3. AI Summary</p>
                  <p className="text-xs text-gray-600">
                    ChatGPT generates meeting summary
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Cloud className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">4. Save to Drive</p>
                  <p className="text-xs text-gray-600">
                    Transcript and summary uploaded to Google Drive
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Bell className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">5. Notifications</p>
                  <p className="text-xs text-gray-600">
                    Alerts sent to all connected platforms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">6. Complete!</p>
                  <p className="text-xs text-gray-600">
                    Meeting fully processed and documented
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
