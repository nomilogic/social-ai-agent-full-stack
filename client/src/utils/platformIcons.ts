import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music as TikTokIcon,
} from "lucide-react";
import { Platform } from "../types";

export const getPlatformIcon = (platform: Platform) => {
  const icons = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    tiktok: TikTokIcon,
    youtube: Youtube,
  };
  return icons[platform];
};

export const getPlatformColors = (platform: Platform) => {
  const colors = {
    facebook: "bg-blue-600 border-blue-200 text-blue-600",
    instagram:
      "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-200 text-purple-600",
    twitter: "bg-black border-gray-300 text-black",
    linkedin: "bg-blue-700 border-blue-200 text-blue-700",
    tiktok: "bg-black border-gray-300 text-black",
    youtube: "bg-red-600 border-red-200 text-red-600",
  };
  return colors[platform] || "bg-gray-600 border-gray-200 text-gray-600";
};

export const getPlatformBackgroundColors = (platform: Platform) => {
  const colors = {
    facebook: "bg-blue-50 border-blue-200",
    instagram: "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200",
    twitter: "bg-gray-50 border-gray-200",
    linkedin: "bg-blue-50 border-blue-200",
    tiktok: "bg-gray-50 border-gray-200",
    youtube: "bg-red-50 border-red-200",
  };
  return colors[platform] || "bg-gray-50 border-gray-200";
};

export const getPlatformDisplayName = (platform: Platform) => {
  const names = {
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  return names[platform] || platform;
};

export const platformOptions = [
  {
    id: "facebook" as Platform,
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-white",
    borderColor: "border-blue-200",
  },
  {
    id: "instagram" as Platform,
    name: "Instagram",
    icon: Instagram,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  // {
  //   id: "twitter" as Platform,
  //   name: "Twitter",
  //   icon: Twitter,
  //   color: "text-black",
  //   bgColor: "bg-gray-50",
  //   borderColor: "border-gray-200",
  // },
  {
    id: "linkedin" as Platform,
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-white",
    borderColor: "border-blue-200",
  },
  {
    id: "tiktok" as Platform,
    name: "TikTok",
    icon: TikTokIcon,
    color: "text-black",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  {
    id: "youtube" as Platform,
    name: "YouTube",
    icon: Youtube,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
];
