import React from 'react';
import { useState } from 'react';
import Head from 'next/head';
import { createGlobalStyle } from 'tailwind-styled-components';
import Script from "next/script";
import Image from "next/image";
import Minecraft from '/public/minecraft.jpg'
import { useEffect } from 'react'
import io from 'socket.io-client'

let socket

const GlobalStyle = 'createGlobalStyle'

export default function Chatbot() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socketInitializer(), []
    })

    const socketInitializer = async () => {
        if(!socket || !socket.connected){
            //await fetch("/api/socket")
            socket = io('ws://' + process.env.SERVER + ':8085')

            socket.on('connect', () => {
                console.log('connected')
            })
            socket.on("welcome", function(data){
                alert(data.message)
            })

            socket.on("chat", function(data){
                alert(data.message)
                if(data.weather){
                    console.log(data.weather)
                }
            })

            socket.on("writing", function(data){
                if(data.active){
                    alert("writing on")
                }else{
                    alert("writing off")
                }
            })
        }

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessages([...messages, { text: input, isUser: true }]);
        socket.emit('chat', {
            'message': input
        })
        setInput('');
    };

    return (
        <div className="h-screen flex flex-col bg-cover bg-no-repeat bg-fixed bg-center"
        style={{backgroundImage: "url('/minecraft.jpg')"}}>
            <div className="h-full flex items-center justify-center">
            <div className="h-4/5 w-2/3 flex-col flex justify-center  bg-blue-500/75">
            <header className="bg-white p-4 flex-shrink-0">
                <h1 className="text-xl font-medium">Chatbot</h1>
            </header>
            <main className="flex-1 overflow-y-scroll p-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`bg-white p-2 rounded-lg mb-4 flex-shrink-0 ${
                            message.isUser ? 'ml-auto' : 'mr-auto'
                        }`}
                    >
                        <p className="text-sm">{message.text}</p>
                    </div>
                ))}
            </main>
            <footer className="bg-white p-4 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="bg-gray-200 p-2 rounded-lg w-full"
                        placeholder="Type a message..."
                    />
                    <button type="submit" className="ml-2 p-2 rounded-lg bg-blue-500 text-white">
                        Send
                    </button>
                </form>
            </footer>
            </div>
            </div>
        </div>
    );
}
