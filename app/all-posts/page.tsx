import PostList from "@/components/PostList";

export default function AllPosts() {
  return (
    <div className="container">
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '16px' }}>
        All Blog Posts
      </h2>
      <p style={{ marginBottom: '16px', color: '#4b5563' }}>
        Here you can view all posts by all users.
      </p>
      <PostList searchQuery="" allPosts={true} />
    </div>
  );
}