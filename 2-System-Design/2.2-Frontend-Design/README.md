# Frontend Design

## Table of Contents
1. [Design a News Feed UI](#1-design-a-news-feed-ui)
2. [Design an Autocomplete/Typeahead Component](#2-design-an-autocompletetypeahead-component)
3. [Design a Real-Time Collaborative Editor](#3-design-a-real-time-collaborative-editor)
4. [Design an Image Carousel/Gallery](#4-design-an-image-carouselgallery)
5. [Design an Infinite Scroll Component](#5-design-an-infinite-scroll-component)
6. [Design a Virtual Scrolling List](#6-design-a-virtual-scrolling-list)
7. [Design a Chat Application UI](#7-design-a-chat-application-ui)
8. [Design a Data Visualization Dashboard](#8-design-a-data-visualization-dashboard)
9. [Design a Form Builder](#9-design-a-form-builder)
10. [Design a Video Player](#10-design-a-video-player)
11. [Design a Notification System](#11-design-a-notification-system)
12. [Design a Modal/Dialog System](#12-design-a-modaldialog-system)
13. [Design a Responsive Navigation](#13-design-a-responsive-navigation)
14. [Design a State Management System](#14-design-a-state-management-system)
15. [Design a Progressive Web App (PWA)](#15-design-a-progressive-web-app-pwa)

---

## 1. Design a News Feed UI

### Requirements Clarification
- **Q**: What content types? (text, images, videos, links)
- **Q**: Real-time updates or refresh-based?
- **Q**: Infinite scroll or pagination?
- **Q**: Interactions? (like, comment, share)
- **Q**: Performance requirements? (render 100 posts smoothly)
- **Q**: Mobile, desktop, or both?

**Assumptions**:
- Text + image posts
- Real-time updates for new posts
- Infinite scroll
- Like/comment/share interactions
- Target: 60 FPS, smooth scrolling
- Responsive (mobile + desktop)

### Component Architecture

```jsx
// Approach 1: Simple Component Hierarchy

NewsFeed/
├── FeedContainer (smart component)
│   ├── FeedHeader
│   │   ├── NewPostButton
│   │   └── FilterDropdown
│   ├── NewPostsIndicator
│   ├── FeedList
│   │   └── PostCard (repeated)
│   │       ├── PostHeader
│   │       │   ├── Avatar
│   │       │   ├── Username
│   │       │   └── Timestamp
│   │       ├── PostContent
│   │       │   ├── Text
│   │       │   └── ImageGrid (if images)
│   │       └── PostActions
│   │           ├── LikeButton
│   │           ├── CommentButton
│   │           └── ShareButton
│   └── InfiniteScrollTrigger
```

**Component Breakdown**:

```jsx
// FeedContainer.jsx (Smart Component)
import { useState, useEffect } from 'react';

const FeedContainer = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);

  // Initial load
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/feed?cursor=${cursor}&limit=20`
      );
      const data = await response.json();

      setPosts(prev => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/feed');

    ws.onmessage = (event) => {
      const newPost = JSON.parse(event.data);
      setPosts(prev => [newPost, ...prev]);
    };

    return () => ws.close();
  }, []);

  return (
    <div className="feed-container">
      <FeedHeader />
      <FeedList
        posts={posts}
        onLoadMore={loadPosts}
        hasMore={hasMore}
        loading={loading}
      />
    </div>
  );
};
```

```jsx
// PostCard.jsx (Dumb Component)
const PostCard = ({ post, onLike, onComment, onShare }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await onLike(post.id, !isLiked);
    } catch (error) {
      // Rollback on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  return (
    <article className="post-card">
      <PostHeader
        avatar={post.user.avatar}
        username={post.user.name}
        timestamp={post.createdAt}
      />

      <PostContent
        text={post.content}
        images={post.images}
      />

      <PostActions
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={post.commentCount}
        onLike={handleLike}
        onComment={() => onComment(post.id)}
        onShare={() => onShare(post.id)}
      />
    </article>
  );
};
```

### State Management Approaches

**Approach 1: Local State (useState)** ✅ Simple

```jsx
const FeedContainer = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... component logic
};
```

**Pros**:
- Simple for small apps
- No dependencies
- Easy to understand

**Cons**:
- Doesn't scale (prop drilling)
- Hard to share state
- Re-fetches on unmount/remount

**When**: Small apps, single feed view

---

**Approach 2: Context API** ✅ Medium Complexity

```jsx
// FeedContext.js
import { createContext, useContext, useReducer, useEffect } from 'react';

const FeedContext = createContext();

const feedReducer = (state, action) => {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, posts: action.payload };

    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      return state;
  }
};

export const FeedProvider = ({ children }) => {
  const [state, dispatch] = useReducer(feedReducer, {
    posts: [],
    loading: false,
    cursor: null,
    hasMore: true
  });

  // Load posts
  const loadPosts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const response = await fetch(`/api/feed?cursor=${state.cursor}`);
    const data = await response.json();

    dispatch({ type: 'SET_POSTS', payload: data.posts });
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  return (
    <FeedContext.Provider value={{ state, loadPosts }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => useContext(FeedContext);

// Usage
const FeedContainer = () => {
  const { state, loadPosts } = useFeed();

  useEffect(() => {
    loadPosts();
  }, []);

  return <FeedList posts={state.posts} />;
};
```

**Pros**:
- No external dependencies
- Good for medium apps
- Avoids prop drilling

**Cons**:
- Re-renders all consumers on any state change
- No built-in DevTools
- Can become complex

**When**: Medium apps, shared state across components

---

**Approach 3: Redux** ✅ Complex but Scalable

```jsx
// store/feedSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchPosts = createAsyncThunk(
  'feed/fetchPosts',
  async ({ cursor }, { getState }) => {
    const response = await fetch(`/api/feed?cursor=${cursor}`);
    return response.json();
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    loading: false,
    cursor: null,
    hasMore: true
  },
  reducers: {
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.posts.push(...action.payload.posts);
        state.cursor = action.payload.nextCursor;
        state.hasMore = action.payload.hasMore;
        state.loading = false;
      });
  }
});

export const { addPost, updatePost } = feedSlice.actions;
export default feedSlice.reducer;

// Component
import { useSelector, useDispatch } from 'react-redux';

const FeedContainer = () => {
  const dispatch = useDispatch();
  const { posts, loading } = useSelector(state => state.feed);

  useEffect(() => {
    dispatch(fetchPosts({ cursor: null }));
  }, []);

  return <FeedList posts={posts} loading={loading} />;
};
```

**Pros**:
- Predictable state management
- Excellent DevTools
- Middleware support
- Time-travel debugging

**Cons**:
- Boilerplate code
- Learning curve
- Overkill for small apps

**When**: Large apps, complex state, team development

---

**Approach 4: React Query / SWR** ⭐ Recommended for Data Fetching

```jsx
// Using React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FeedContainer = () => {
  const queryClient = useQueryClient();

  // Fetch posts with automatic caching, refetching, pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = null }) =>
      fetch(`/api/feed?cursor=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  // Optimistic updates for likes
  const likeMutation = useMutation({
    mutationFn: (postId) => fetch(`/api/posts/${postId}/like`, { method: 'POST' }),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(['feed']);

      // Optimistically update
      queryClient.setQueryData(['feed'], (old) => {
        // ... update logic
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['feed'], context.previousFeed);
    }
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  return (
    <FeedList
      posts={posts}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      loading={isLoading}
      onLike={likeMutation.mutate}
    />
  );
};
```

**Pros**:
- Automatic caching
- Background refetching
- Optimistic updates built-in
- Less boilerplate than Redux
- Excellent for API-heavy apps

**Cons**:
- Extra dependency
- Learning curve for advanced features
- Focused on server state (not client state)

**When**: Modern apps with heavy API usage (recommended)

### Performance Optimizations

**Optimization 1: Virtualization**

**Problem**: Rendering 1000 posts causes lag

**Solution**: Only render visible posts

```jsx
import { FixedSizeList } from 'react-window';

const VirtualizedFeed = ({ posts }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={window.innerHeight}
      itemCount={posts.length}
      itemSize={400}  // Height of each post
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

**Before**:
- 1000 posts rendered = 1000 DOM nodes = laggy
- Scroll FPS: ~20 FPS

**After**:
- ~10 visible posts rendered = 10 DOM nodes
- Scroll FPS: 60 FPS
- **40x fewer DOM nodes!**

---

**Optimization 2: Image Lazy Loading**

```jsx
const LazyImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }  // Load 50px before visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc || 'placeholder.jpg'}
      alt={alt}
      loading="lazy"  // Native lazy loading
    />
  );
};
```

**Before**:
- Load all images immediately
- Initial page load: 10MB, 5 seconds

**After**:
- Load images as user scrolls
- Initial page load: 500KB, 0.5 seconds
- **20x faster initial load!**

---

**Optimization 3: Memoization**

```jsx
import { memo, useMemo, useCallback } from 'react';

// Prevent re-render if props unchanged
const PostCard = memo(({ post, onLike }) => {
  // ... component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.post.id === nextProps.post.id &&
         prevProps.post.likeCount === nextProps.post.likeCount;
});

const FeedContainer = () => {
  const [posts, setPosts] = useState([]);

  // Memoize callback (stable reference)
  const handleLike = useCallback((postId) => {
    // ... like logic
  }, []);

  // Memoize computed value
  const sortedPosts = useMemo(() => {
    return posts.sort((a, b) => b.timestamp - a.timestamp);
  }, [posts]);

  return (
    <FeedList
      posts={sortedPosts}
      onLike={handleLike}  // Same reference on re-renders
    />
  );
};
```

**Before**:
- Every parent re-render causes all children to re-render
- 100 posts × 10 re-renders = 1000 renders

**After**:
- Only changed posts re-render
- 5 changed posts × 10 re-renders = 50 renders
- **20x fewer renders!**

---

**Optimization 4: Debouncing Infinite Scroll**

```jsx
import { debounce } from 'lodash';

const InfiniteScroll = ({ onLoadMore, hasMore }) => {
  const loadMoreDebounced = useMemo(
    () => debounce(onLoadMore, 500),
    [onLoadMore]
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= docHeight - 100 && hasMore) {
        loadMoreDebounced();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreDebounced, hasMore]);

  return null;
};
```

**Before**:
- Fire API request on every scroll event (100+ requests/sec)
- Server overloaded

**After**:
- Fire API request max once per 500ms
- **200x fewer requests!**

---

**Optimization 5: Code Splitting**

```jsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const VideoPlayer = lazy(() => import('./VideoPlayer'));
const ImageEditor = lazy(() => import('./ImageEditor'));

const PostCard = ({ post }) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div>
      <PostContent text={post.content} />

      {showVideo && (
        <Suspense fallback={<Spinner />}>
          <VideoPlayer src={post.videoUrl} />
        </Suspense>
      )}

      <button onClick={() => setShowVideo(true)}>
        Play Video
      </button>
    </div>
  );
};
```

**Before**:
- Bundle size: 2MB (includes video player even if not used)
- Initial load: 2MB download

**After**:
- Initial bundle: 200KB
- Video player: loaded on-demand (300KB)
- **10x smaller initial bundle!**

### Data Fetching Strategies

**Strategy 1: Client-Side Rendering (CSR)**

```jsx
const FeedPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/feed')
      .then(r => r.json())
      .then(setPosts);
  }, []);

  return <FeedList posts={posts} />;
};
```

**Pros**: Simple, interactive
**Cons**: SEO issues, slower initial render
**When**: Authenticated pages, dashboards

---

**Strategy 2: Server-Side Rendering (SSR)**

```jsx
// Next.js
export async function getServerSideProps(context) {
  const res = await fetch('https://api.example.com/feed');
  const posts = await res.json();

  return {
    props: { posts }
  };
}

const FeedPage = ({ posts }) => {
  return <FeedList posts={posts} />;
};
```

**Pros**: SEO-friendly, faster initial render
**Cons**: Server load, slower navigation
**When**: Public pages, SEO critical

---

**Strategy 3: Static Site Generation (SSG)**

```jsx
// Next.js
export async function getStaticProps() {
  const posts = await fetch('https://api.example.com/feed').then(r => r.json());

  return {
    props: { posts },
    revalidate: 60  // Regenerate every 60 seconds
  };
}
```

**Pros**: Fastest, cacheable, cheap hosting
**Cons**: Not for dynamic content
**When**: Blogs, marketing pages

---

**Strategy 4: Hybrid (ISR - Incremental Static Regeneration)** ⭐

```jsx
export async function getStaticProps() {
  const posts = await fetch('https://api.example.com/feed').then(r => r.json());

  return {
    props: { posts },
    revalidate: 10  // Regenerate every 10 seconds
  };
}

const FeedPage = ({ posts: initialPosts }) => {
  // Use static data initially, then fetch fresh data
  const { data: freshPosts } = useSWR('/api/feed', fetcher, {
    fallbackData: initialPosts
  });

  return <FeedList posts={freshPosts || initialPosts} />;
};
```

**Pros**: Fast initial load + fresh data
**Cons**: Complexity
**When**: Best of both worlds (recommended)

### Alternative Approaches: Framework Comparison

**React (Most Popular)**

```jsx
const FeedContainer = () => {
  const [posts, setPosts] = useState([]);

  return <FeedList posts={posts} />;
};
```

**Pros**: Huge ecosystem, flexibility, job market
**Cons**: Requires many libraries, boilerplate

---

**Vue (Simpler)**

```vue
<template>
  <FeedList :posts="posts" />
</template>

<script setup>
import { ref, onMounted } from 'vue';

const posts = ref([]);

onMounted(async () => {
  const response = await fetch('/api/feed');
  posts.value = await response.json();
});
</script>
```

**Pros**: Simpler, batteries included, template syntax
**Cons**: Smaller ecosystem than React

---

**Svelte (Fastest)**

```svelte
<script>
  import { onMount } from 'svelte';

  let posts = [];

  onMount(async () => {
    const response = await fetch('/api/feed');
    posts = await response.json();
  });
</script>

<FeedList {posts} />
```

**Pros**: No virtual DOM (faster), less code, reactive
**Cons**: Smallest ecosystem, fewer jobs

---

**Solid.js (Fine-Grained Reactivity)**

```jsx
import { createSignal, createEffect } from 'solid-js';

const FeedContainer = () => {
  const [posts, setPosts] = createSignal([]);

  createEffect(async () => {
    const response = await fetch('/api/feed');
    setPosts(await response.json());
  });

  return <FeedList posts={posts()} />;
};
```

**Pros**: React-like syntax, better performance
**Cons**: New, small ecosystem

---

### Metrics to Measure

**Performance Metrics**:
```javascript
// Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
  → First post visible time

- FID (First Input Delay): < 100ms
  → Time from click to response

- CLS (Cumulative Layout Shift): < 0.1
  → Measure content jumping (images loading)

// Custom Metrics
- Time to First Post: < 1s
- Scroll FPS: 60 FPS
- Bundle Size: < 300KB (gzipped)
- API Response Time: < 200ms
```

**Measuring in Code**:

```javascript
// Measure LCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });

// Measure FPS
let lastTime = performance.now();
let frames = 0;

function measureFPS() {
  const now = performance.now();
  frames++;

  if (now >= lastTime + 1000) {
    const fps = Math.round((frames * 1000) / (now - lastTime));
    console.log('FPS:', fps);
    frames = 0;
    lastTime = now;
  }

  requestAnimationFrame(measureFPS);
}

measureFPS();
```

---

## 2. Design an Autocomplete/Typeahead Component

### Requirements
- **Q**: Data source? (local array, API)
- **Q**: How many items? (100, 1M)
- **Q**: Fuzzy search or prefix match?
- **Q**: Keyboard navigation support?
- **Q**: Accessibility requirements?

**Assumptions**:
- API-based search
- 1M+ items in backend
- Prefix match
- Full keyboard navigation
- ARIA compliant

### Component Architecture

```jsx
Autocomplete/
├── AutocompleteInput
│   └── ClearButton
├── SuggestionList (conditionally rendered)
│   ├── SuggestionItem (repeated)
│   └── LoadingSpinner
└── NoResults
```

### Implementation Approaches

**Approach 1: Controlled Component with Debouncing**

```jsx
import { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

const Autocomplete = ({ onSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const debouncedSearch = useRef(
    debounce(async (searchQuery) => {
      if (!searchQuery) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        const data = await response.json();
        setSuggestions(data.results);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    }, 300)  // Wait 300ms after user stops typing
  ).current;

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(item);
  };

  return (
    <div className="autocomplete">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-controls="suggestions-list"
        aria-expanded={isOpen}
      />

      {isOpen && query && (
        <ul
          id="suggestions-list"
          role="listbox"
          className="suggestions"
        >
          {loading && <li>Loading...</li>}

          {!loading && suggestions.length === 0 && (
            <li>No results found</li>
          )}

          {!loading && suggestions.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'active' : ''}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {highlightMatch(item.name, query)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Highlight matching text
const highlightMatch = (text, query) => {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <strong>{text.slice(index, index + query.length)}</strong>
      {text.slice(index + query.length)}
    </>
  );
};
```

### Performance Optimizations

**Optimization 1: Debouncing**

**Problem**: Search on every keystroke

```
User types "react"
→ 5 keystrokes = 5 API calls:
  /api/search?q=r
  /api/search?q=re
  /api/search?q=rea
  /api/search?q=reac
  /api/search?q=react
```

**Solution**: Wait for user to stop typing

```javascript
const debouncedSearch = debounce(search, 300);

// User types "react" over 500ms
// Only 1 API call after 300ms pause:
// /api/search?q=react

// 5x fewer API calls!
```

---

**Optimization 2: Request Cancellation**

**Problem**: Slow responses arrive out of order

```
User types "react" quickly:
→ /api/search?q=re (sent at t=0, responds at t=500ms)
→ /api/search?q=rea (sent at t=100, responds at t=150ms)

Result: "rea" results shown (wrong!)
```

**Solution**: Cancel previous requests

```javascript
const Autocomplete = () => {
  const abortControllerRef = useRef(null);

  const search = async (query) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: abortControllerRef.current.signal
      });
      const data = await response.json();
      setSuggestions(data.results);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
};
```

---

**Optimization 3: Client-Side Caching**

```javascript
const Autocomplete = () => {
  const cacheRef = useRef({});

  const search = async (query) => {
    // Check cache first
    if (cacheRef.current[query]) {
      setSuggestions(cacheRef.current[query]);
      return;
    }

    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();

    // Store in cache
    cacheRef.current[query] = data.results;
    setSuggestions(data.results);
  };
};

// User types "react", then deletes, then types "react" again
// First search: API call
// Second search: instant (cached)
```

---

**Optimization 4: Virtual Scrolling (for many results)**

```jsx
import { FixedSizeList } from 'react-window';

const AutocompleteLarge = () => {
  const [suggestions, setSuggestions] = useState([]);

  const Row = ({ index, style }) => (
    <div style={style} onClick={() => handleSelect(suggestions[index])}>
      {suggestions[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={300}
      itemCount={suggestions.length}
      itemSize={40}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

// 10,000 suggestions
// Without virtualization: 10,000 DOM nodes (laggy)
// With virtualization: ~8 visible nodes (smooth)
// 1,250x fewer DOM nodes!
```

### Alternative Approaches

**Approach 1: Trie Data Structure (Client-Side)**

For local, static data (e.g., country list):

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.data = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, data) {
    let node = this.root;

    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }

    node.isEndOfWord = true;
    node.data = data;
  }

  search(prefix) {
    let node = this.root;

    // Navigate to prefix
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }

    // Collect all words with this prefix
    const results = [];
    this._collectWords(node, prefix, results);
    return results;
  }

  _collectWords(node, prefix, results) {
    if (node.isEndOfWord) {
      results.push(node.data);
    }

    for (const [char, childNode] of Object.entries(node.children)) {
      this._collectWords(childNode, prefix + char, results);
    }
  }
}

// Usage
const trie = new Trie();
const countries = ['United States', 'United Kingdom', 'Ukraine', ...];

countries.forEach(country => trie.insert(country, { name: country }));

// Search
const results = trie.search('uni');  // ['United States', 'United Kingdom']

// Performance:
// Array.filter: O(n) where n = total items
// Trie search: O(m) where m = prefix length
// For 1000 countries, 100x faster!
```

---

**Approach 2: Fuzzy Search (Levenshtein Distance)**

```javascript
// Calculate edit distance between two strings
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,  // Insertion
        matrix[j - 1][i] + 1,  // Deletion
        matrix[j - 1][i - 1] + substitutionCost  // Substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

const fuzzySearch = (query, items, threshold = 2) => {
  return items
    .map(item => ({
      ...item,
      distance: levenshteinDistance(query, item.name)
    }))
    .filter(item => item.distance <= threshold)
    .sort((a, b) => a.distance - b.distance);
};

// Example:
fuzzySearch('recct', ['react', 'redux', 'recoil'], 2);
// → ['react'] (distance = 2)

// Allows typos: "recct" matches "react"
```

---

**Approach 3: Libraries**

```jsx
// Downshift (Accessible autocomplete by PayPal)
import { useCombobox } from 'downshift';

const Autocomplete = ({ items }) => {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex
  } = useCombobox({
    items,
    onInputValueChange: ({ inputValue }) => {
      // Fetch suggestions
    }
  });

  return (
    <div>
      <input {...getInputProps()} />
      <ul {...getMenuProps()}>
        {isOpen && items.map((item, index) => (
          <li
            key={item.id}
            {...getItemProps({ item, index })}
            style={{
              backgroundColor: highlightedIndex === index ? 'lightgray' : 'white'
            }}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Pros: Accessibility built-in, keyboard navigation, ARIA attributes
// Cons: Extra dependency
```

### Accessibility

```jsx
const AccessibleAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);

  const inputId = useId();
  const listboxId = useId();

  return (
    <div>
      <label htmlFor={inputId}>
        Search
      </label>

      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        // ARIA attributes
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={
          activeIndex >= 0 ? `option-${activeIndex}` : undefined
        }
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              id={`option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}

      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {suggestions.length} results available
      </div>
    </div>
  );
};
```

**ARIA Attributes**:
- `role="combobox"`: Identifies input as autocomplete
- `aria-autocomplete="list"`: Indicates suggestions shown
- `aria-controls`: Links input to suggestion list
- `aria-expanded`: Indicates if list is visible
- `aria-activedescendant`: Current highlighted option
- `aria-live="polite"`: Announces results to screen readers

### Metrics

**Performance**:
```
- Debounce delay: 300ms
- API response time: < 100ms
- Time to show results: < 400ms total

- Keystroke to API call ratio: 1:5 (5x reduction)
- Cache hit rate: > 30%

- Accessibility: WCAG 2.1 AA compliant
```

---

## Quick Reference: Remaining Frontend Problems

### 3. Real-Time Collaborative Editor
- **Operational Transformation (OT)** vs **CRDTs**
- WebSocket sync
- Conflict resolution
- Cursor positions
- Undo/redo in collaborative context

### 4. Image Carousel
- Touch gestures (swipe)
- Keyboard navigation
- Lazy loading images
- Preloading (previous + next)
- Infinite loop vs bounded

### 5. Infinite Scroll
- Intersection Observer API
- Placeholder skeletons
- Error handling (retry)
- "Load more" fallback
- Scroll position restoration

### 6. Virtual Scrolling List
- Fixed size vs dynamic size
- react-window vs react-virtualized
- Scrollbar accuracy
- Overscan (render buffer)
- 1000x DOM node reduction

### 7. Chat Application UI
- Message grouping
- Read receipts
- Typing indicators
- Optimistic updates
- Scroll-to-bottom behavior

### 8. Data Visualization Dashboard
- Canvas vs SVG vs WebGL
- D3.js vs Chart.js vs Recharts
- Real-time updates
- Drill-down interactions
- Responsive charts

### 9. Form Builder
- Drag-and-drop components
- Validation engine
- Conditional fields
- State management (React Hook Form vs Formik)
- JSON schema generation

### 10. Video Player
- HLS/DASH streaming
- Quality switching
- Buffering strategy
- Custom controls
- Picture-in-picture

### 11. Notification System
- Toast notifications
- Permission API
- Service worker push
- Queuing multiple notifications
- Dismissal logic

### 12. Modal/Dialog System
- Focus trap
- Scroll lock
- Escape key handling
- Portal rendering
- Stacking multiple modals

### 13. Responsive Navigation
- Hamburger menu
- Breakpoints (mobile, tablet, desktop)
- Touch gestures
- Mega menus
- Accessibility (skip links)

### 14. State Management System
- Flux pattern
- Redux vs MobX vs Zustand
- Atoms (Jotai/Recoil)
- Immutability
- DevTools integration

### 15. Progressive Web App
- Service worker lifecycle
- Caching strategies (CacheFirst, NetworkFirst)
- Offline mode
- App manifest
- Install prompt

---

**Would you like me to expand any of these problems or move on to the System Design section?**
