import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function Song() {
  const { albumId } = useParams();
  const [song, setSong] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5141/api/albums/${albumId}/songs`)
      .then((response) => response.json())
      .then((data) => setSong(data));
  }, [albumId]);

  return (
    <div>
      <h1>Song</h1>
      <ul>
        {song.map((song) => (
          <li key={song.id}>{song.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default Song;