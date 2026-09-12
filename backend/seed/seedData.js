import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import InterviewPreset from "../models/InterviewPreset.js";
import InterviewQuestion from "../models/InterviewQuestion.js";

const presets = [
  {
    name: "Full Stack Developer",
    slug: "full-stack-developer",
    mode: "Technical",
    role: "Full Stack Developer",
    description: "Comprehensive assessment covering React, Node.js, Databases, and Algorithm logic.",
    duration: 45,
    questionCount: 4,
    difficulty: "Medium",
    topics: ["React", "Node.js", "Databases", "DSA"],
    badge: "Popular",
    active: true,
  },
  {
    name: "Frontend Developer",
    slug: "frontend-developer",
    mode: "Technical",
    role: "Frontend Developer",
    description: "Deep dive into React, Virtual DOM, State Management, and Modern Frontend Architecture.",
    duration: 45,
    questionCount: 4,
    difficulty: "Medium",
    topics: ["React", "JavaScript", "Frontend Architecture", "Performance"],
    badge: "Recommended",
    active: true,
  },
  {
    name: "Backend Developer",
    slug: "backend-developer",
    mode: "Mixed",
    role: "Backend Developer",
    description: "Backend APIs, Event Loop, Microservices, Indexing, and Distributed Caching.",
    duration: 50,
    questionCount: 4,
    difficulty: "Hard",
    topics: ["Node.js", "REST APIs", "Databases", "System Design"],
    badge: "Advanced",
    active: true,
  },
  {
    name: "Software Engineer — Behavioral",
    slug: "behavioral-software-engineer",
    mode: "HR",
    role: "Software Engineer",
    description: "STAR method interview evaluating Leadership, Conflict Resolution, and Technical Communication.",
    duration: 30,
    questionCount: 5,
    difficulty: "Easy",
    topics: ["Leadership", "Conflict", "Teamwork", "Failure", "Communication"],
    badge: "Essential",
    active: true,
  },
  {
    name: "Software Engineer — System Design",
    slug: "system-design-software-engineer",
    mode: "Mixed",
    role: "Software Engineer",
    description: "High-scale System Design: Distributed Rate Limiters, Load Balancing, and Sharding.",
    duration: 50,
    questionCount: 4,
    difficulty: "Hard",
    topics: ["Scalability", "Distributed Systems", "APIs", "Databases", "Caching"],
    badge: "Expert",
    active: true,
  },
];

const questions = [
  // --- Full Stack & Frontend Questions ---
  {
    question: "How does React Virtual DOM diffing algorithm work, and how do key props optimize re-renders?",
    role: "Frontend Developer",
    mode: "Technical",
    topic: "React",
    difficulty: "Medium",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "React uses a heuristic O(n) diffing algorithm based on element types and keys. When keys match across renders, React moves elements rather than tearing down and rebuilding subtrees.",
    active: true,
  },
  {
    question: "Explain the difference between state management using React Context API vs Redux Toolkit in large-scale applications.",
    role: "Frontend Developer",
    mode: "Technical",
    topic: "Frontend Architecture",
    difficulty: "Medium",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "React Context is designed for low-frequency updates like themes or auth tokens. Redux Toolkit provides memoized selectors, middleware, and predictable state mutation suited for frequent state transitions.",
    active: true,
  },
  {
    question: "How would you optimize web performance metrics like LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) in a React SPA?",
    role: "Frontend Developer",
    mode: "Technical",
    topic: "Performance",
    difficulty: "Hard",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "LCP is optimized by preloading hero assets, code-splitting heavy components with React.lazy(), and using SSR/SSG. CLS is minimized by explicitly sizing media containers and avoiding dynamically inserted content above existing DOM elements.",
    active: true,
  },
  {
    question: "Explain JavaScript Event Loop, Microtasks (Promises), and Macrotasks (setTimeout) execution order.",
    role: "Frontend Developer",
    mode: "Technical",
    topic: "JavaScript",
    difficulty: "Medium",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "The Event Loop executes the current call stack, drains ALL pending microtasks in the queue (Promise callbacks, process.nextTick), and then picks ONE macrotask (setTimeout, setInterval) from the task queue.",
    active: true,
  },

  // --- Backend Questions ---
  {
    question: "Explain Event Loop phases in Node.js and how process.nextTick() differs from setImmediate().",
    role: "Backend Developer",
    mode: "Technical",
    topic: "Node.js",
    difficulty: "Medium",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "Node.js Event Loop phases include Timers, Pending Callbacks, Poll, and Check (setImmediate). process.nextTick fires immediately after the current operation finishes before the event loop continues to the next phase.",
    active: true,
  },
  {
    question: "How do database indexes (B-Tree & Hash) improve lookup performance, and what are the trade-offs on Write/Insert throughput?",
    role: "Backend Developer",
    mode: "Technical",
    topic: "Databases",
    difficulty: "Medium",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "Indexes create balanced lookup trees (B-Trees) allowing O(log N) search queries instead of sequential O(N) collection scans. The trade-off is write overhead, as every INSERT/UPDATE/DELETE requires updating the index structures.",
    active: true,
  },
  {
    question: "Write a function in C++ to find the longest substring without repeating characters in a given string.",
    role: "Full Stack Developer",
    mode: "Technical",
    topic: "DSA",
    difficulty: "Medium",
    type: "Coding",
    evaluationType: "judge0",
    language: "cpp",
    starterCode: `#include <iostream>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    // Write your solution here\n    return 0;\n}\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << lengthOfLongestSubstring(s);\n    }\n    return 0;\n}`,
    referenceSolution: `#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    vector<int> dict(256, -1);\n    int maxLen = 0, start = -1;\n    for (int i = 0; i < s.length(); i++) {\n        if (dict[s[i]] > start) start = dict[s[i]];\n        dict[s[i]] = i;\n        maxLen = max(maxLen, i - start);\n    }\n    return maxLen;\n}\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << lengthOfLongestSubstring(s);\n    } else {\n        cout << 0;\n    }\n    return 0;\n}`,
    testInputs: ["abcabcbb", "bbbbb", "pwwkew"],
    idealAnswer: "Use Sliding Window technique with two pointers or character index tracking to maintain maximum substring window length in O(N) time.",
    active: true,
  },
  {
    question: "Design a distributed rate limiter for a high-throughput API gateway processing 100k req/sec.",
    role: "Software Engineer",
    mode: "Mixed",
    topic: "System Design",
    difficulty: "Hard",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "Use Redis with Sliding Window Counter or Token Bucket algorithm via Lua scripts for atomic increments. Implement local memory caching with fallback to Redis cluster to reduce latency.",
    active: true,
  },

  // --- Behavioral Questions ---
  {
    question: "Describe a situation where you had a major technical disagreement on software architecture. How did you resolve it?",
    role: "Software Engineer",
    mode: "HR",
    topic: "Conflict",
    difficulty: "Easy",
    type: "HR",
    evaluationType: "spoken",
    idealAnswer: "Use STAR method: Explain the Situation, your Task, the Action taken (building benchmark POCs and presenting objective trade-off data), and the Result (team consensus and successful deployment).",
    active: true,
  },
  {
    question: "Tell me about a project or production outage where something went wrong. What did you learn and how did you mitigate future risks?",
    role: "Software Engineer",
    mode: "HR",
    topic: "Failure",
    difficulty: "Medium",
    type: "HR",
    evaluationType: "spoken",
    idealAnswer: "Detail the incident root cause, immediate response (rollback/hotfix), and blameless post-mortem actions such as automated regression tests, monitoring alerts, and circuit breakers.",
    active: true,
  },
  {
    question: "How do you handle tight deadlines when project requirements are ambiguous or rapidly changing?",
    role: "Software Engineer",
    mode: "HR",
    topic: "Leadership",
    difficulty: "Easy",
    type: "HR",
    evaluationType: "spoken",
    idealAnswer: "Focus on ruthless prioritization, breaking tasks down into MVP milestones, communicating trade-offs proactively with stakeholders, and maintaining iterative delivery.",
    active: true,
  },

  // --- System Design Questions ---
  {
    question: "How would you architect a real-time notification service delivering push notifications to millions of concurrent active users?",
    role: "Software Engineer",
    mode: "Mixed",
    topic: "Distributed Systems",
    difficulty: "Hard",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "Decouple notification producers and consumers using message queues like Kafka or RabbitMQ, use WebSockets/SSE for client connections, and scale stateful gateway servers behind a load balancer.",
    active: true,
  },
  {
    question: "Explain database sharding vs replication strategies for handling high read and write volumes.",
    role: "Software Engineer",
    mode: "Mixed",
    topic: "Scalability",
    difficulty: "Hard",
    type: "Technical",
    evaluationType: "spoken",
    idealAnswer: "Replication copies data across read replicas to scale read queries. Sharding partitions data horizontally across independent database nodes by a shard key to scale write throughput.",
    active: true,
  }
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    // Seed Presets via upsert
    for (const preset of presets) {
      await InterviewPreset.findOneAndUpdate(
        { slug: preset.slug },
        preset,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`Successfully seeded ${presets.length} Interview Presets.`);

    // Seed Questions via upsert
    for (const q of questions) {
      await InterviewQuestion.findOneAndUpdate(
        { question: q.question },
        q,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`Successfully seeded ${questions.length} Curated Interview Questions.`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
