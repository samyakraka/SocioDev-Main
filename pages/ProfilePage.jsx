import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ArticleListItem from "../components/ArticleListItem";

function ProfilePage() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Fetch user info
    fetch(`/api/users/${username}`)
      .then((res) => res.json())
      .then((data) => setUser(data));

    // Fetch user's articles
    fetch(`/api/articles?author=${username}`)
      .then((res) => res.json())
      .then((data) => setArticles(data));
  }, [username]);

  const handleFollow = () => {
    fetch(`/api/users/${username}/follow`, { method: "POST" }).then(() =>
      setIsFollowing(true)
    );
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <h2>{user.username}'s Profile</h2>
      <button onClick={handleFollow} disabled={isFollowing}>
        {isFollowing ? "Following" : "Follow"}
      </button>
      <h3>Articles by {user.username}</h3>
      {articles.map((article) => (
        <ArticleListItem key={article.id} article={article} />
      ))}
    </div>
  );
}

export default ProfilePage;
