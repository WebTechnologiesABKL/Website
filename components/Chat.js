import React, {useRef} from 'react';
import { useState } from 'react';
import Head from 'next/head';
import { createGlobalStyle } from 'tailwind-styled-components';
import Script from "next/script";
import Image from "next/image";
import { useEffect } from 'react'
import io from 'socket.io-client'

let socket


const GlobalStyle = 'createGlobalStyle'

function convertDateToString(dateObject, date, time){
    let dateString = "";
    if(date){
        switch (dateObject.getDay()) {
            case 0:
                dateString = "Sonntag, den ";
                break;
            case 1:
                dateString = "Montag, den ";
                break;
            case 2:
                dateString = "Dienstag, den ";
                break;
            case 3:
                dateString = "Mittwoch, den ";
                break;
            case 4:
                dateString = "Donnerstag, den ";
                break;
            case 5:
                dateString = "Freitag, den ";
                break;
            case 6:
                dateString = "Samstag, den ";
                break;
        }
        if(dateObject.getDate() < 10){
            dateString += "0" + dateObject.getDate();
        }else{
            dateString += dateObject.getDate();
        }
        if(dateObject.getMonth() < 9){
            dateString += ".0" + (dateObject.getMonth() + 1);
        }else{
            dateString += "." + (dateObject.getMonth() + 1);
        }
        dateString += "." + dateObject.getFullYear();
    }

    if(time){
        if(dateObject.getHours() < 10){
            dateString += " - 0" + dateObject.getHours();
        }else{
            dateString += " - " + dateObject.getHours();
        }

        if(dateObject.getMinutes() < 10){
            dateString += ":0" + dateObject.getMinutes();
        }else{
            dateString += ":" + dateObject.getMinutes();
        }
    }

    return dateString;
}

function scrollToBottom(){
    let box = document.getElementById('box');
    box.scrollTop = box.scrollHeight;
}

export default function Chatbot() {
    const videoRef = useRef();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [videoName, setVideoName] = useState('Clear_day')

    useEffect(() => {
        socketInitializer(), []
    })

    useEffect(() => {
        videoRef.current?.load();
    }, [videoName]);

    const socketInitializer = async () => {
        if(!socket || !socket.connected) {
            //await fetch("/api/socket")
            socket = io('ws://' + process.env.SERVER + ':8085')

            socket.on('connect', () => {
                console.log('Connected')
            })
            socket.on('disconnect', () => {
                console.log('Disconnected')
            })
            socket.on("welcome", function (data) {
                let message = data.message
                setMessages(currentArray => {
                    return [...currentArray, {
                        text: message,
                        isUser: false,
                        writing: false,
                        image: null,
                        forecast: null,
                        weather: null
                    }]
                });
                scrollToBottom();
            })

            socket.on("chat", function (data) {
                let message = data.message
                setMessages(currentArray => {
                    return [...currentArray, {
                        text: message,
                        isUser: false,
                        writing: false,
                        image: null,
                        forecast: null,
                        weather: null
                    }]
                });
                if (data.weather) {
                    let weather = data.weather
                    let time = new Date(data.time)
                    changeVideo(weather, time)
                    let weatherObject = [null]
                    let currentDay = new Date(weather.weather.weather[0].timestamp)
                        weather.weather.weather.every((hour, index) => {
                            if(new Date(hour.timestamp).getDay() !== currentDay.getDay() || (index + 1) == weather.weather.weather.length){
                                weatherObject[0].average /= weatherObject[0].values
                                weatherObject[0].average = weatherObject[0].average.toFixed(1)
                                currentDay = new Date(hour.timestamp)
                                return false;
                            }
                            if(!weatherObject[0]){
                                weatherObject[0] = {
                                    min: null,
                                    max: null,
                                    average: 0.0,
                                    values: 0,
                                    day: new Date(hour.timestamp),
                                    city: data.city,
                                    country: data.country
                                }
                            }
                            if(!weatherObject[0].min || weatherObject[0].min > hour.temperature){
                                weatherObject[0].min = hour.temperature
                            }
                            if(!weatherObject[0].max || weatherObject[0].max < hour.temperature){
                                weatherObject[0].max = hour.temperature
                            }
                            weatherObject[0].average += hour.temperature
                            weatherObject[0].values++;
                            weatherObject[(index + 1)] = {
                                timestamp: new Date(hour.timestamp),
                                temperature: hour.temperature,
                                icon: hour.icon,
                                condition: hour.condition,
                                sunshine: hour.sunshine,
                                windSpeed: hour.wind_speed,
                                cloudCover: hour.cloud_cover,
                                visibility: hour.visibility,
                                precipitation: hour.precipitation,
                                city: data.city,
                                country: data.country
                            }
                            return true;
                        })
                    console.log("WeatherObject:")
                    console.log(weatherObject)
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: null,
                            isUser: false,
                            writing: false,
                            image: null,
                            forecast: null,
                            weather: weatherObject
                        }]
                    });
                }
                scrollToBottom()
            })

            socket.on("image", function (data) {
                if (data.image) {
                    console.log(data.image)
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: null,
                            isUser: false,
                            writing: false,
                            image: data.image,
                            forecast: null,
                            weather: null
                        }]
                    });
                    scrollToBottom();
                }
            })

            socket.on("forecast", function (data) {
                if (data.forecast) {
                    let forecast = []
                    forecast.push([null])
                    let dayNumber = 0
                    let currentDay = new Date(data.forecast[0].weather.weather[0].timestamp)
                    data.forecast.forEach((day, indexDay) => {
                        //If not 404 (no weather data)
                        if(!day.weather.title){
                            day.weather.weather.forEach((hour, index) => {
                                if(new Date(hour.timestamp).getDay() !== currentDay.getDay()){
                                    forecast[dayNumber][0].average /= forecast[dayNumber][0].values
                                    forecast[dayNumber][0].average = forecast[dayNumber][0].average.toFixed(1)
                                    forecast[dayNumber][0].averageCalculated = true
                                    currentDay = new Date(hour.timestamp)
                                    dayNumber++
                                    forecast.push([null])
                                    forecast[dayNumber][0] = null
                                }
                                if(!forecast[dayNumber][0]){
                                    forecast[dayNumber][0] = {
                                        min: null,
                                        max: null,
                                        average: 0.0,
                                        averageCalculated: false,
                                        values: 0,
                                        day: new Date(hour.timestamp),
                                        city: data.city,
                                        country: data.country
                                    }
                                }
                                if(!forecast[dayNumber][0].min || forecast[dayNumber][0].min > hour.temperature){
                                    forecast[dayNumber][0].min = hour.temperature
                                }
                                if(!forecast[dayNumber][0].max || forecast[dayNumber][0].max < hour.temperature){
                                    forecast[dayNumber][0].max = hour.temperature
                                }
                                forecast[dayNumber][0].average += hour.temperature
                                forecast[dayNumber][0].values++;
                                forecast[dayNumber][(index + 1)] = {
                                    timestamp: new Date(hour.timestamp),
                                    temperature: hour.temperature,
                                    icon: hour.icon,
                                    condition: hour.condition,
                                    sunshine: hour.sunshine,
                                    windSpeed: hour.wind_speed,
                                    cloudCover: hour.cloud_cover,
                                    visibility: hour.visibility,
                                    precipitation: hour.precipitation,
                                    city: data.city,
                                    country: data.country
                                }
                            })
                        }
                    })
                    if(!forecast[dayNumber][0].averageCalculated){
                        forecast[dayNumber][0].average /= forecast[dayNumber][0].values
                        forecast[dayNumber][0].average = forecast[dayNumber][0].average.toFixed(2)
                        forecast[dayNumber][0].averageCalculated = true
                    }
                    console.log("Forecast Object:")
                    console.log(forecast)
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: null,
                            isUser: false,
                            writing: false,
                            image: null,
                            forecast: forecast,
                            weather: null
                        }]
                    });
                    scrollToBottom();
                    setTimeout(() => {
                       scrollToBottom();
                    }, 100)
                }
            })

            socket.on("writing", function (data) {
                if (data.active) {
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: "...",
                            isUser: false,
                            writing: true,
                            image: null,
                            forecast: null,
                            weather: null
                        }]
                    });
                } else {
                    setMessages((currentArray) => currentArray.filter((item) => !item.writing));
                }
                scrollToBottom();
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
                    setVideoName("Clear_day")
                    break;
                case "partly-cloudy-day":
                    setVideoName("Clear_day")
                    break;
                case "partly-cloudy-night":
                    setVideoName("Clear_night")
                    break;
                case "clear-night":
                    setVideoName("Clear_night")
                    break;

                case "cloudy":
                    if(isDay){
                        setVideoName("Clear_day")
                    }else{
                        setVideoName("Clear_night")
                    }
                    break;
                case "sunny":
                    if(isDay){
                        setVideoName("Clear_day")
                    }else{
                        setVideoName("Clear_night")
                    }
                    break;
                case "wind":
                    if(isDay){
                        setVideoName("Clear_day")
                    }else{
                        setVideoName("Clear_night")
                    }
                    break;
                case "fog":
                    if(isDay){
                        setVideoName("Rain_day")
                    }else{
                        setVideoName("Rain_night")
                    }
                    break;
                case "rain":
                    if(isDay){
                        setVideoName("Rain_day")
                    }else{
                        setVideoName("Rain_night")
                    }
                    break;
                case "snow":
                    if(isDay){
                        setVideoName("Snow_day")
                    }else{
                        setVideoName("Snow_night")
                    }
                    break;
                case "sleet":
                    if(isDay){
                        setVideoName("Snow_day")
                    }else{
                        setVideoName("Snow_night")
                    }
                    break;
                case "thunderstorm":
                    if(isDay){
                        setVideoName("Thunder_day")
                    }else{
                        setVideoName("Thunder_night")
                    }
                    break;
            }
        }

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if(input){
            setMessages(currentArray => {return [...currentArray, { text: input, isUser: true, writing: false, image: null, forecast: null, weather: null }]});
            scrollToBottom();
            socket.emit('chat', {
                'message': input
            })
            setInput('');
        }
    };

    return (
        <div className="h-screen flex flex-col bg-cover bg-no-repeat bg-fixed bg-center">
            <video autoPlay muted loop className="video" ref={videoRef}>
                <source src={"/" + videoName + ".mp4"} type="video/mp4"/>
            </video>
            <div className="h-full flex items-center justify-center">
            <div className="h-4/5 w-2/3 flex-col flex justify-center  bg-blue-500/75">
            <header className="bg-white p-4 flex-shrink-0">
                <h1 className="text-xl font-medium text-black font-minecraft">Chatbot</h1>
            </header>
            <main id="box" className="flex-1 overflow-y-scroll h-full justify-end overscroll-contain p-4">
                {messages.map((message, index) => {
                    if(message.text){
                        return (<div
                            key={index}
                            className={`bg-white p-2 mb-4 flex-shrink-0  w-fit w-min-3/4 text-black font-minecraft  ${
                                message.isUser ? 'ml-auto rounded-bl-3xl text-right rounded-tl-3xl rounded-tr-xl' : 'mr-auto bg-slate-600 rounded-br-3xl rounded-tr-3xl rounded-tl-xl'
                            }`}
                        >
                            <p className="text-base">{message.text}</p>
                        </div>)
                    }else if(message.image){
                        return (<div key={index}><img src={message.image}></img></div>)
                    }else if(message.forecast){
                        // return(
                        // <div className="flex flex-col space-y-6 w-2/3 max-w-screen-sm bg-white p-10 mt-10 rounded-xl ring-8 ring-white ring-opacity-40">
                        //     <div className="flex justify-between items-center">
                        //         <span className="font-semibold text-lg w-1/4">Fri, 22 Jan</span>
                        //         <div className="flex items-center justify-end w-1/4 pr-10">
                        //             <span className="font-semibold">12%</span>
                        //             <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 16 20" version="1.1"
                        //                  xmlns="http://www.w3.org/2000/svg">
                        //                 <g transform="matrix(1,0,0,1,-4,-2)">
                        //                     <path
                        //                         d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z"
                        //                         style="fill-rule:nonzero;"/>
                        //                 </g>
                        //             </svg>
                        //         </div>
                        //         <svg className="h-8 w-8 fill-current w-1/4" xmlns="http://www.w3.org/2000/svg"
                        //              height="24" viewBox="0 0 24 24" width="24">
                        //             <path d="M0 0h24v24H0V0z" fill="none"/>
                        //             <path
                        //                 d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495l1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96l1.41 1.41 1.79-1.8-1.41-1.41z"/>
                        //         </svg>
                        //         <span className="font-semibold text-lg w-1/4 text-right">18° / 32°</span>
                        //     </div>
                        //     <div className="flex justify-between items-center">
                        //         <span className="font-semibold text-lg w-1/4">Sat, 23 Jan</span>
                        //         <div className="flex items-center justify-end pr-10 w-1/4">
                        //             <span className="font-semibold">0%</span>
                        //             <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 16 20" version="1.1"
                        //                  xmlns="http://www.w3.org/2000/svg">
                        //                 <g transform="matrix(1,0,0,1,-4,-2)">
                        //                     <path
                        //                         d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z"
                        //                         style="fill-rule:nonzero;"/>
                        //                 </g>
                        //             </svg>
                        //         </div>
                        //         <svg className="h-8 w-8 fill-current w-1/4" xmlns="http://www.w3.org/2000/svg"
                        //              height="24" viewBox="0 0 24 24" width="24">
                        //             <path d="M0 0h24v24H0V0z" fill="none"/>
                        //             <path
                        //                 d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495l1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96l1.41 1.41 1.79-1.8-1.41-1.41z"/>
                        //         </svg>
                        //         <span className="font-semibold text-lg w-1/4 text-right">22° / 34°</span>
                        //     </div>
                        //     <div className="flex justify-between items-center">
                        //         <span className="font-semibold text-lg w-1/4">Sun, 24 Jan</span>
                        //         <div className="flex items-center justify-end pr-10 w-1/4">
                        //             <span className="font-semibold">20%</span>
                        //             <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 16 20" version="1.1"
                        //                  xmlns="http://www.w3.org/2000/svg">
                        //                 <g transform="matrix(1,0,0,1,-4,-2)">
                        //                     <path
                        //                         d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z"
                        //                         style="fill-rule:nonzero;"/>
                        //                 </g>
                        //             </svg>
                        //         </div>
                        //         <svg className="h-8 w-8 fill-current w-1/4" xmlns="http://www.w3.org/2000/svg"
                        //              height="24" viewBox="0 0 24 24" width="24">
                        //             <path d="M0 0h24v24H0V0z" fill="none"/>
                        //             <path
                        //                 d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495l1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96l1.41 1.41 1.79-1.8-1.41-1.41z"/>
                        //         </svg>
                        //         <span className="font-semibold text-lg w-1/4 text-right">21° / 32°</span>
                        //     </div>
                        //     <div className="flex justify-between items-center">
                        //         <span className="font-semibold text-lg w-1/4">Mon, 25 Jan</span>
                        //         <div className="flex items-center justify-end pr-10 w-1/4">
                        //             <span className="font-semibold">50%</span>
                        //             <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 16 20" version="1.1"
                        //                  xmlns="http://www.w3.org/2000/svg">
                        //                 <g transform="matrix(1,0,0,1,-4,-2)">
                        //                     <path
                        //                         d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z"
                        //                         style="fill-rule:nonzero;"/>
                        //                 </g>
                        //             </svg>
                        //         </div>
                        //         <svg className="h-8 w-8 fill-current w-1/4" xmlns="http://www.w3.org/2000/svg"
                        //              height="24" viewBox="0 0 24 24" width="24">
                        //             <path d="M0 0h24v24H0V0z" fill="none"/>
                        //             <path
                        //                 d="M12.01 6c2.61 0 4.89 1.86 5.4 4.43l.3 1.5 1.52.11c1.56.11 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3h-13c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.95 6 12.01 6m0-2C9.12 4 6.6 5.64 5.35 8.04 2.35 8.36.01 10.91.01 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96C18.68 6.59 15.65 4 12.01 4z"/>
                        //         </svg>
                        //         <span className="font-semibold text-lg w-1/4 text-right">18° / 29°</span>
                        //     </div>
                        //     <div className="flex justify-between items-center">
                        //         <span className="font-semibold text-lg w-1/4">Tue, 26 Jan</span>
                        //         <div className="flex items-center justify-center w-1/4">
                        //             <span className="font-semibold">80%</span>
                        //             <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 16 20" version="1.1"
                        //                  xmlns="http://www.w3.org/2000/svg">
                        //                 <g transform="matrix(1,0,0,1,-4,-2)">
                        //                     <path
                        //                         d="M17.66,8L12.71,3.06C12.32,2.67 11.69,2.67 11.3,3.06L6.34,8C4.78,9.56 4,11.64 4,13.64C4,15.64 4.78,17.75 6.34,19.31C7.9,20.87 9.95,21.66 12,21.66C14.05,21.66 16.1,20.87 17.66,19.31C19.22,17.75 20,15.64 20,13.64C20,11.64 19.22,9.56 17.66,8ZM6,14C6.01,12 6.62,10.73 7.76,9.6L12,5.27L16.24,9.65C17.38,10.77 17.99,12 18,14C18.016,17.296 14.96,19.809 12,19.74C9.069,19.672 5.982,17.655 6,14Z"
                        //                         style="fill-rule:nonzero;"/>
                        //                 </g>
                        //             </svg>
                        //         </div>
                        //         <svg className="h-8 w-8 fill-current w-1/4" xmlns="http://www.w3.org/2000/svg"
                        //              height="24" viewBox="0 0 24 24" width="24">
                        //             <path d="M0 0h24v24H0V0z" fill="none"/>
                        //             <path
                        //                 d="M12.01 6c2.61 0 4.89 1.86 5.4 4.43l.3 1.5 1.52.11c1.56.11 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3h-13c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.95 6 12.01 6m0-2C9.12 4 6.6 5.64 5.35 8.04 2.35 8.36.01 10.91.01 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96C18.68 6.59 15.65 4 12.01 4z"/>
                        //         </svg>
                        //         <span className="font-semibold text-lg w-1/4 text-right">20° / 29°</span>
                        //     </div>
                        //
                        // </div>
                        // )
                        //  return (<div key={index}><table><caption>Wetter vorschau</caption><thead><tr><th>Datum</th><th>Min</th><th>Max</th><th>Durchschnitt</th></tr></thead><tbody>{message.forecast.map((day, indexDay) => {
                        //      return (<tr key={index + ':' + indexDay}><td>{convertDateToString(new Date(day[0].day), 1, 0)}&nbsp;&nbsp;</td><td>{day[0].min}°C&nbsp;&nbsp;</td><td>{day[0].max}°C&nbsp;&nbsp;</td><td>{day[0].average}°C&nbsp;&nbsp;</td></tr>)
                        //  })}</tbody></table></div>)
                    }else if(message.weather){
                        return (
                            <div
                                className="w-2/3 max-w-screen-sm bg-white p-10 rounded-xl ring-8 ring-white ring-opacity-40">
                                <div className="flex justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-6xl font-bold" key={index}>{message.weather[0].average}°C</span>
                                        <span className="font-semibold mt-1 text-gray-500">Mudjimba, QLD</span>
                                    </div>
                                    <img
                                        src="/cloud-47591.png"
                                        className="h-24 w-24 "
                                         height="24" viewBox="0 0 24 24" width="24"
                                         />
                                </div>
                                <div className="flex justify-between mt-12">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-lg" key={index}>{message.weather[12].temperature}°C</span>
                                        <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                             src="/cloud-47591.png"
                                             height="24" viewBox="0 0 24 24" width="24">
                                        </img>
                                        <span className="font-semibold mt-1 text-sm">11:00</span>
                                        <span className="text-xs font-semibold text-gray-400">AM</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-lg" key={index}>{message.weather[14].temperature}°C</span>
                                        <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                             src="/cloud-47591.png"
                                             height="24" viewBox="0 0 24 24" width="24">
                                        </img>
                                        <span className="font-semibold mt-1 text-sm">1:00</span>
                                        <span className="text-xs font-semibold text-gray-400">PM</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-lg" key={index}>{message.weather[16].temperature}°C</span>
                                        <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                             src="/cloud-47591.png"
                                             height="24" viewBox="0 0 24 24" width="24">
                                        </img>
                                        <span className="font-semibold mt-1 text-sm">3:00</span>
                                        <span className="text-xs font-semibold text-gray-400">PM</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-lg" key={index}>{message.weather[18].temperature}°C</span>
                                        <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                             src="/cloud-47591.png"
                                             height="24" viewBox="0 0 24 24" width="24">
                                        </img>
                                        <span className="font-semibold mt-1 text-sm">5:00</span>
                                        <span className="text-xs font-semibold text-gray-400">PM</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-lg" key={index}>{message.weather[20].temperature}°C</span>
                                        <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                             src="/cloud-47591.png"
                                             height="24" viewBox="0 0 24 24" width="24">
                                        </img>
                                        <span className="font-semibold mt-1 text-sm">7:00</span>
                                        <span className="text-xs font-semibold text-gray-400">PM</span>
                                    </div>
                                </div>
                            </div>
                            // <div key={index}>
                            //     <p>Current day: {convertDateToString(new Date(message.weather[0].day), 1, 1)} : {message.weather[0].temperature}°C || Min: {message.weather[0].min}°C | Max: {message.weather[0].max}°C | Average: {message.weather[0].average}°C</p>
                            // </div>
                        )
                    }
                })}
            </main>
            <footer className="bg-white p-4 flex-shrink-0 font-minecraft">
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
