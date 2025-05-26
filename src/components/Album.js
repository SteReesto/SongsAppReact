import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function Album() {
  const { artistId } = useParams();
  const [album, setAlbum] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5141/${artistId}/albums`)
      .then((response) => response.json())
      .then((data) => setAlbum(data));
  }, [artistId]);

  return (
    <div>
      <h1>Album</h1>
      <ul>
        {album.map((album) => (
          <li key={album.id}>
            <Link to={`/songs/${album.id}`}>{album.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Album;