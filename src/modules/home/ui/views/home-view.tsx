"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { BotIcon, VideoIcon, BarChartIcon } from "lucide-react";

export const HomeView = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Image
            src="/logo2.svg"
            alt="AiTend Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <h1 className="text-4xl font-bold text-gray-900">AiTend</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Practice interviews with AI-powered coaches and improve your skills
          with personalized feedback
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BotIcon className="h-5 w-5 text-blue-600" />
              <span>AI Coaches</span>
            </CardTitle>
            <CardDescription>
              Create and manage your AI interview coaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/agents">
              <Button className="w-full">Browse Agents</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <VideoIcon className="h-5 w-5 text-green-600" />
              <span>Practice Sessions</span>
            </CardTitle>
            <CardDescription>
              View your interview sessions and recordings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/meetings">
              <Button variant="outline" className="w-full">
                View Meetings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>How AiTend Works</CardTitle>
          <CardDescription>
            Simple steps to improve your interview skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <BotIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold">Create AI Coach</h3>
              <p className="text-sm text-gray-600">
                Set up an AI interviewer with custom instructions and
                personality
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <VideoIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold">Practice Live</h3>
              <p className="text-sm text-gray-600">
                Join video calls with your AI coach for realistic interview
                practice
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <BarChartIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold">Get Feedback</h3>
              <p className="text-sm text-gray-600">
                Receive AI-powered analysis and suggestions to improve your
                performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Ready to Get Started?</CardTitle>
          <CardDescription className="text-blue-700">
            Create your first AI interview coach and start practicing today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Link href="/agents">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create Your First Agent
              </Button>
            </Link>
            <Link href="/meetings">
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                View Demo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
