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
                                weatherObject[0].average = weatherObject[0].average.toFixed(2)
                                currentDay = new Date(hour.timestamp)
                                return false;
                            }
                            if(!weatherObject[0]){
                                weatherObject[0] = {
                                    min: null,
                                    max: null,
                                    average: 0.0,
                                    values: 0,
                                    day: new Date(hour.timestamp)
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
                                precipitation: hour.precipitation

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
                                    forecast[dayNumber][0].average = forecast[dayNumber][0].average.toFixed(2)
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
                                        day: new Date(hour.timestamp)
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
                                    precipitation: hour.precipitation

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
            <main className="flex-1 overflow-y-scroll h-full justify-end overscroll-contain p-4">
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
                        return (<div key={index}><table><caption>Wetter vorschau</caption><thead><tr><th>Datum</th><th>Min</th><th>Max</th><th>Durchschnitt</th></tr></thead><tbody>{message.forecast.map((day, indexDay) => {
                            return (<tr key={index + ':' + indexDay}><td>{convertDateToString(new Date(day[0].day), 1, 0)}&nbsp;&nbsp;</td><td>{day[0].min}°C&nbsp;&nbsp;</td><td>{day[0].max}°C&nbsp;&nbsp;</td><td>{day[0].average}°C&nbsp;&nbsp;</td></tr>)
                        })}</tbody></table></div>)
                    }else if(message.weather){
                        return (<div key={index}><p>Current day: {convertDateToString(new Date(message.weather[0].day), 1, 1)} : {message.weather[0].temperature}°C || Min: {message.weather[0].min}°C | Max: {message.weather[0].max}°C | Average: {message.weather[0].average}°C</p></div>)
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
