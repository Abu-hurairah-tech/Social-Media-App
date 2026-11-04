/**
 * Academic Coursework Showcase — Reactive State Store & Domain Services
 * js/store/state.js
 *
 * Backed by LocalStorage ('ACADEMIC_SHOWCASE_STATE_V1') with automatic seed hydration,
 * PubSub event bus, and clean domain service methods ready to connect to a future
 * ASP.NET Core REST API backend.
 */

import {
  initialUsers,
  initialPosts,
  initialComments,
  initialFriendRequests,
  initialConversations,
  initialMessages,
  initialGroups,
  initialMarketplace,
  initialAdCampaigns,
  initialOrders
} from './mockData.js';

export const STORAGE_KEY = 'ACADEMIC_SHOWCASE_STATE_V1';

// In-memory fallback for environments without localStorage (e.g. Node.js tests)
let memoryStorage = {};

const getStorageItem = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStorage[key] || null;
  } catch (e) {
    return memoryStorage[key] || null;
  }
};

const setStorageItem = (key, value) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    memoryStorage[key] = value;
  }
};

export class StateManager {
  constructor() {
    this.subscribers = new Map();
    this.data = this.loadState();
  }

  // ==========================================================================
  // Persistence & Hydration
  // ==========================================================================

  getDefaultState() {
    return {
      currentUserId: 'u1', // Default to Harry Thorne for immediate rich preview
      users: Array.isArray(initialUsers) ? [...initialUsers] : [],
      posts: Array.isArray(initialPosts) ? [...initialPosts] : [],
      comments: Array.isArray(initialComments) ? [...initialComments] : [],
      friendRequests: Array.isArray(initialFriendRequests) ? [...initialFriendRequests] : [],
      conversations: Array.isArray(initialConversations) ? [...initialConversations] : [],
      messages: Array.isArray(initialMessages) ? [...initialMessages] : [],
      groups: Array.isArray(initialGroups) ? [...initialGroups] : [],
      marketplace: Array.isArray(initialMarketplace) ? [...initialMarketplace] : [],
      adCampaigns: Array.isArray(initialAdCampaigns) ? [...initialAdCampaigns] : [],
      orders: Array.isArray(initialOrders) ? [...initialOrders] : [],
      lastUpdated: new Date().toISOString()
    };
  }

  loadState() {
    const defaultState = this.getDefaultState();
    let raw = null;
    try {
      raw = getStorageItem(STORAGE_KEY);
    } catch (e) {
      this.saveState(defaultState);
      return defaultState;
    }

    if (!raw) {
      this.saveState(defaultState);
      return defaultState;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.saveState(defaultState);
        return defaultState;
      }

      return {
        ...defaultState,
        ...parsed,
        users: Array.isArray(parsed.users) ? parsed.users : defaultState.users,
        posts: Array.isArray(parsed.posts) ? parsed.posts : defaultState.posts,
        comments: Array.isArray(parsed.comments) ? parsed.comments : defaultState.comments,
        friendRequests: Array.isArray(parsed.friendRequests) ? parsed.friendRequests : defaultState.friendRequests,
        conversations: Array.isArray(parsed.conversations) ? parsed.conversations : defaultState.conversations,
        messages: Array.isArray(parsed.messages) ? parsed.messages : defaultState.messages,
        groups: Array.isArray(parsed.groups) ? parsed.groups : defaultState.groups,
        marketplace: Array.isArray(parsed.marketplace) ? parsed.marketplace : defaultState.marketplace,
        adCampaigns: Array.isArray(parsed.adCampaigns) ? parsed.adCampaigns : defaultState.adCampaigns,
        orders: Array.isArray(parsed.orders) ? parsed.orders : defaultState.orders
      };
    } catch (e) {
      this.saveState(defaultState);
      return defaultState;
    }
  }

  init() {
    this.data = this.loadState();
    return this.data;
  }

  save() {
    return this.saveState();
  }

  saveState(nextData = this.data) {
    this.data = {
      ...nextData,
      lastUpdated: new Date().toISOString()
    };
    try {
      setStorageItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      // Safely catch QuotaExceededError or write failures without unhandled exception
    }
  }

  resetToSeedData() {
    const defaultState = this.getDefaultState();
    this.saveState(defaultState);
    this.publish('state:reset', this.data);
    return this.data;
  }

  // ==========================================================================
  // PubSub Event Bus
  // ==========================================================================

  subscribe(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Subscriber callback must be a function');
    }
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(event);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  publish(event, data) {
    const subs = this.subscribers.get(event);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      });
    }
    // Also dispatch a wildcard event listener if registered
    const allSubs = this.subscribers.get('*');
    if (allSubs) {
      allSubs.forEach((cb) => {
        try {
          cb({ event, data });
        } catch (err) {
          console.error(`Error in wildcard listener for "${event}":`, err);
        }
      });
    }
  }

  // ==========================================================================
  // User & Authentication Services
  // ==========================================================================

  getCurrentUser() {
    if (!this.data.currentUserId) return null;
    return this.data.users.find((u) => u.id === this.data.currentUserId) || null;
  }

  setCurrentUser(userOrId) {
    const userId = typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId;
    this.data.currentUserId = userId || null;
    this.saveState();
    this.publish('auth:changed', this.getCurrentUser());
  }

  getUserById(id) {
    return this.data.users.find((u) => u.id === id) || null;
  }

  onAuthChange(callback) {
    return this.subscribe('auth:changed', callback);
  }

  login(emailOrStudentId, password) {
    if (!emailOrStudentId || !password) {
      return { success: false, message: 'Email or Student ID and password are required.' };
    }
    const cleanId = emailOrStudentId.trim().toLowerCase();
    const user = this.data.users.find((u) =>
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.studentId && u.studentId.toLowerCase() === cleanId)
    );

    if (!user) {
      return { success: false, message: 'Invalid email/student ID or password.' };
    }
    if (user.password && user.password !== password) {
      return { success: false, message: 'Invalid email/student ID or password.' };
    }

    this.data.currentUserId = user.id;
    this.saveState();
    this.publish('auth:login', user);
    this.publish('auth:changed', user);
    const token = `jwt_mock_${user.id}_${Date.now()}`;
    return { success: true, message: 'Login successful.', user, token };
  }

  register(userData) {
    if (!userData.email || !userData.name || !userData.password) {
      return { success: false, message: 'Name, email, and password are required.' };
    }
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const departmentMap = {
      'Computer Science': 'School of Computing',
      'Artificial Intelligence': 'Data Science Institute',
      'Software Engineering': 'School of Computing',
      'Cybersecurity': 'School of Computing',
      'Bioinformatics': 'Faculty of Sciences'
    };

    const major = userData.major || 'Computer Science';
    const department = userData.department || departmentMap[major] || 'School of Computing';

    const newUser = {
      id: 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: userData.name.trim(),
      email: cleanEmail,
      password: userData.password,
      headline: userData.headline || `${major} Scholar`,
      major: major,
      department: department,
      semester: userData.semester || 'Fall 2026',
      university: userData.university || 'Pacific University',
      year: userData.year || 'Freshman',
      bio: userData.bio || 'Student scholar showcasing coursework, projects, and research.',
      avatar: userData.avatar || 'assets/images/avatar-1.svg',
      coverImage: userData.coverImage || 'assets/images/cover-default.svg',
      studentId: userData.studentId || `PU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      gpa: userData.gpa || '3.50',
      location: userData.location || 'Campus Science Center',
      skills: userData.skills || [],
      courses: userData.courses || [],
      friends: [],
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.data.currentUserId = newUser.id;
    this.saveState();
    this.publish('users:created', newUser);
    this.publish('auth:login', newUser);
    this.publish('auth:changed', newUser);
    const token = `jwt_mock_${newUser.id}_${Date.now()}`;
    return { success: true, message: 'Account registered successfully.', user: newUser, token };
  }

  logout() {
    this.data.currentUserId = null;
    this.saveState();
    this.publish('auth:logout', null);
    this.publish('auth:changed', null);
  }

  updateProfile(userId, updates) {
    const index = this.data.users.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      id: userId // Ensure ID is immutable
    };
    this.saveState();
    this.publish('user:updated', this.data.users[index]);
    if (this.data.currentUserId === userId) {
      this.publish('auth:changed', this.data.users[index]);
    }
    return this.data.users[index];
  }

  // ==========================================================================
  // Post & Feed Services
  // ==========================================================================

  getPosts(filter = {}) {
    let list = [...this.data.posts];

    if (filter.userId) {
      list = list.filter((p) => p.authorId === filter.userId);
    }
    if (filter.category) {
      const cat = filter.category.toLowerCase();
      list = list.filter((p) => {
        if (p.courseCode && p.courseCode.toLowerCase().includes(cat)) return true;
        return p.tags && p.tags.some((t) => t.toLowerCase().includes(cat));
      });
    }
    if (filter.groupId) {
      list = list.filter((p) => p.groupId === filter.groupId);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPostById(postId) {
    return this.data.posts.find((p) => p.id === postId) || null;
  }

  createPost(postData = {}) {
    const currentUser = this.getCurrentUser();
    const newPost = {
      id: 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      authorId: postData.authorId || (currentUser ? currentUser.id : 'u1'),
      title: postData.title ? postData.title.trim() : 'Coursework Update',
      courseCode: postData.courseCode ? postData.courseCode.trim() : 'CS501',
      tags: Array.isArray(postData.tags) ? postData.tags : ['#Coursework', '#Academic'],
      content: postData.content ? postData.content.trim() : '',
      media: postData.media || '',
      codeSnippet: postData.codeSnippet || null,
      reactions: {
        like: [],
        heart: [],
        celebrate: [],
        idea: [],
        thinking: []
      },
      commentsCount: 0,
      sharesCount: typeof postData.sharesCount === 'number' ? postData.sharesCount : 0,
      groupId: postData.groupId || null,
      originalPostId: postData.originalPostId || null,
      originalPost: postData.originalPost || null,
      comments: [],
      createdAt: new Date().toISOString()
    };

    this.data.posts.unshift(newPost);
    this.saveState();
    this.publish('posts:created', newPost);
    this.publish('state:posts', this.data.posts);
    this.publish('posts:updated', this.data.posts);
    return newPost;
  }

  toggleReaction(postId, reactionType = 'like') {
    const ALLOWED_REACTIONS = ['like', 'heart', 'celebrate', 'idea', 'thinking'];
    if (!ALLOWED_REACTIONS.includes(reactionType)) {
      reactionType = 'like';
    }

    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) throw new Error(`Post with id "${postId}" not found`);

    const currentUser = this.getCurrentUser();
    const currentUserId = currentUser ? currentUser.id : 'u1';

    if (!post.reactions) {
      post.reactions = { like: [], heart: [], celebrate: [], idea: [], thinking: [] };
    }
    if (!post.reactions[reactionType]) {
      post.reactions[reactionType] = [];
    }

    const typeList = post.reactions[reactionType];
    const index = typeList.indexOf(currentUserId);

    if (index > -1) {
      typeList.splice(index, 1);
    } else {
      Object.keys(post.reactions).forEach((type) => {
        const idx = post.reactions[type].indexOf(currentUserId);
        if (idx > -1) post.reactions[type].splice(idx, 1);
      });
      typeList.push(currentUserId);
    }

    this.saveState();
    this.publish('reaction:toggled', { postId, reactionType, reactions: post.reactions });
    this.publish('state:posts', this.data.posts);
    this.publish('posts:updated', this.data.posts);
    return post;
  }

  addComment(postId, text, parentCommentId = null) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Comment text cannot be empty');
    }

    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) throw new Error(`Post with id "${postId}" not found`);

    const currentUser = this.getCurrentUser();
    const newComment = {
      id: 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      postId,
      authorId: currentUser ? currentUser.id : 'u1',
      text: text.trim(),
      parentCommentId: parentCommentId || null,
      parentId: parentCommentId || null,
      reactions: { like: [] },
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    post.comments.push(newComment);

    if (!Array.isArray(this.data.comments)) {
      this.data.comments = [];
    }
    this.data.comments.push(newComment);

    post.commentsCount = (post.commentsCount || 0) + 1;

    this.saveState();
    this.publish('comments:created', newComment);
    this.publish('state:posts', this.data.posts);
    this.publish('posts:updated', this.data.posts);
    return newComment;
  }

  sharePost(postId, options = {}) {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) throw new Error(`Post with id "${postId}" not found`);

    post.sharesCount = (post.sharesCount || 0) + 1;

    let newPost = null;
    const currentUser = this.getCurrentUser();
    const currentUserId = currentUser ? currentUser.id : 'u1';

    if (options.groupId || options.type === 'group') {
      newPost = this.createPost({
        authorId: currentUserId,
        groupId: options.groupId || null,
        title: options.title || (post.title ? `[Shared] ${post.title}` : 'Shared Coursework'),
        content: options.content || options.thought || options.quote || `Shared coursework from ${post.courseCode || 'course'}`,
        courseCode: post.courseCode || 'GEN101',
        tags: Array.isArray(post.tags) ? [...post.tags, '#GroupShare'] : ['#GroupShare', '#Coursework'],
        codeSnippet: post.codeSnippet || null,
        originalPostId: post.id,
        originalPost: {
          id: post.id,
          title: post.title,
          authorId: post.authorId,
          courseCode: post.courseCode,
          content: post.content
        }
      });
      if (options.groupId) {
        const group = this.data.groups.find((g) => g.id === options.groupId);
        if (group) {
          group.postCount = (group.postCount || 0) + 1;
        }
      }
    } else if (options.type === 'feed' || options.quote || options.thought || options.toFeed || options.content) {
      const quoteText = options.quote || options.thought || options.content || '';
      newPost = this.createPost({
        authorId: currentUserId,
        title: options.title || (post.title ? `Quote: ${post.title}` : 'Shared Showcase'),
        content: quoteText,
        courseCode: post.courseCode || 'GEN101',
        tags: Array.isArray(post.tags)
          ? (post.tags.includes('#Shared') ? [...post.tags] : [...post.tags, '#Shared'])
          : ['#Coursework', '#Shared'],
        codeSnippet: post.codeSnippet || null,
        originalPostId: post.id,
        originalPost: {
          id: post.id,
          title: post.title,
          authorId: post.authorId,
          courseCode: post.courseCode,
          content: post.content
        }
      });
    }

    this.saveState();
    this.publish('posts:shared', { postId, options, post, newPost });
    this.publish('state:posts', this.data.posts);
    this.publish('posts:updated', this.data.posts);
    return newPost || post;
  }

  getCommentsForPost(postId) {
    const post = this.data.posts.find((p) => p.id === postId);
    const comments = (this.data.comments || [])
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (post && (!Array.isArray(post.comments) || post.comments.length !== comments.length)) {
      post.comments = comments;
    }
    return comments;
  }

  // ==========================================================================
  // Friends & Social Directory Services
  // ==========================================================================

  getFriends(userId) {
    const targetUserId = userId || (this.getCurrentUser() ? this.getCurrentUser().id : 'u1');
    const targetUser = this.data.users.find((u) => u.id === targetUserId);
    if (!targetUser || !targetUser.friends) return [];

    return this.data.users.filter((u) => targetUser.friends.includes(u.id));
  }

  getFriendRequests() {
    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    return {
      incoming: this.data.friendRequests.filter((fr) => fr.receiverId === currentUserId && fr.status === 'pending'),
      outgoing: this.data.friendRequests.filter((fr) => fr.senderId === currentUserId && fr.status === 'pending')
    };
  }

  sendFriendRequest(targetUserId) {
    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    if (currentUserId === targetUserId) return false;

    const currentUser = this.getUserById(currentUserId);
    if (currentUser && currentUser.friends && currentUser.friends.includes(targetUserId)) {
      return false;
    }

    const existing = this.data.friendRequests.find(
      (fr) =>
        fr.status === 'pending' &&
        ((fr.senderId === currentUserId && fr.receiverId === targetUserId) ||
          (fr.senderId === targetUserId && fr.receiverId === currentUserId))
    );
    if (existing) return false;

    const newRequest = {
      id: 'fr_' + Date.now().toString(36),
      senderId: currentUserId,
      receiverId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.data.friendRequests.push(newRequest);
    this.saveState();
    this.publish('friendRequests:updated', this.getFriendRequests());
    return true;
  }

  respondFriendRequest(requestId, action = 'accept') {
    const req = this.data.friendRequests.find((fr) => fr.id === requestId);
    if (!req || req.status !== 'pending') return false;

    if (action === 'accept') {
      req.status = 'accepted';
      const sender = this.getUserById(req.senderId);
      const receiver = this.getUserById(req.receiverId);

      if (sender && !sender.friends.includes(req.receiverId)) {
        sender.friends.push(req.receiverId);
      }
      if (receiver && !receiver.friends.includes(req.senderId)) {
        receiver.friends.push(req.senderId);
      }
    } else {
      req.status = 'declined';
    }

    this.saveState();
    this.publish('friendRequests:updated', this.getFriendRequests());
    this.publish('friends:updated', { senderId: req.senderId, receiverId: req.receiverId, action });
    return true;
  }

  // ==========================================================================
  // Chat & Messaging Services
  // ==========================================================================

  getConversations() {
    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    return this.data.conversations
      .filter((c) => c.participants.includes(currentUserId))
      .sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
  }

  getMessages(roomId) {
    return this.data.messages
      .filter((m) => m.conversationId === roomId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  sendMessage(roomId, text) {
    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    const cleanText = text.trim();
    if (!cleanText) throw new Error('Message text cannot be empty');

    const conversation = this.data.conversations.find((c) => c.id === roomId);
    if (!conversation) throw new Error(`Conversation ${roomId} not found`);

    const now = new Date().toISOString();
    const newMsg = {
      id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      conversationId: roomId,
      senderId: currentUserId,
      text: cleanText,
      timestamp: now
    };

    this.data.messages.push(newMsg);
    conversation.lastMessage = cleanText;
    conversation.lastMessageTimestamp = now;

    this.saveState();
    this.publish('messages:sent', newMsg);
    this.publish('conversations:updated', this.getConversations());
    return newMsg;
  }

  // ==========================================================================
  // Groups Services
  // ==========================================================================

  getGroups() {
    return [...this.data.groups];
  }

  createGroup(groupData = {}) {
    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    const newGroup = {
      id: 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      name: groupData.name ? groupData.name.trim() : 'New Academic Group',
      code: groupData.code ? groupData.code.trim().toUpperCase() : 'GROUP-' + Math.floor(100 + Math.random() * 900),
      category: groupData.category || 'Academic',
      description: groupData.description ? groupData.description.trim() : '',
      banner: groupData.banner || 'assets/images/cover-default.svg',
      members: [currentUserId],
      postCount: 0,
      creatorId: currentUserId,
      createdAt: new Date().toISOString()
    };

    this.data.groups.push(newGroup);
    this.saveState();
    this.publish('groups:created', newGroup);
    this.publish('groups:updated', this.data.groups);
    return newGroup;
  }

  toggleGroupMembership(groupId) {
    const group = this.data.groups.find((g) => g.id === groupId);
    if (!group) return false;

    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    const index = group.members.indexOf(currentUserId);

    if (index > -1) {
      group.members.splice(index, 1);
    } else {
      group.members.push(currentUserId);
    }

    this.saveState();
    this.publish('groups:updated', this.data.groups);
    return true;
  }

  // ==========================================================================
  // Marketplace Services
  // ==========================================================================

  getMarketplaceItems(category) {
    let items = [...this.data.marketplace];
    if (category && category !== 'All') {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createMarketplaceItem(itemData = {}) {
    const currentUser = this.getCurrentUser();
    const newItem = {
      id: 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      title: itemData.title ? itemData.title.trim() : 'Academic Listing',
      category: itemData.category || 'Textbooks',
      price: parseFloat(itemData.price) || 0.00,
      condition: itemData.condition || 'Good',
      courseCode: itemData.courseCode ? itemData.courseCode.trim().toUpperCase() : 'GEN101',
      sellerId: currentUser ? currentUser.id : 'u1',
      sellerName: currentUser ? currentUser.name : 'Harry Thorne',
      description: itemData.description ? itemData.description.trim() : '',
      image: itemData.image || 'assets/images/project-1.svg',
      status: 'available',
      createdAt: new Date().toISOString()
    };

    this.data.marketplace.unshift(newItem);
    this.saveState();
    this.publish('marketplace:created', newItem);
    this.publish('marketplace:updated', this.data.marketplace);
    return newItem;
  }

  // ==========================================================================
  // Ads Manager Services
  // ==========================================================================

  getAdCampaigns() {
    return [...this.data.adCampaigns];
  }

  createAdCampaign(campaignData = {}) {
    const currentUser = this.getCurrentUser();
    const newCampaign = {
      id: 'ad_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      title: campaignData.title ? campaignData.title.trim() : 'Campus Showcase Ad',
      sponsorName: campaignData.sponsorName ? campaignData.sponsorName.trim() : (currentUser ? currentUser.name : 'University Sponsor'),
      tagline: campaignData.tagline ? campaignData.tagline.trim() : '',
      targetAudience: campaignData.targetAudience || 'All Students',
      budgetTotal: parseFloat(campaignData.budgetTotal) || 100.00,
      budgetSpent: 0.00,
      clicks: 0,
      impressions: 0,
      status: 'active',
      ctaText: campaignData.ctaText || 'Learn More',
      ctaLink: campaignData.ctaLink || '#',
      badge: campaignData.badge || 'Sponsored',
      image: campaignData.image || 'assets/images/cover-default.svg',
      createdAt: new Date().toISOString()
    };

    this.data.adCampaigns.unshift(newCampaign);
    this.saveState();
    this.publish('ads:created', newCampaign);
    this.publish('ads:updated', this.data.adCampaigns);
    return newCampaign;
  }

  // ==========================================================================
  // Orders & Checkout Services
  // ==========================================================================

  getOrders() {
    const currentUserId = this.getCurrentUser() ? this.getCurrentUser().id : 'u1';
    return this.data.orders.filter((o) => o.userId === currentUserId);
  }

  createOrder(orderData = {}) {
    const currentUser = this.getCurrentUser();
    const newOrder = {
      id: 'ord-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser ? currentUser.id : 'u1',
      itemId: orderData.itemId || null,
      itemTitle: orderData.itemTitle || 'Academic Resource Item',
      amount: parseFloat(orderData.amount) || 0.00,
      paymentMethod: orderData.paymentMethod || 'Student Campus Card',
      deliveryType: orderData.deliveryType || 'Campus Pickup',
      status: 'Completed',
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);

    if (orderData.itemId) {
      const item = this.data.marketplace.find((i) => i.id === orderData.itemId);
      if (item) {
        item.status = 'sold';
      }
    }

    this.saveState();
    this.publish('orders:created', newOrder);
    this.publish('orders:updated', this.data.orders);
    return newOrder;
  }
}

// Export singleton instance as default application store
export const state = new StateManager();
export const store = state;
export const Store = StateManager;

state.store = state;
state.state = state;
state.Store = StateManager;
state.StateManager = StateManager;
state.init = function() {
  return this.loadState();
};
state.save = function() {
  return this.saveState();
};

export default state;
