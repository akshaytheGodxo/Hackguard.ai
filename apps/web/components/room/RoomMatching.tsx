"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { type Socket } from "socket.io-client";

export default function TestPage() {
    const [socket, setSocket] = useState<any>(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<any>([]);

    const roomId = "local-chat-room";


    useEffect(() => {
        const newSocket = io("http://localhost:3001");

        newSocket.on("connect", () => {
            console.log("Connected:", newSocket.id);
            newSocket.emit("join-room", "local-chat-room");
        });

        newSocket.on("receive-message", (data) => {
            console.log("Received:", data);
            setMessages((prev) => [...prev, data]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);


    function sendMessage(e: any) {
        e.preventDefault();

        if (!socket || !message.trim()) return;

        const text = message.trim();

        // Display the sender's own message locally
        setMessages((prev: any) => [
            ...prev,
            {
                senderId: socket.id,
                message: text,
                timestamp: new Date().toISOString(),
            },
        ]);

        socket.emit("send-message", {
            roomId,
            message: text,
        });

        setMessage("");

    }


    return (
        <main style={{ padding: 24 }}>
            <h1>Local Socket.IO Chat</h1>

            <p>
                Status: {socket?.connected ? "Connected" : "Disconnected"}
            </p>

            <div style={{ marginBottom: 20 }}>
                {messages.map((msg, index) => (
                    <p key={index}>
                        <strong>
                            {msg.senderId === socket?.id ? "You" : "Other user"}:
                        </strong>{" "}
                        {msg.message}
                    </p>
                ))}
            </div>

            <form onSubmit={sendMessage}>
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                />

                <button type="submit">Send</button>
            </form>
        </main>
    );
}