/**
 * Academic Coursework Showcase — Seed Mock Data Store
 * js/store/mockData.js
 * Comprehensive, realistic academic showcase dataset across 10 entity domains.
 */

export const mockData = {
  users: [
    {
      id: "u1",
      name: "Harry Thorne",
      email: "harry@univ.edu",
      password: "Password123!",
      headline: "CS Senior & Distributed Systems Enthusiast",
      major: "Computer Science",
      department: "School of Computing",
      semester: "Fall 2026",
      university: "Pacific University",
      year: "Senior",
      bio: "Building fault-tolerant distributed systems and modern web applications. Teaching assistant for CS501. Passionate about consensus protocols, Go, and ASP.NET Core.",
      avatar: "assets/images/avatar-1.svg",
      coverImage: "assets/images/cover-default.svg",
      studentId: "PU-2023-CS042",
      gpa: "3.92",
      location: "Campus Science Center, Lab 304",
      skills: ["Go", "C++", "Distributed Systems", "JavaScript", "ASP.NET Core", "Docker"],
      courses: ["CS501", "WT301", "PH510", "SEC550"],
      friends: ["u2", "u3", "u4"],
      createdAt: "2024-09-01T08:00:00Z"
    },
    {
      id: "u2",
      name: "Elena Rostova",
      email: "elena@univ.edu",
      password: "Password123!",
      headline: "AI & Multimodal Vision Research Fellow",
      major: "Artificial Intelligence",
      department: "Data Science Institute",
      semester: "Fall 2026",
      university: "Pacific University",
      year: "Graduate",
      bio: "Focusing on 3D medical image segmentation and diffusion models for biomedical diagnostics. Research Fellow at the University ML Center.",
      avatar: "assets/images/avatar-2.svg",
      coverImage: "assets/images/cover-default.svg",
      studentId: "PU-2022-AI018",
      gpa: "4.00",
      location: "Data Science Tower, Room 512",
      skills: ["PyTorch", "Python", "Computer Vision", "TensorRT", "CUDA", "LaTeX"],
      courses: ["AI602", "DS520", "MATH502"],
      friends: ["u1", "u3", "u5"],
      createdAt: "2024-09-01T09:00:00Z"
    },
    {
      id: "u3",
      name: "Marcus Vance",
      email: "marcus@univ.edu",
      password: "Password123!",
      headline: "Software Engineering Sophomore & Web Dev",
      major: "Software Engineering",
      department: "School of Computing",
      semester: "Fall 2026",
      university: "Pacific University",
      year: "Sophomore",
      bio: "Crafting lightweight, responsive user interfaces with zero framework overhead. Robotics hobbyist and ACM Web Master.",
      avatar: "assets/images/avatar-3.svg",
      coverImage: "assets/images/cover-default.svg",
      studentId: "PU-2024-SE089",
      gpa: "3.78",
      location: "Founders Hall, East Wing",
      skills: ["JavaScript", "HTML5", "CSS3", "Node.js", "ROS 2", "C#"],
      courses: ["WT301", "ROB401", "CS201"],
      friends: ["u1", "u2", "u4"],
      createdAt: "2024-09-02T10:00:00Z"
    },
    {
      id: "u4",
      name: "Priya Sharma",
      email: "priya@univ.edu",
      password: "Password123!",
      headline: "Bioinformatics Scholar & Computational Biologist",
      major: "Bioinformatics",
      department: "Department of Biosciences",
      semester: "Fall 2026",
      university: "Pacific University",
      year: "Junior",
      bio: "Working on scalable genomic variant pipelines and molecular dynamics simulations on university clusters. President of Women in STEM.",
      avatar: "assets/images/avatar-4.svg",
      coverImage: "assets/images/cover-default.svg",
      studentId: "PU-2023-BI031",
      gpa: "3.88",
      location: "Biotech Pavilion, Suite 102",
      skills: ["Python", "R", "Nextflow", "BLAST", "Statistical Genetics", "Linux"],
      courses: ["BIO420", "STAT401", "CS302"],
      friends: ["u1", "u3", "u5"],
      createdAt: "2024-09-02T11:00:00Z"
    },
    {
      id: "u5",
      name: "Liam Gallagher",
      email: "liam@univ.edu",
      password: "Password123!",
      headline: "Cybersecurity Analyst & Protocol Engineer",
      major: "Cybersecurity",
      department: "Information Assurance",
      semester: "Fall 2026",
      university: "Pacific University",
      year: "Graduate",
      bio: "Auditing cryptographic primitives and network protocols. Active bug bounty hunter and competitive CTF captain.",
      avatar: "assets/images/avatar-5.svg",
      coverImage: "assets/images/cover-default.svg",
      studentId: "PU-2022-CY009",
      gpa: "3.95",
      location: "Cyber Defense Lab, Basement Level",
      skills: ["Rust", "Network Protocols", "Formal Verification", "Wireshark", "Reverse Engineering"],
      courses: ["SEC550", "CS501", "NET410"],
      friends: ["u2", "u4"],
      createdAt: "2024-09-03T12:00:00Z"
    }
  ],

  posts: [
    {
      id: "p1",
      authorId: "u1",
      title: "Distributed Raft Consensus Engine Implementation",
      courseCode: "CS501",
      tags: ["#CS501", "#DistributedSystems", "#GoLang", "#FinalProject"],
      content: "Excited to share our completed term project for Advanced Distributed Systems! We designed a fault-tolerant Raft cluster with leader election, log replication, and snapshotting. Handled network partitions with zero split-brain.",
      media: "assets/images/project-1.svg",
      reactions: {
        like: ["u2", "u3"],
        heart: ["u2"],
        celebrate: ["u4"],
        idea: ["u5"],
        thinking: []
      },
      commentsCount: 3,
      sharesCount: 5,
      createdAt: "2026-11-01T14:30:00Z"
    },
    {
      id: "p2",
      authorId: "u2",
      title: "Medical Image Segmentation with U-Net & TensorRT",
      courseCode: "AI602",
      tags: ["#MachineLearning", "#AI602", "#ComputerVision", "#Thesis"],
      content: "Our team finished training the enhanced 3D U-Net for brain lesion MRI segmentation. Achieved 0.912 Dice coefficient with a 4.2x inference speedup using NVIDIA TensorRT FP16 quantization.",
      media: "assets/images/project-2.svg",
      reactions: {
        like: ["u1", "u4"],
        heart: ["u4"],
        celebrate: ["u1", "u3", "u5"],
        idea: ["u3"],
        thinking: ["u5"]
      },
      commentsCount: 2,
      sharesCount: 8,
      createdAt: "2026-11-02T09:15:00Z"
    },
    {
      id: "p3",
      authorId: "u3",
      title: "Zero-Dependency Reactive UI Engine for Web Tech",
      courseCode: "WT301",
      tags: ["#WebTech", "#VanillaJS", "#FrontendArchitecture", "#Coursework"],
      content: "Completed the Web Technologies milestone! Built an entire component-driven responsive dashboard using pure HTML5, CSS3 Custom Properties, and ES6 Modules without external framework overhead.",
      media: "",
      reactions: {
        like: ["u1", "u2", "u4"],
        heart: ["u1"],
        celebrate: ["u1"],
        idea: ["u2"],
        thinking: []
      },
      commentsCount: 2,
      sharesCount: 2,
      createdAt: "2026-11-02T16:45:00Z"
    },
    {
      id: "p4",
      authorId: "u4",
      title: "High-Throughput Genomic Variant Caller in Nextflow",
      courseCode: "BIO420",
      tags: ["#Bioinformatics", "#Genomics", "#Nextflow", "#Research"],
      content: "Pipeline deployed on the university HPC cluster. Scaled variant calling across 128 whole-exome sequencing samples in under 3 hours with automated quality metrics.",
      media: "",
      reactions: {
        like: ["u2", "u5"],
        heart: ["u3"],
        celebrate: ["u2"],
        idea: ["u1"],
        thinking: []
      },
      commentsCount: 1,
      sharesCount: 3,
      createdAt: "2026-11-03T11:20:00Z"
    },
    {
      id: "p5",
      authorId: "u5",
      title: "Formal Verification of Cryptographic Key Exchange Protocols",
      courseCode: "SEC550",
      tags: ["#Cybersecurity", "#Cryptography", "#FormalVerification", "#Thesis"],
      content: "Verified nonces and session key forward secrecy against replay attacks using automated theorem provers. Manuscript preprint submitted to IEEE S&P.",
      media: "",
      reactions: {
        like: ["u1", "u2"],
        heart: [],
        celebrate: ["u1"],
        idea: ["u4"],
        thinking: ["u3"]
      },
      commentsCount: 2,
      sharesCount: 4,
      createdAt: "2026-11-03T18:00:00Z"
    },
    {
      id: "p6",
      authorId: "u1",
      title: "Quantum Annealing Circuit Simulation Benchmarks",
      courseCode: "PH510",
      tags: ["#QuantumComputing", "#Physics", "#PH510", "#Simulation"],
      content: "Simulating 24-qubit adiabatic Hamiltonian evolution compiled into WebAssembly. Memory footprint reduced by 60% compared to pure Python NumPy benchmarks.",
      media: "assets/images/project-3.svg",
      reactions: {
        like: ["u2", "u5"],
        heart: [],
        celebrate: ["u2"],
        idea: ["u5"],
        thinking: ["u4"]
      },
      commentsCount: 1,
      sharesCount: 6,
      createdAt: "2026-11-04T08:30:00Z"
    },
    {
      id: "p7",
      authorId: "u3",
      title: "Autonomous Campus Delivery Rover Prototype",
      courseCode: "ROB401",
      tags: ["#Robotics", "#Hardware", "#IoT", "#ROB401"],
      content: "Field test successful! Rover navigated from the Student Union to the Engineering Library autonomously avoiding pedestrians via onboard 2D LiDAR.",
      media: "assets/images/project-4.svg",
      reactions: {
        like: ["u1", "u2", "u4", "u5"],
        heart: ["u5"],
        celebrate: ["u1", "u4"],
        idea: ["u2"],
        thinking: []
      },
      commentsCount: 2,
      sharesCount: 7,
      createdAt: "2026-11-04T12:00:00Z"
    },
    {
      id: "p8",
      authorId: "u2",
      title: "Literature Review: Transformer Attention Mechanisms in Time-Series",
      courseCode: "DS520",
      tags: ["#DataScience", "#Transformers", "#LiteratureReview", "#Research"],
      content: "Synthesized 45 recent papers on Informer, Autoformer, and PatchTST architectures for multi-variate sensor anomaly detection. Summary notes available for download.",
      media: "",
      reactions: {
        like: ["u1", "u3"],
        heart: ["u4"],
        celebrate: [],
        idea: ["u1", "u4", "u5"],
        thinking: []
      },
      commentsCount: 1,
      sharesCount: 3,
      createdAt: "2026-11-04T15:10:00Z"
    }
  ],

  comments: [
    {
      id: "c1",
      postId: "p1",
      authorId: "u2",
      text: "Remarkable performance on the consensus benchmarks, Harry! How did you handle leader lease renewal under clock skew?",
      parentCommentId: null,
      reactions: { like: ["u1", "u5"] },
      createdAt: "2026-11-01T15:10:00Z"
    },
    {
      id: "c2",
      postId: "p1",
      authorId: "u1",
      text: "@Elena We incorporated monotonic logical clocks and randomized election timeouts between 150-300ms.",
      parentCommentId: "c1",
      reactions: { like: ["u2"] },
      createdAt: "2026-11-01T15:35:00Z"
    },
    {
      id: "c3",
      postId: "p1",
      authorId: "u5",
      text: "Great work. Did you test Byzantine fault scenarios or strictly crash-fault tolerance?",
      parentCommentId: null,
      reactions: { like: ["u1"] },
      createdAt: "2026-11-01T16:00:00Z"
    },
    {
      id: "c4",
      postId: "p2",
      authorId: "u1",
      text: "A 4.2x speedup on 3D volumetric data is huge! Are you publishing code on the campus repository?",
      parentCommentId: null,
      reactions: { like: ["u2"] },
      createdAt: "2026-11-02T10:00:00Z"
    },
    {
      id: "c5",
      postId: "p2",
      authorId: "u2",
      text: "@Harry Yes, will push to the AI Research Lab group repository by Friday with the TensorRT engine configs.",
      parentCommentId: "c4",
      reactions: { like: ["u1"] },
      createdAt: "2026-11-02T10:25:00Z"
    },
    {
      id: "c6",
      postId: "p3",
      authorId: "u1",
      text: "Clean architecture! The PubSub decoupled state pattern makes future ASP.NET Core API integration seamless.",
      parentCommentId: null,
      reactions: { like: ["u3"] },
      createdAt: "2026-11-02T17:15:00Z"
    },
    {
      id: "c7",
      postId: "p3",
      authorId: "u3",
      text: "Thanks Harry! Looking forward to wiring the real backend endpoints once our server repo is spun up.",
      parentCommentId: "c6",
      reactions: {},
      createdAt: "2026-11-02T17:40:00Z"
    },
    {
      id: "c8",
      postId: "p4",
      authorId: "u2",
      text: "Nextflow containers are so clean for reproducibility. Would love to test our genomic transformer on this data.",
      parentCommentId: null,
      reactions: { like: ["u4"] },
      createdAt: "2026-11-03T12:00:00Z"
    },
    {
      id: "c9",
      postId: "p5",
      authorId: "u1",
      text: "Proving forward secrecy mathematically is top tier. Let's do a joint seminar next Wednesday.",
      parentCommentId: null,
      reactions: { like: ["u5"] },
      createdAt: "2026-11-03T18:45:00Z"
    },
    {
      id: "c10",
      postId: "p5",
      authorId: "u5",
      text: "@Harry Absolutely! I'll prepare the TLA+ specification slides.",
      parentCommentId: "c9",
      reactions: { like: ["u1"] },
      createdAt: "2026-11-03T19:05:00Z"
    },
    {
      id: "c11",
      postId: "p6",
      authorId: "u5",
      text: "Compiling simulation kernels to Wasm is very clever for web accessibility.",
      parentCommentId: null,
      reactions: { like: ["u1"] },
      createdAt: "2026-11-04T09:10:00Z"
    },
    {
      id: "c12",
      postId: "p7",
      authorId: "u4",
      text: "Saw it cruising outside the library! Loved the LED status screen.",
      parentCommentId: null,
      reactions: { like: ["u3"] },
      createdAt: "2026-11-04T12:30:00Z"
    },
    {
      id: "c13",
      postId: "p7",
      authorId: "u3",
      text: "@Priya Thank you! Next up is multi-floor elevator signaling via Bluetooth.",
      parentCommentId: "c12",
      reactions: {},
      createdAt: "2026-11-04T12:45:00Z"
    },
    {
      id: "c14",
      postId: "p8",
      authorId: "u4",
      text: "Downloading now! Perfect timing for our sensor sequence project.",
      parentCommentId: null,
      reactions: { like: ["u2"] },
      createdAt: "2026-11-04T15:40:00Z"
    }
  ],

  friendRequests: [
    {
      id: "fr1",
      senderId: "u5",
      receiverId: "u1",
      status: "pending",
      createdAt: "2026-11-04T10:00:00Z"
    },
    {
      id: "fr2",
      senderId: "u3",
      receiverId: "u5",
      status: "pending",
      createdAt: "2026-11-04T11:30:00Z"
    }
  ],

  conversations: [
    {
      id: "room1",
      type: "direct",
      participants: ["u1", "u2"],
      name: "Elena Rostova",
      lastMessage: "I uploaded the revised TensorRT inference benchmark charts.",
      lastMessageTimestamp: "2026-11-04T16:20:00Z",
      unreadCount: 1
    },
    {
      id: "room2",
      type: "direct",
      participants: ["u1", "u3"],
      name: "Marcus Vance",
      lastMessage: "Check out the mobile drawer animation on Safari!",
      lastMessageTimestamp: "2026-11-04T15:45:00Z",
      unreadCount: 0
    },
    {
      id: "room3",
      type: "direct",
      participants: ["u1", "u4"],
      name: "Priya Sharma",
      lastMessage: "Do you have the link to the bioinformatics cluster queue?",
      lastMessageTimestamp: "2026-11-04T13:10:00Z",
      unreadCount: 0
    }
  ],

  messages: [
    {
      id: "m1",
      conversationId: "room1",
      senderId: "u2",
      text: "Hey Harry! Did you check out the 3D U-Net post?",
      timestamp: "2026-11-04T16:00:00Z"
    },
    {
      id: "m2",
      conversationId: "room1",
      senderId: "u1",
      text: "Yes, incredible work Elena! 0.912 Dice score is state of the art.",
      timestamp: "2026-11-04T16:05:00Z"
    },
    {
      id: "m3",
      conversationId: "room1",
      senderId: "u2",
      text: "I uploaded the revised TensorRT inference benchmark charts.",
      timestamp: "2026-11-04T16:20:00Z"
    },
    {
      id: "m4",
      conversationId: "room2",
      senderId: "u3",
      text: "Hey Harry, how does the responsive grid handle smaller screens?",
      timestamp: "2026-11-04T15:30:00Z"
    },
    {
      id: "m5",
      conversationId: "room2",
      senderId: "u1",
      text: "It collapses the right sidebar at 1024px and uses the off-canvas drawer on mobile (<768px).",
      timestamp: "2026-11-04T15:40:00Z"
    },
    {
      id: "m6",
      conversationId: "room2",
      senderId: "u3",
      text: "Check out the mobile drawer animation on Safari!",
      timestamp: "2026-11-04T15:45:00Z"
    },
    {
      id: "m7",
      conversationId: "room3",
      senderId: "u4",
      text: "Do you have the link to the bioinformatics cluster queue?",
      timestamp: "2026-11-04T13:10:00Z"
    }
  ],

  groups: [
    {
      id: "g1",
      name: "Distributed Systems Study Group",
      code: "CS-DIST-01",
      category: "Academic",
      description: "Deep dive into consensus algorithms, Byzantine fault tolerance, vector clocks, and actor frameworks.",
      banner: "assets/images/project-1.svg",
      members: ["u1", "u2", "u5"],
      postCount: 14,
      creatorId: "u1",
      createdAt: "2024-09-10T00:00:00Z"
    },
    {
      id: "g2",
      name: "AI & Multimodal Vision Research Lab",
      code: "AI-LAB-02",
      category: "Research",
      description: "Graduate and undergraduate research group exploring vision transformers, diffusion models, and edge inference.",
      banner: "assets/images/project-2.svg",
      members: ["u1", "u2", "u3", "u4"],
      postCount: 28,
      creatorId: "u2",
      createdAt: "2024-09-12T00:00:00Z"
    },
    {
      id: "g3",
      name: "Web Engineering & UI/UX Cohort",
      code: "WT-DEV-03",
      category: "Coursework",
      description: "Collaborative cohort for CS301 / WT301 students building responsive client-side web platforms.",
      banner: "assets/images/cover-default.svg",
      members: ["u1", "u3"],
      postCount: 9,
      creatorId: "u3",
      createdAt: "2024-09-15T00:00:00Z"
    },
    {
      id: "g4",
      name: "Cybersecurity & CTF Defense Team",
      code: "SEC-CTF-04",
      category: "Club",
      description: "Weekly reverse engineering, network forensics, web exploit analysis, and national CTF training.",
      banner: "assets/images/project-3.svg",
      members: ["u1", "u5"],
      postCount: 18,
      creatorId: "u5",
      createdAt: "2024-09-18T00:00:00Z"
    }
  ],

  marketplace: [
    {
      id: "item1",
      title: "Introduction to Algorithms (CLRS 4th Edition)",
      category: "Textbooks",
      price: 65.00,
      condition: "Like New",
      courseCode: "CS501",
      sellerId: "u1",
      sellerName: "Harry Thorne",
      description: "Hardcover 4th Edition. Minimal highlighting in chapters 1-5, all algorithm pseudocode clean. Essential for CS501.",
      image: "assets/images/project-1.svg",
      status: "available",
      createdAt: "2026-10-25T11:00:00Z"
    },
    {
      id: "item2",
      title: "NVIDIA Jetson Nano 4GB Developer Kit",
      category: "Hardware",
      price: 95.00,
      condition: "Excellent",
      courseCode: "ROB401",
      sellerId: "u3",
      sellerName: "Marcus Vance",
      description: "Includes acrylic casing, 5V 4A power supply, and 64GB pre-flashed Ubuntu 20.04 micro-SD card. Ready for ROS 2 robotics projects.",
      image: "assets/images/project-4.svg",
      status: "available",
      createdAt: "2026-10-28T14:30:00Z"
    },
    {
      id: "item3",
      title: "Deep Learning with PyTorch (Stevens, Antiga)",
      category: "Textbooks",
      price: 35.00,
      condition: "Good",
      courseCode: "AI602",
      sellerId: "u2",
      sellerName: "Elena Rostova",
      description: "Paperback edition covering CNNs, RNNs, and deployment on edge devices. Includes supplementary Jupyter notebook annotations.",
      image: "assets/images/project-2.svg",
      status: "available",
      createdAt: "2026-10-30T09:00:00Z"
    },
    {
      id: "item4",
      title: "Xilinx Artix-7 FPGA Development Board",
      category: "Hardware",
      price: 120.00,
      condition: "Like New",
      courseCode: "EE320",
      sellerId: "u5",
      sellerName: "Liam Gallagher",
      description: "Artix-7 FPGA board with USB-JTAG programming cable. Used for Hardware Security & Cryptographic Verilog labs.",
      image: "assets/images/project-3.svg",
      status: "available",
      createdAt: "2026-11-02T16:15:00Z"
    },
    {
      id: "item5",
      title: "Bioinformatics Pipeline & R Scripts Cheat Sheet",
      category: "Notes",
      price: 15.00,
      condition: "Digital PDF",
      courseCode: "BIO420",
      sellerId: "u4",
      sellerName: "Priya Sharma",
      description: "Comprehensive 40-page indexed study guide and command reference for Bioconductor, DESeq2, and Nextflow workflows.",
      image: "assets/images/cover-default.svg",
      status: "available",
      createdAt: "2026-11-03T10:45:00Z"
    }
  ],

  adCampaigns: [
    {
      id: "ad1",
      title: "Fall 2026 Graduate Research Symposium",
      sponsorName: "University Dean of Research",
      tagline: "Submit your coursework abstract by Nov 20th. Cash awards for top undergraduate & graduate oral presentations.",
      targetAudience: "All Engineering & Sciences",
      budgetTotal: 500.00,
      budgetSpent: 215.50,
      clicks: 412,
      impressions: 3480,
      status: "active",
      ctaText: "Submit Abstract",
      ctaLink: "#",
      badge: "Official University Event",
      image: "assets/images/cover-default.svg",
      createdAt: "2026-10-15T00:00:00Z"
    },
    {
      id: "ad2",
      title: "ACM Annual 48-Hour Campus Hackathon",
      sponsorName: "ACM Student Chapter & Google Cloud",
      tagline: "Build AI-powered campus tools. Over $10,000 in prizes, mentorship, and free student cloud credits.",
      targetAudience: "Computer Science & Engineering",
      budgetTotal: 750.00,
      budgetSpent: 480.00,
      clicks: 890,
      impressions: 7120,
      status: "active",
      ctaText: "Register Free",
      ctaLink: "#",
      badge: "Featured Hackathon",
      image: "assets/images/project-1.svg",
      createdAt: "2026-10-20T00:00:00Z"
    },
    {
      id: "ad3",
      title: "University Textbook Buyback & Swap Initiative",
      sponsorName: "Campus Book Store",
      tagline: "Trade your used STEM textbooks for campus dining dollars or immediate student store credit.",
      targetAudience: "All Undergraduates",
      budgetTotal: 300.00,
      budgetSpent: 120.00,
      clicks: 275,
      impressions: 2190,
      status: "active",
      ctaText: "View Exchange Rates",
      ctaLink: "#",
      badge: "Campus Marketplace",
      image: "assets/images/project-2.svg",
      createdAt: "2026-10-22T00:00:00Z"
    }
  ],

  orders: [
    {
      id: "ord-1001",
      userId: "u1",
      itemId: "item3",
      itemTitle: "Deep Learning with PyTorch (Stevens, Antiga)",
      amount: 35.00,
      paymentMethod: "Student Campus Card (Ending 4042)",
      deliveryType: "Campus Pickup (Science Center)",
      status: "Completed",
      createdAt: "2026-10-31T14:20:00Z"
    }
  ]
};

export const initialUsers = mockData.users;
export const initialPosts = mockData.posts;
export const initialComments = mockData.comments;
export const initialFriendRequests = mockData.friendRequests;
export const initialConversations = mockData.conversations;
export const initialMessages = mockData.messages;
export const initialGroups = mockData.groups;
export const initialMarketplace = mockData.marketplace;
export const initialAdCampaigns = mockData.adCampaigns;
export const initialOrders = mockData.orders;

mockData.initialUsers = initialUsers;
mockData.initialPosts = initialPosts;
mockData.initialComments = initialComments;
mockData.initialFriendRequests = initialFriendRequests;
mockData.initialConversations = initialConversations;
mockData.initialMessages = initialMessages;
mockData.initialGroups = initialGroups;
mockData.initialMarketplace = initialMarketplace;
mockData.initialAdCampaigns = initialAdCampaigns;
mockData.initialOrders = initialOrders;

export default mockData;
