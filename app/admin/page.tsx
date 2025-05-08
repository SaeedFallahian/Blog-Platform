import { currentUser } from '@clerk/nextjs/server';
  import PostList from '@/components/PostList';

  export default async function AdminPanel() {
    const user = await currentUser();

    if (!user) {
      return (
        <div className="container">
          <h1 className="admin-title">خطا</h1>
          <p className="admin-error">برای دسترسی به ادمین پنل وارد شوید</p>
        </div>
      );
    }

    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return (
        <div className="container">
          <h1 className="admin-title">خطا</h1>
          <p className="admin-error">فقط ادمین‌ها به این صفحه دسترسی دارند</p>
        </div>
      );
    }

    return (
      <div className="container">
        <h1 className="admin-title">ادمین پنل</h1>
        <PostList searchQuery="" isAllPosts={true} isAdmin={true} deleteAdmin={true} />
      </div>
    );
  }