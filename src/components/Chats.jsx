import { doc, onSnapshot } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../firebase";

const Chats = () => {
  const [chats, setChats] = useState([]);

  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  useEffect(() => {
    const getChats = () => {
      console.log("Current User ID:", currentUser.uid);
  
      const unSub = onSnapshot(
        doc(db, "userChats", currentUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            console.log("User Chats Data:", snapshot.data());
            setChats(snapshot.data());
          } else {
            console.log("User Chats Document does not exist");
            setChats([]);
          }
        }
      );
  
      return () => {
        unSub();
      };
    };
  
    currentUser.uid && getChats();
  }, [currentUser.uid]);
  

  const handleSelect = (u) => {
    dispatch({ type: "CHANGE_USER", payload: u });
  };

  return (
    <div className="chats">
      {Object.entries(chats)
        ?.sort((a, b) => b[1].date - a[1].date)
        .map((chat) => (
          // Check if chat[1] is defined before accessing its properties
          <div
            className="userChat"
            key={chat[0]}
            onClick={() => handleSelect(chat[1]?.userInfo)}
          >
            {chat[1] && (
              <>
                <img src={chat[1]?.userInfo?.photoURL} alt="" />
                <div className="userChatInfo">
                  <span>{chat[1]?.userInfo?.displayName}</span>
                  <p>{chat[1]?.lastMessage?.text}</p>
                </div>
              </>
            )}
          </div>
        ))}
    </div>
  );
};

export default Chats;
