export interface Problem {
  id: string;
  title: string;
  domain: string;
  author: string;
  postedDate: string;
  upvotes: number;
  downvotes: number;
  description: string;
  abstract: string;
  proposedSolution: string;
  authorDetails: {
    name: string;
    image: string;
    followers: number;
    following: number;
    contributions: number;
  };
  links: Array<{
    title: string;
    url: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }>;
}

export const mockProblems: Problem[] = [
  {
    id: "PRB001",
    title: "Reducing Carbon Footprint in Urban Transportation Systems",
    domain: "Environment",
    author: "Dr. Sarah Chen",
    postedDate: "2 months ago",
    upvotes: 234,
    downvotes: 12,
    description: "Urban areas face significant challenges in reducing carbon emissions from transportation. Current public transit systems are inefficient, and private vehicle usage continues to dominate. We need innovative solutions that combine technology, policy, and behavioral change to create sustainable urban mobility.",
    abstract: "This research explores the integration of AI-powered route optimization, electric vehicle infrastructure, and behavioral nudging systems to reduce urban transportation emissions by 40% over 5 years.",
    proposedSolution: "A multi-tiered approach combining: 1) ML-based traffic flow optimization, 2) Incentivized EV adoption programs, 3) Smart micro-mobility networks, 4) Real-time air quality monitoring integrated with navigation apps.",
    authorDetails: {
      name: "Dr. Sarah Chen",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      followers: 1245,
      following: 432,
      contributions: 23,
    },
    links: [
      { title: "Research Paper Draft", url: "#" },
      { title: "GitHub Repository", url: "#" },
      { title: "Dataset", url: "#" },
    ],
    comments: [
      {
        id: "1",
        author: "John Smith",
        content: "This is a comprehensive approach! Have you considered the economic impact on low-income communities?",
        timestamp: "1 week ago",
      },
      {
        id: "2",
        author: "Maria Garcia",
        content: "Excellent work. I'd love to collaborate on the ML optimization aspect.",
        timestamp: "5 days ago",
      },
    ],
  },
  {
    id: "PRB002",
    title: "AI-Powered Early Detection System for Crop Diseases",
    domain: "Artificial Intelligence",
    author: "Prof. Rajesh Kumar",
    postedDate: "1 month ago",
    upvotes: 189,
    downvotes: 8,
    description: "Agricultural losses due to undetected crop diseases cost billions annually. Farmers need accessible, real-time diagnostic tools that work in remote areas with limited internet connectivity.",
    abstract: "Developing a lightweight CNN model optimized for edge devices that can identify 50+ crop diseases with 95% accuracy using smartphone cameras, working offline with periodic cloud sync.",
    proposedSolution: "Mobile-first application with offline-capable ML model, community-driven disease database, and automated advisory system connected to local agricultural experts.",
    authorDetails: {
      name: "Prof. Rajesh Kumar",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      followers: 892,
      following: 234,
      contributions: 34,
    },
    links: [
      { title: "Technical Whitepaper", url: "#" },
      { title: "Model Architecture", url: "#" },
    ],
    comments: [],
  },
  {
    id: "PRB003",
    title: "Decentralized Healthcare Records Using Blockchain",
    domain: "Healthcare",
    author: "Dr. Emily Rodriguez",
    postedDate: "3 weeks ago",
    upvotes: 156,
    downvotes: 23,
    description: "Patient health records are fragmented across multiple providers, leading to redundant tests, medication errors, and poor continuity of care. We need a secure, patient-controlled system for health data management.",
    abstract: "A blockchain-based framework that gives patients complete ownership of their health data while enabling secure, granular sharing with healthcare providers through smart contracts and zero-knowledge proofs.",
    proposedSolution: "Hybrid blockchain architecture combining public Ethereum mainnet for immutable audit logs and private consortium chains for sensitive data, with IPFS for encrypted document storage.",
    authorDetails: {
      name: "Dr. Emily Rodriguez",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      followers: 2103,
      following: 567,
      contributions: 45,
    },
    links: [
      { title: "Protocol Documentation", url: "#" },
      { title: "Prototype Demo", url: "#" },
      { title: "Security Audit", url: "#" },
    ],
    comments: [
      {
        id: "1",
        author: "David Lee",
        content: "HIPAA compliance considerations?",
        timestamp: "2 weeks ago",
      },
    ],
  },
  {
    id: "PRB004",
    title: "Adaptive Learning Platform for Personalized Education",
    domain: "Education",
    author: "Prof. Michael Torres",
    postedDate: "4 weeks ago",
    upvotes: 298,
    downvotes: 15,
    description: "One-size-fits-all education fails to address individual learning styles, paces, and needs. Students fall behind or lose interest when content doesn't match their optimal learning pathway.",
    abstract: "An AI-driven adaptive learning system that continuously assesses student performance, learning style, and engagement to deliver personalized content, pacing, and teaching methodologies.",
    proposedSolution: "Multi-modal learning platform with real-time performance analytics, dynamic content generation, gamification elements, and teacher dashboards for intervention tracking.",
    authorDetails: {
      name: "Prof. Michael Torres",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      followers: 1567,
      following: 423,
      contributions: 28,
    },
    links: [
      { title: "Pilot Study Results", url: "#" },
      { title: "Platform Demo", url: "#" },
    ],
    comments: [],
  },
  {
    id: "PRB005",
    title: "Quantum-Resistant Cryptography for IoT Devices",
    domain: "Technology",
    author: "Dr. Lisa Zhang",
    postedDate: "5 days ago",
    upvotes: 142,
    downvotes: 7,
    description: "As quantum computing advances, current encryption methods securing IoT devices will become vulnerable. Billions of connected devices need quantum-resistant security before quantum computers become practical.",
    abstract: "Implementing post-quantum cryptographic algorithms optimized for resource-constrained IoT devices, with backward compatibility and minimal performance overhead.",
    proposedSolution: "Hybrid cryptographic protocol combining lattice-based and hash-based signatures, with hardware-accelerated implementations for common IoT chipsets and secure firmware update mechanisms.",
    authorDetails: {
      name: "Dr. Lisa Zhang",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150",
      followers: 734,
      following: 189,
      contributions: 19,
    },
    links: [
      { title: "Algorithm Benchmarks", url: "#" },
      { title: "Reference Implementation", url: "#" },
    ],
    comments: [
      {
        id: "1",
        author: "Alex Johnson",
        content: "Have you considered NIST's recommendations?",
        timestamp: "3 days ago",
      },
    ],
  },
  {
    id: "PRB006",
    title: "Microplastic Filtration for Ocean Water Purification",
    domain: "Environment",
    author: "Dr. Ocean Martinez",
    postedDate: "1 week ago",
    upvotes: 421,
    downvotes: 18,
    description: "Microplastics contaminate oceans at alarming rates, affecting marine life and entering the food chain. Current filtration methods are too expensive or inefficient for large-scale deployment.",
    abstract: "Novel bio-inspired filtration membrane using nanocellulose and magnetic nanoparticles to capture microplastics as small as 1 micron, with 98% efficiency and low energy consumption.",
    proposedSolution: "Scalable membrane manufacturing process using sustainable materials, modular filtration units for deployment at river mouths and coastal areas, with automated cleaning systems.",
    authorDetails: {
      name: "Dr. Ocean Martinez",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      followers: 1893,
      following: 345,
      contributions: 41,
    },
    links: [
      { title: "Lab Results", url: "#" },
      { title: "Manufacturing Process", url: "#" },
      { title: "Environmental Impact Study", url: "#" },
    ],
    comments: [],
  },
];
