import React from "react";
import { Link } from "react-router-dom";

function ArticleListItem({ article }) {
  return (
    <div className="article-list-item">
      <h2>{article.title}</h2>
      <p>{article.body}</p>
      <div className="article-author">
        <span>By </span>
        <Link to={`/profile/${article.author.username}`}>
          {article.author.username}
        </Link>
      </div>
    </div>
  );
}

export default ArticleListItem;
