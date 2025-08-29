import { IconType } from "react-icons";
import { FiGlobe } from "react-icons/fi";
import { FaLinkedin, FaGithub, FaXTwitter, FaKaggle, FaStackOverflow, FaMedium } from "react-icons/fa6";
import { SiLeetcode, SiHackerrank, SiCodeforces, SiCodechef, SiDevdotto } from "react-icons/si";
import type { PlatformKey } from "@/server/models/PublicProfile";

export const PLATFORM_META: Record<PlatformKey, { label: string; Icon: IconType }> = {
    linkedin: { label: "LinkedIn", Icon: FaLinkedin },
    github: { label: "GitHub", Icon: FaGithub },
    leetcode: { label: "LeetCode", Icon: SiLeetcode },
    hackerrank: { label: "HackerRank", Icon: SiHackerrank },
    codeforces: { label: "Codeforces", Icon: SiCodeforces },
    codechef: { label: "CodeChef", Icon: SiCodechef },
    twitter: { label: "Twitter/X", Icon: FaXTwitter },
    kaggle: { label: "Kaggle", Icon: FaKaggle },
    stackoverflow: { label: "Stack Overflow", Icon: FaStackOverflow },
    medium: { label: "Medium", Icon: FaMedium },
    custom: { label: "Custom", Icon: FiGlobe },
};
