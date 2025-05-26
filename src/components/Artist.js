import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Artist() {
  const [artist, setArtist] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5141")
      .then((response) => response.json())
      .then((data) => setArtist(data));
  }, []);

  return (
    <div>
      <h1>Artist</h1>
      <ul>
        {artist.map((artist) => (
          <li key={artist.id}>
            <Link to={`/albums/${artist.id}`}>{artist.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Artist;