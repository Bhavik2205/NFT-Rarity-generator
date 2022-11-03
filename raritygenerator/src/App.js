import "./App.css";
import axios from "axios";
import { useState } from "react";
import myFile from "./myFile.json";

function App() {
  const [Start, setStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [Stop, setStop] = useState("");
  const [Link, setLink] = useState("");

  const onButtonClick = () => {
    // using Java Script method to get PDF file
    fetch("./myFile.json").then((response) => {
      response.blob().then((blob) => {
        // Creating new object of PDF file
        const fileURL = window.URL.createObjectURL(blob);
        // Setting various property values
        let alink = document.createElement("a");
        alink.href = fileURL;
        alink.download = "rarity.json";
        alink.click();
      });
    });
  };

  const handleSubmit = async (event) => {
    console.log("Please wait, your request is getting processed");
    event.preventDefault(); // 👈️ prevent page refresh

    try {
      setLoading(true);
      const result = await axios
        .post("http://localhost:3000/generate", {
          start: Start,
          stop: Stop,
          link: Link,
        })
        .then((response) => {
          console.log(response.data.Success);
          setLoading(false);
          window.alert("Rarity Successfully generated");
        })
        .catch((err) => {
          console.log(err.message);
          setLoading(false);
          window.alert("Something went wrong");
        });
    } catch (error) {
      console.log(error.message);
    }

    // 👇️ access input values here
    console.log("Start 👉️", Start);
    console.log("Stop 👉️", Stop);
    console.log("Link 👉️", Link);

    // 👇️ clear all input values in the form
    setStart("");
    setStop("");
    setLink("");
  };
  return (
    <div className="container">
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <ul>
            <h2> Please Wait, Server is working on your request</h2>
          </ul>
        </div>
      ) : (
        <div className="App">
          <header className="App-header">
            <button onClick={onButtonClick}>Download PDF</button>
            <form onSubmit={handleSubmit}>
              <h3>
                Starting Index:
                <input
                  id="start"
                  name="Start"
                  type="text"
                  onChange={(event) => setStart(event.target.value)}
                  value={Start}
                />
              </h3>
              <h3>
                Stopping Index:
                <input
                  id="stop"
                  name="Stop"
                  type="text"
                  onChange={(event) => setStop(event.target.value)}
                  value={Stop}
                />
              </h3>
              <h3>
                Link / URL:
                <input
                  id="link"
                  name="Link"
                  type="text"
                  onChange={(event) => setLink(event.target.value)}
                  value={Link}
                />
              </h3>
              <button>Submit</button>
            </form>
          </header>
        </div>
      )}
    </div>
  );
}

export default App;
