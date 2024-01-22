import Img from "../images/img.png";
import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleSend = async () => {
    try {

      // Check if the input string is null or empty
    if (!text) {
      console.warn("Input string is empty. Not sending anything.");

       // Show a user alert or notification (customize as needed)
       alert("Please enter a message before sending.");
      return;
    }
      if (img) {
        const storageRef = ref(storage, uuid());

        const uploadTask = uploadBytesResumable(storageRef, img);

        uploadTask.on(
          (error) => {
            //TODO:Handle Error
            console.error(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(
              async (downloadURL) => {
                await updateDoc(doc(db, "chats", data.chatId), {
                  messages: arrayUnion({
                    id: uuid(),
                    text,
                    senderId: currentUser.uid,
                    date: Timestamp.now(),
                    img: downloadURL,
                  }),
                });
              }
            );
          }
        );
      } else {
        await updateDoc(doc(db, "chats", data.chatId), {
          messages: arrayUnion({
            id: uuid(),
            text,
            senderId: currentUser.uid,
            date: Timestamp.now(),
          }),
        });
      }

      // Update last message and date for both users in userChats collection
      await Promise.all([
        updateDoc(doc(db, "userChats", currentUser.uid), {
          [data.chatId + ".lastMessage"]: {
            text,
          },
          [data.chatId + ".date"]: serverTimestamp(),
        }),

        updateDoc(doc(db, "userChats", data.user.uid), {
          [data.chatId + ".lastMessage"]: {
            text,
          },
          [data.chatId + ".date"]: serverTimestamp(),
        }),
      ]);

       // Clear input fields
    setText("");
    setImg(null);
      
    } catch (error) {
      console.error("Error sending message:", error);
      // TODO: Notify the user about the error
    }
  };

  const handleKeyPress = (e) => {
    // If Enter key is pressed and Shift key is not held down, send the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in the input field
      handleSend();
    }
  };

  return (
    <div className="input">
      <input
        type="text"
        placeholder="Type something..."
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress} // Listen for keypress events
        value={text}
      />
      <div className="send">
        <label htmlFor="file" className="file-label">
          <img src={Img} alt="" />
        </label>
        <input
          type="file"
          id="file"
          style={{ display: "none" }}
          onChange={(e) => setImg(e.target.files[0])}
           // Add file type validation (accept only image files)
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Input;
