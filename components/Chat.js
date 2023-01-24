import React, {useRef} from 'react';
import { useState } from 'react';
import Head from 'next/head';
import { createGlobalStyle } from 'tailwind-styled-components';
import Script from "next/script";
import Image from "next/image";
import { useEffect } from 'react'
import io from 'socket.io-client'

let socket

let videoName = "Clear_day";

const GlobalStyle = 'createGlobalStyle'

export default function Chatbot() {
    const videoRef = useRef();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socketInitializer(), []
    })

    useEffect(() => {
        videoRef.current?.load();
    }, [videoName]);

    const socketInitializer = async () => {
        if(!socket || !socket.connected){
            //await fetch("/api/socket")
            socket = io('ws://' + process.env.SERVER + ':8085')

            socket.on('connect', () => {
                console.log('connected')
            })
            socket.on("welcome", function(data){
                let message = data.message
                setMessages([...messages, { text: message, isUser: false }]);
            })

            socket.on("chat", function(data){
                let message = data.message
                setMessages([...messages, { text: message, isUser: false }]);
                if(data.weather){
                    let weather = data.weather
                    let time = new Date(data.time)
                    changeVideo(weather, time)
                    console.log(weather)
                }
            })

            socket.on("writing", function(data){
                if(data.active){
                    setMessages([...messages, { text: "...", isUser: false }])
                }else{
                    setMessages(messages.slice(0, -1))
                }
            })
        }

        function changeVideo(weather, time){
            let icon = weather.weather.weather[0].icon
            let isDay = true
            if(time.getHours() < 5 || time.getHours() > 18){
                isDay = false
            }
            switch(icon){
                case "clear-day":
                    videoName = "Clear_day"
                    break;
                case "partly-cloudy-day":
                    videoName = "Clear_day"
                    break;
                case "partly-cloudy-night":
                    videoName = "Clear_night"
                    break;
                case "clear-night":
                    videoName = "Clear_night"
                    break;

                case "cloudy":
                    if(isDay){
                        videoName = "Clear_day"
                    }else{
                        videoName = "Clear_night"
                    }
                    break;
                case "sunny":
                    if(isDay){
                        videoName = "Clear_day"
                    }else{
                        videoName = "Clear_night"
                    }
                    break;
                case "wind":
                    if(isDay){
                        videoName = "Clear_day"
                    }else{
                        videoName = "Clear_night"
                    }
                    break;
                case "fog":
                    if(isDay){
                        videoName = "Rain_day"
                    }else{
                        videoName = "Rain_night"
                    }
                    break;
                case "rain":
                    if(isDay){
                        videoName = "Rain_day"
                    }else{
                        videoName = "Rain_night"
                    }
                    break;
                case "snow":
                    if(isDay){
                        videoName = "Snow_day"
                    }else{
                        videoName = "Snow_night"
                    }
                    break;
                case "thunderstorm":
                    if(isDay){
                        videoName = "Thunder_day"
                    }else{
                        videoName = "Thunder_night"
                    }
                    break;
            }
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
        <div className="h-screen flex flex-col bg-cover bg-no-repeat bg-fixed bg-center">
            <video autoPlay muted loop className="video" ref={videoRef}>
                <source src={"/" + videoName + ".mp4"} type="video/mp4"/>
            </video>
            <div className="h-full flex items-center justify-center">
            <div className="h-4/5 w-2/3 flex-col flex justify-center  bg-blue-500/75">
            <header className="bg-white p-4 flex-shrink-0">
                <h1 className="text-xl font-medium text-black">Chatbot</h1>
            </header>
            <main className="flex-1 overflow-y-scroll p-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`bg-white p-2 rounded-lg mb-4 flex-shrink-0 text-black ${
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
                        className="bg-gray-200 p-2 rounded-lg w-full text-black"
                        placeholder="Schreibe eine Nachricht..."
                    />
                    <button type="submit" className="ml-2 p-2 rounded-lg bg-blue-500 text-white">
                        Senden
                    </button>
                </form>
            </footer>
            </div>
            </div>
        </div>
    );
}
