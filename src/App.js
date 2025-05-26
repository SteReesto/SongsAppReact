import logo from './logo.svg';
import './App.css';
import { Component } from 'react';
import Artist from './components/Artist';
import Album from './components/Album';
import Song from './components/Song';

import * as bootstrap from 'bootstrap';

class App extends Component {

constructor(props) {
  super(props);
  this.state = {
    artists: [],
    name: "",
    albums: [],
    title: "",
    songs: [],
    id: 0,
    isLoading: false,
    currentView: 'artists',
    selectedArtistId: null,
    selectedAlbumId: null,
    selectedAlbumName: ""
  }
}

API_URL="http://localhost:5141/";

closeModal(modalId) {
  try {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    let modal = bootstrap.Modal.getInstance(modalElement);
    
    if (modal) {
      modal.hide();
    }
    
    setTimeout(() => {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      
      if (!document.querySelector('.modal.show')) {
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
      }
    }, 300);
  } catch (error) {
    console.error("Error closing modal:", error);
  }
}

componentDidMount(){
  this.refreshArtists();
}

async refreshArtists() {
  this.setState({ isLoading: true});

  const response = await fetch(this.API_URL + "api/Artists/GetArtists");
  
  const data = await response.json();
  this.setState({ artists: data, isLoading: false });
}

async addArtist() {
  const name = document.getElementById("name").value;

  if(!name) {
    alert("Please enter a name");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);

  const response = await fetch(this.API_URL + "api/Artists/AddArtist", {
    method: "POST",
    body: formData
  });
  
  const result = await response.json();
  alert("Artist added successfully");
  document.getElementById("name").value = '';
  this.refreshArtists();
}

editArtist(artist) {
  this.setState({      
      id: artist.Id,
      name: artist.Name 
  });
}

changeName = (e) => {
  this.setState({ name: e.target.value });
}

async updateArtist() {
  const data = new FormData();
  data.append("name", this.state.name);
  
  const response = await fetch(this.API_URL + "api/Artists/UpdateArtist?id=" + this.state.id, {
    method: "PUT",
    body: data
  });
  
  const result = await response.json();
  alert(result);
  this.refreshArtists();
  
  this.closeModal('exampleModal');
}

async deleteArtist(id) {
  if (!id) {
    alert("Cannot delete artist: Missing ID");
    return;
  }
    
  const response = await fetch(this.API_URL + "api/Artists/DeleteArtist?id=" + id, {
    method: "DELETE",
  });
    
  const result = await response.json();
  alert(result);
  this.refreshArtists();
}

displayArtists() {
  const { artists, isLoading } = this.state;
  
  if (isLoading) {
    return <p>Loading artists...</p>;
  }
  
  if (!artists) {
    return <p>No artists found</p>;
  }
  
  return (
    <div className="artist-list">
      <h3>Artists</h3>
      <div className="list-group mb-4">
        {artists.map((artist, index) => {
          
          const artistName = artist.Name;

          return (
            <div key={artist.Id} className="list-group-item d-flex justify-content-between align-items-center">
              <span className="artist-name">{artistName}</span>
              <div className="artist-actions">
                <button className="btn btn-danger btn-sm me-2" onClick={() => this.deleteArtist(artist.Id)}>
                  Delete
                </button>
                <button type="button" className="btn btn-primary btn-sm me-2" data-bs-toggle="modal" data-bs-target="#exampleModal" onClick={() => this.editArtist(artist)}>
                  Edit
                </button>
                <button type="button" className="btn btn-outline-info btn-sm" onClick={() => this.viewArtistAlbums(artist.Id, artist.Name)}>
                  Albums
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



async refreshAlbums() {
  this.setState({ isLoading: true});

  const response = await fetch(this.API_URL + "api/Albums/GetAlbumsByArtist?artistId=" + this.state.selectedArtistId);
  
  const data = await response.json();
  this.setState({ albums: data, isLoading: false });
}

async addAlbum() {
  const title = document.getElementById("title").value;
  const releaseDate = document.getElementById("albumReleaseDate").value;
  const genre = document.getElementById("albumGenre").value;

  if(!title) {
    alert("Please enter an album title");
    return;
  }

  if(!this.state.selectedArtistId) {
    alert("No artist selected");
    return;
  }
  
  const formData = new FormData();
  formData.append("title", title);
  formData.append("releaseDate", releaseDate || '');
  formData.append("numberOfSongs", 0);
  formData.append("genre", genre || '');
  formData.append("duration", 0);
  formData.append("artistId", this.state.selectedArtistId);

  const response = await fetch(this.API_URL + "api/Albums/AddAlbum", {
    method: "POST",
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  alert("Album added successfully");
  
  document.getElementById("title").value = '';
  document.getElementById("albumReleaseDate").value = '';
  document.getElementById("albumGenre").value = '';
  
  this.fetchAlbumsByArtist(this.state.selectedArtistId);
}

editAlbum(album) {
  this.setState({      
    id: album.Id,
    title: album.Title,
    releaseDate: album.ReleaseDate || '',
    numberOfSongs: album.NumberOfSongs || album.songCount || 0,
    genre: album.Genre || '',
    duration: album.Duration || album.calculatedDuration || 0,
    albumArtistId: album.ArtistId || this.state.selectedArtistId
  });
}

changeAlbumField = (e) => {
  this.setState({ [e.target.name]: e.target.value });
}

async updateAlbum() {
  const { id, title, releaseDate, numberOfSongs, genre, duration, albumArtistId } = this.state;
  
  if (!title) {
    alert("Album title cannot be empty");
    return;
  }
  
  if (!albumArtistId) {
    console.error("Missing artist ID for album update");
    alert("Error: Missing artist ID. Cannot update album.");
    return;
  }
  
  const formData = new FormData();
  formData.append("title", title);
  formData.append("releaseDate", releaseDate || '');
  formData.append("numberOfSongs", numberOfSongs || 0);
  formData.append("genre", genre || '');
  formData.append("duration", duration || 0);

  formData.append("artistId", albumArtistId);
  
  const response = await fetch(this.API_URL + "api/Albums/UpdateAlbum?id=" + id, {
    method: "PUT",
    body: formData
  });
  
  const result = await response.json();
  alert("Album updated successfully");
  
  this.closeModal('albumModal');
  
  this.fetchAlbumsByArtist(this.state.selectedArtistId);
}

async deleteAlbum(id) {
  if (!id) {
    alert("Cannot delete album: Missing ID");
    return;
  }
  
  const response = await fetch(this.API_URL + "api/Albums/DeleteAlbum?id=" + id, {
    method: "DELETE"
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  alert("Album deleted successfully");
  
  this.fetchAlbumsByArtist(this.state.selectedArtistId);
}

async fetchAlbumDuration(albumId) {
  const response = await fetch(this.API_URL + `api/Songs/GetSongsByAlbum?albumId=${albumId}`);
  
  if (!response.ok) {
    throw new Error(`Error fetching songs: ${response.status}`);
  }
  
  const songs = await response.json();
  
  const totalDuration = songs.reduce((total, song) => total + (song.Duration || 0), 0);
  const songCount = songs.length;
  
  this.setState(prevState => ({
    albums: prevState.albums.map(album => 
      album.Id === albumId ? {
        ...album, 
        calculatedDuration: totalDuration,
        songCount: songCount
      } : album
    )
  }));
}

displayAlbums() {
  const { albums, isLoading, selectedArtistName } = this.state;
  
  if (isLoading) {
    return <p>Loading albums...</p>;
  }
  
  if (!albums || albums.length === 0) {
    return (
      <div>
        <button className="btn btn-primary mb-3" onClick={this.backToArtists}>
          Back to Artists
        </button>
        <p>No albums found for {selectedArtistName}</p>
      </div>
    );
  }
  
  return (
    <div className="albums-list">
      <h3 className='mt-4 mb-2'>Albums by {selectedArtistName}</h3>
      <div className="list-group mb-4">
        {albums.map((album, index) => {
          
          const albumTitle = album.Title;
          const albumDuration = album.calculatedDuration || 0;
          const songCount = album.songCount || 0;

          return (
            <div key={album.Id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <span className="album-title fw-bold">{albumTitle}</span>
                <span className="ms-3 text-secondary">
                  {this.formatDuration(albumDuration)}
                </span>
                <span className="ms-2 badge bg-secondary rounded-pill">
                  {songCount} {songCount === 1 ? 'song' : 'songs'}
                </span>
              </div>
              <div className="album-actions">
                <button className="btn btn-danger btn-sm me-2" onClick={() => this.deleteAlbum(album.Id)}>
                  Delete
                </button>
                <button type="button" className="btn btn-primary btn-sm me-2" data-bs-toggle="modal" data-bs-target="#albumModal" onClick={() => this.editAlbum(album)}>
                  Edit
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-info btn-sm" 
                  onClick={() => this.viewAlbumSongs(album.Id, album.Title)}
                >
                  Songs
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary mb-3" onClick={this.backToArtists}>
        Back to Artists
      </button>
    </div>
  );
}



formatDuration(seconds) {
  if (!seconds) 
    return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const formattedSeconds = remainingSeconds < 10 ? 
    `0${remainingSeconds}` : 
    remainingSeconds;
    
  return `${minutes}:${formattedSeconds}`;
}

async addSong() {
  const title = document.getElementById("songTitle").value;
  const durationInput = document.getElementById("songDuration").value;
  const duration = parseInt(durationInput, 10);
  
  if (!title) {
    alert("Please enter a song title");
    return;
  }
  
  if (isNaN(duration) || duration <= 0) {
    alert("Please enter a valid duration in seconds");
    return;
  }
  
  if (!this.state.selectedAlbumId) {
    alert("No album selected");
    return;
  }
  
  const formData = new FormData();
  formData.append("title", title);
  formData.append("duration", duration);
  formData.append("albumId", this.state.selectedAlbumId);
  
  const response = await fetch(this.API_URL + "api/Songs/AddSong", {
    method: "POST",
    body: formData
  });
  
  const result = await response.json();
  alert("Song added successfully");
  
  document.getElementById("songTitle").value = '';
  document.getElementById("songDuration").value = '';
  
  this.fetchSongsByAlbum(this.state.selectedAlbumId);
  
  this.fetchAlbumDuration(this.state.selectedAlbumId);
}

editSong(song) {
  this.setState({      
    id: song.Id,
    songTitle: song.Title,
    songDuration: song.Duration,
    songAlbumId: song.AlbumId || this.state.selectedAlbumId
  });
}

changeSongField = (e) => {
  this.setState({ [e.target.name]: e.target.value });
}

async updateSong() {
  const { id, songTitle, songDuration, songAlbumId } = this.state;
  
  if (!songTitle) {
    alert("Song title cannot be empty");
    return;
  }
  
  if (isNaN(songDuration) || songDuration <= 0) {
    alert("Please enter a valid duration in seconds");
    return;
  }
  
  if (!songAlbumId) {
    console.error("Missing album ID for song update");
    alert("Error: Missing album ID. Cannot update song.");
    return;
  }
  
  const formData = new FormData();
  formData.append("title", songTitle);
  formData.append("duration", songDuration);
  formData.append("albumId", songAlbumId);
  
  const response = await fetch(this.API_URL + "api/Songs/UpdateSong?id=" + id, {
    method: "PUT",
    body: formData
  });
  
  const result = await response.json();
  alert("Song updated successfully");
  
  this.closeModal('songModal');
  
  this.fetchSongsByAlbum(this.state.selectedAlbumId);
  this.fetchAlbumDuration(this.state.selectedAlbumId);
}

async deleteSong(id) {
  if (!id) {
    alert("Cannot delete song: Missing ID");
    return;
  }
  
  const response = await fetch(this.API_URL + "api/Songs/DeleteSong?id=" + id, {
    method: "DELETE"
  });
  
  const result = await response.json();
  alert("Song deleted successfully");
  
  this.fetchSongsByAlbum(this.state.selectedAlbumId);
  
  this.fetchAlbumDuration(this.state.selectedAlbumId);
}

displaySongs() {
  const { songs, isLoading, selectedAlbumName } = this.state;
  
  if (isLoading) {
    return <p>Loading songs...</p>;
  }
  
  if (!songs || songs.length === 0) {
    return (
      <div>
        <button className="btn btn-primary mb-3" onClick={this.backToAlbums}>
          Back to Albums
        </button>
        <p>No songs found for {selectedAlbumName}</p>
      </div>
    );
  }
  
  return (
    <div className="songs-list">
      <h3>Songs from {selectedAlbumName}</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Title</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {songs.map(song => (
            <tr key={song.Id}>
              <td>{song.Title}</td>
              <td>{this.formatDuration(song.Duration)}</td>
              <td>
                <button 
                  className="btn btn-danger btn-sm me-2" 
                  onClick={() => this.deleteSong(song.Id)}
                >
                  Delete
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  data-bs-toggle="modal" 
                  data-bs-target="#songModal" 
                  onClick={() => this.editSong(song)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary mb-3" onClick={this.backToAlbums}>
        Back to Albums
      </button>
    </div>
  );
}

viewArtistAlbums = (artistId, artistName) => {
  this.setState({ 
    isLoading: true,
    currentView: 'albums',
    selectedArtistId: artistId,
    selectedArtistName: artistName
  });
  
  this.fetchAlbumsByArtist(artistId);
}

viewAlbumSongs = (albumId, albumName) => {
  this.setState({ 
    isLoading: true,
    currentView: 'songs',
    selectedAlbumId: albumId,
    selectedAlbumName: albumName
  });
  
  this.fetchSongsByAlbum(albumId);
}

backToArtists = () => {
  this.setState({ currentView: 'artists' });
  this.refreshArtists();
}

backToAlbums = () => {
  this.setState({ currentView: 'albums' });
  this.fetchAlbumsByArtist(this.state.selectedArtistId);
}

async fetchAlbumsByArtist(artistId) {
  const response = await fetch(this.API_URL + `api/Albums/GetAlbumsByArtist?artistId=${artistId}`);
  
  const albums = await response.json();
  
  this.setState({ albums, isLoading: false });
  
  for (const album of albums) {
    this.fetchAlbumDuration(album.Id);
  }
}

async fetchSongsByAlbum(albumId) {
  const response = await fetch(this.API_URL + `api/Songs/GetSongsByAlbum?albumId=${albumId}`);
  
  if (!response.ok) {
    throw new Error(`Error fetching songs: ${response.status}`);
  }
  
  const data = await response.json();
  this.setState({ songs: data, isLoading: false });
  }

render() {

  const { currentView } = this.state;
  const modalTitle = "Edit Artist";
  const { name } = this.state;

  let currentContent;
    if (currentView === 'artists') {
      currentContent = (
        <>
          <h2 className="mt-4 mb-2">New Artist</h2>
          <div className="mb-4">
            <div className="input-group">
              <input id="name" className="form-control" placeholder="Enter artist name"/>
              <button className="btn btn-success" onClick={() => this.addArtist()}>Add Artist</button>
            </div>
          </div>
          {this.displayArtists()}
        </>
      );
    } else if (currentView === 'albums') {
      currentContent = (
    <>
      <h2 className="mt-4 mb-2">New Album for {this.state.selectedArtistName}</h2>
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="title" className="form-label">Album Title</label>
                <input 
                  id="title" 
                className="form-control" 
                placeholder="Enter album title"
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="releaseDate" className="form-label">Release Date</label>
              <input 
                id="albumReleaseDate" 
                type="date" 
                className="form-control"
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="albumGenre" className="form-label">Genre</label>
              <input 
                id="albumGenre" 
                className="form-control" 
                placeholder="Genre"
              />
            </div>
            <div className="col-12">
              <button 
                className="btn btn-success mt-2" 
                onClick={() => this.addAlbum()}
              >
                Add Album
              </button>
            </div>
          </div>
        </div>
      </div>
      {this.displayAlbums()}
    </>
  );
    } else if (currentView === 'songs') {
      currentContent = (
    <>
      <h2 className="mt-4 mb-2">New Song for "{this.state.selectedAlbumName}"</h2>
      <div className="mb-4">
        <div className="input-group">
          <input 
            id="songTitle" 
            className="form-control" 
            placeholder="Enter song title"
          />
          <input 
            id="songDuration" 
            className="form-control" 
            placeholder="Duration (seconds)" 
            type="number" 
            min="1"
          />
          <button 
            className="btn btn-success" 
            onClick={() => this.addSong()}
          >
            Add Song
          </button>
        </div>
      </div>
      {this.displaySongs()}
    </>
  );
    }

    return (
      <div className="container mt-4">
       
      {currentContent}

      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalTitle}</h5>
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="modal" 
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="editName" className="form-label">Artist Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  id="editName"
                  value={name} 
                  onChange={this.changeName} 
                />
              </div>
              
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => this.updateArtist()}
              >
                Update
              </button>                               
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="albumModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Album</h5>
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="modal" 
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  id="title"
                  name="title"
                  value={this.state.title || ''} 
                  onChange={this.changeAlbumField} 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="releaseDate" className="form-label">Release Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  id="releaseDate"
                  name="releaseDate"
                  value={this.state.releaseDate || ''} 
                  onChange={this.changeAlbumField} 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="genre" className="form-label">Genre</label>
                <input 
                  type="text" 
                  className="form-control"
                  id="genre"
                  name="genre"
                  value={this.state.genre || ''} 
                  onChange={this.changeAlbumField} 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="numberOfSongs" className="form-label">Number of Songs</label>
                <input 
                  type="number" 
                  className="form-control"
                  id="numberOfSongs"
                  name="numberOfSongs"
                  value={this.state.numberOfSongs || 0} 
                  onChange={this.changeAlbumField} 
                  min="0"
                  readOnly
                />
              </div>
              <div className="mb-3">
                <label htmlFor="duration" className="form-label">Duration (seconds)</label>
                <input 
                  type="number" 
                  className="form-control"
                  id="duration"
                  name="duration"
                  value={this.state.duration || 0} 
                  onChange={this.changeAlbumField} 
                  min="0"
                  readOnly
                />
                {this.state.duration ? (
                  <small className="text-muted">
                    {this.formatDuration(this.state.duration)}
                  </small>
                ) : null}
              </div>
              
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => this.updateAlbum()}
              >
                Update Album
              </button>                               
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="songModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Song</h5>
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="modal" 
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="songTitle" className="form-label">Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  id="editSongTitle"
                  name="songTitle"
                  value={this.state.songTitle || ''} 
                  onChange={this.changeSongField} 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="songDuration" className="form-label">Duration (seconds)</label>
                <input 
                  type="number" 
                  className="form-control"
                  id="editSongDuration"
                  name="songDuration"
                  value={this.state.songDuration || 0} 
                  onChange={this.changeSongField} 
                  min="1"
                />
                {this.state.songDuration ? (
                  <small className="text-muted">
                    {this.formatDuration(this.state.songDuration)}
                  </small>
                ) : null}
              </div>
              
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => this.updateSong()}
              >
                Update Song
              </button>                               
            </div>
          </div>
        </div>
      </div>

    </div>    
  );
}
}

export default App;