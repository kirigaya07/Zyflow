import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Brain,
  Cloud,
  Bell,
  Play,
  Settings,
  BarChart3,
  Calendar,
  Mic,
  DollarSign,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  getAutomationStatus,
  getConnectionStatus,
  getDashboardStats,
  getRecentActivity,
} from "./_actions/dashboard-actions";

const DashboardPage = async () => {
  const stats = await getDashboardStats();
  const recentActivity = await getRecentActivity();
  const connections = await getConnectionStatus();
  await getAutomationStatus();

  const quickActions = [
    {
      title: "Start Zoom Automation",
      description: "Begin monitoring for new meetings",
      icon: Play,
      color: "bg-green-500",
      action: "start",
    },
    {
      title: "Test Transcription",
      description: "Process a sample audio file",
      icon: Mic,
      color: "bg-purple-500",
      action: "test",
    },
    {
      title: "View Workflows",
      description: "Manage your automation flows",
      icon: Settings,
      color: "bg-blue-500",
      action: "workflows",
    },
    {
      title: "Check Connections",
      description: "Review platform integrations",
      icon: Users,
      color: "bg-orange-500",
      action: "connections",
    },
  ];

  const connectionStatus = [
    {
      name: "Google Drive",
      status: connections.googleDrive ? "connected" : "disconnected",
      icon: Cloud,
    },
    {
      name: "Zoom",
      status: connections.zoom ? "connected" : "disconnected",
      icon: Mic,
    },
    {
      name: "Slack",
      status: connections.slack ? "connected" : "disconnected",
      icon: Bell,
    },
    {
      name: "Discord",
      status: connections.discord ? "connected" : "disconnected",
      icon: Users,
    },
    {
      name: "Notion",
      status: connections.notion ? "connected" : "disconnected",
      icon: FileText,
    },
    {
      name: "Email",
      status: connections.email ? "connected" : "disconnected",
      icon: Bell,
    },
  ];

  return (
    <div className="flex flex-col gap-6 relative p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here&apos;s what&apos;s happening with your
            automations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 px-3 py-1"
          >
            <Activity className="h-3 w-3 mr-1" />
            All Systems Active
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Workflows
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalWorkflows}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2 this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Meetings Processed
            </CardTitle>
            <Mic className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.meetingsProcessed}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12 this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Time Saved
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalSavings}h
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +3.2h this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.successRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.1% this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Activity className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest automation events and meeting processing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No recent activity</p>
                <p className="text-sm">
                  Create your first workflow to see activity here
                </p>
              </div>
            ) : (
              recentActivity.map(
                (activity: {
                  id: string;
                  type: string;
                  title: string;
                  time: string;
                  status: string;
                  duration?: string;
                  workflowId: string;
                  hasSummary: boolean;
                  hasTranscript: boolean;
                  isZoomWorkflow: boolean;
                }) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        activity.type === "meeting"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {activity.type === "meeting" ? (
                        <Mic className="h-4 w-4 text-green-600" />
                      ) : (
                        <Zap className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">
                          {activity.title}
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </span>
                        {activity.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.duration}
                          </span>
                        )}
                        {/* platform omitted in real data */}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )
              )
            )}
            <Button
              variant="outline"
              className="w-full mt-4 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Common automation tasks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start p-4 h-auto border-gray-200 hover:border-gray-300 hover:bg-white"
              >
                <div className={`p-2 rounded-lg mr-3 ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Connection Status & Automation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Connection Status
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Platform integrations health
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectionStatus.map((connection, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <connection.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="font-semibold text-gray-800">
                    {connection.name}
                  </span>
                </div>
                <Badge
                  variant={
                    connection.status === "connected"
                      ? "default"
                      : "destructive"
                  }
                  className={
                    connection.status === "connected"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {connection.status === "connected" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {connection.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Automation Status */}
        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Brain className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Automation Status
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Current automation performance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Zoom Monitoring
                </span>
                <Badge className="bg-green-100 text-green-700">
                  <Activity className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <Progress value={85} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Whisper Transcription
                </span>
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>
              <Progress value={92} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  AI Summaries
                </span>
                <Badge className="bg-green-100 text-green-700">
                  <Brain className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              </div>
              <Progress value={78} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly Cost</span>
                <span className="font-semibold text-gray-800">
                  ${stats.monthlyCost}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Budget Used</span>
                <span className="font-semibold text-gray-800">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Cost Efficiency
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  $0.18/meeting
                </p>
                <p className="text-xs text-gray-500">Average processing cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Calendar className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-teal-600">12 meetings</p>
                <p className="text-xs text-gray-500">Processed automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Productivity
                </p>
                <p className="text-2xl font-bold text-amber-600">+340%</p>
                <p className="text-xs text-gray-500">Meeting efficiency gain</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
