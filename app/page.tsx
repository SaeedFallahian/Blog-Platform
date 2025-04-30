import PostList from "@/components/PostList";

export default function Home({ searchParams }: { searchParams: { q?: string } }) {
  const searchQuery = searchParams.q || '';

  return (
    <div className="container">
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '16px' }}>
        Welcome to the Blog Platform
      </h2>
      <p style={{ marginBottom: '16px', color: '#4b5563' }}>
        Here you can view and search your blog posts.
      </p>
      <div style={{ marginBottom: '24px' }}>
        <form action="/" method="GET">
          <input
            type="text"
            name="q"
            placeholder="Search posts..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            defaultValue={searchQuery}
          />
        </form>
      </div>
      <PostList searchQuery={searchQuery} />
    </div>
  );
}