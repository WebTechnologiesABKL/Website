import React, {useRef} from 'react';
import {useState} from 'react';
import Head from 'next/head';
import {createGlobalStyle} from 'tailwind-styled-components';
import Script from "next/script";
import Image from "next/image";
import {useEffect} from 'react'
import io from 'socket.io-client'

let socket


const GlobalStyle = 'createGlobalStyle'

function convertDateToString(dateObject, date, time) {
    let dateString = "";
    if (date) {
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
        if (dateObject.getDate() < 10) {
            dateString += "0" + dateObject.getDate();
        } else {
            dateString += dateObject.getDate();
        }
        if (dateObject.getMonth() < 9) {
            dateString += ".0" + (dateObject.getMonth() + 1);
        } else {
            dateString += "." + (dateObject.getMonth() + 1);
        }
        dateString += "." + dateObject.getFullYear();
    }

    if (time) {
        if (dateObject.getHours() < 10) {
            dateString += " - 0" + dateObject.getHours();
        } else {
            dateString += " - " + dateObject.getHours();
        }

        if (dateObject.getMinutes() < 10) {
            dateString += ":0" + dateObject.getMinutes();
        } else {
            dateString += ":" + dateObject.getMinutes();
        }
    }

    return dateString;
}

function scrollToBottom() {
    let box = document.getElementById('box');
    box.scrollTop = box.scrollHeight;
}

function getIconImage(icon) {
    let iconImage = 'cloudy';

    switch (icon) {
        case "clear-day":
            iconImage = "icon_sunny";
            break;
        case "partly-cloudy-day":
            iconImage = "icon_partlyCloudy";
            break;
        case "partly-cloudy-night":
            iconImage = "icon_partlyCloudy";
            break;
        case "clear-night":
            iconImage = "icon_sunny";
            break;
        case "cloudy":
            iconImage = "icon_cloudy";
            break;
        case "sunny":
            iconImage = "icon_sunny";
            break;
        case "wind":
            iconImage = "icon_windy";
            break;
        case "fog":
            iconImage = "icon_foggy";
            break;
        case "rain":
            iconImage = "icon_rainy";
            break;
        case "snow":
            iconImage = "icon_snow";
            break;
        case "sleet":
            iconImage = "icon_sleet";
            break;
        case "thunderstorm":
            iconImage = "icon_thunderstorm";
            break;
    }

    return iconImage
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
        if (!socket || !socket.connected) {
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
                        if (new Date(hour.timestamp).getDay() !== currentDay.getDay() || (index + 1) == weather.weather.weather.length) {
                            weatherObject[0].average /= weatherObject[0].values
                            weatherObject[0].average = weatherObject[0].average.toFixed(1)
                            currentDay = new Date(hour.timestamp)
                            return false;
                        }
                        if (!weatherObject[0]) {
                            weatherObject[0] = {
                                min: null,
                                max: null,
                                maxRain: null,
                                average: 0.0,
                                values: 0,
                                day: new Date(hour.timestamp),
                                city: data.city,
                                country: data.country,
                                icon: null
                            }
                        }
                        if (!weatherObject[0].min || weatherObject[0].min > hour.temperature) {
                            weatherObject[0].min = hour.temperature
                        }
                        if (!weatherObject[0].max || weatherObject[0].max < hour.temperature) {
                            weatherObject[0].max = hour.temperature
                        }
                        if (!weatherObject[0].maxRain || weatherObject[0].maxRain < hour.precipitation) {
                            weatherObject[0].maxRain = hour.precipitation
                        }
                        if (!weatherObject[0].icon || new Date(weatherObject[0].timestamp).getHours() == 12) {
                            weatherObject[0].icon = hour.icon
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
                        if (!day.weather.title) {
                            day.weather.weather.forEach((hour, index) => {
                                if (new Date(hour.timestamp).getDay() !== currentDay.getDay()) {
                                    forecast[dayNumber][0].average /= forecast[dayNumber][0].values
                                    forecast[dayNumber][0].average = forecast[dayNumber][0].average.toFixed(1)
                                    forecast[dayNumber][0].averageCalculated = true
                                    currentDay = new Date(hour.timestamp)
                                    dayNumber++
                                    forecast.push([null])
                                    forecast[dayNumber][0] = null
                                }
                                if (!forecast[dayNumber][0]) {
                                    forecast[dayNumber][0] = {
                                        min: null,
                                        max: null,
                                        maxRain: null,
                                        average: 0.0,
                                        averageCalculated: false,
                                        values: 0,
                                        day: new Date(hour.timestamp),
                                        city: data.city,
                                        country: data.country,
                                        icon: null
                                    }
                                }
                                if (!forecast[dayNumber][0].min || forecast[dayNumber][0].min > hour.temperature) {
                                    forecast[dayNumber][0].min = hour.temperature
                                }
                                if (!forecast[dayNumber][0].max || forecast[dayNumber][0].max < hour.temperature) {
                                    forecast[dayNumber][0].max = hour.temperature
                                }
                                if (!forecast[dayNumber][0].maxRain || forecast[dayNumber][0].maxRain < hour.precipitation) {
                                    forecast[dayNumber][0].maxRain = hour.precipitation
                                }
                                if (!forecast[dayNumber][0].icon || new Date(forecast[dayNumber][0].timestamp).getHours() == 12) {
                                    forecast[dayNumber][0].icon = hour.icon
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
                    if (!forecast[dayNumber][0].averageCalculated) {
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

        function changeVideo(weather, time) {
            let icon = weather.weather.weather[0].icon
            let isDay = true
            if (time.getHours() < 5 || time.getHours() > 18) {
                isDay = false
            }
            switch (icon) {
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
                    if (isDay) {
                        setVideoName("Clear_day")
                    } else {
                        setVideoName("Clear_night")
                    }
                    break;
                case "sunny":
                    if (isDay) {
                        setVideoName("Clear_day")
                    } else {
                        setVideoName("Clear_night")
                    }
                    break;
                case "wind":
                    if (isDay) {
                        setVideoName("Clear_day")
                    } else {
                        setVideoName("Clear_night")
                    }
                    break;
                case "fog":
                    if (isDay) {
                        setVideoName("Rain_day")
                    } else {
                        setVideoName("Rain_night")
                    }
                    break;
                case "rain":
                    if (isDay) {
                        setVideoName("Rain_day")
                    } else {
                        setVideoName("Rain_night")
                    }
                    break;
                case "snow":
                    if (isDay) {
                        setVideoName("Snow_day")
                    } else {
                        setVideoName("Snow_night")
                    }
                    break;
                case "sleet":
                    if (isDay) {
                        setVideoName("Snow_day")
                    } else {
                        setVideoName("Snow_night")
                    }
                    break;
                case "thunderstorm":
                    if (isDay) {
                        setVideoName("Thunder_day")
                    } else {
                        setVideoName("Thunder_night")
                    }
                    break;
            }
        }

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input) {
            setMessages(currentArray => {
                return [...currentArray, {
                    text: input,
                    isUser: true,
                    writing: false,
                    image: null,
                    forecast: null,
                    weather: null
                }]
            });
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
                <div className="h-4/5 w-2/3 flex-col flex justify-center  bg-blue-500/50">
                    <header className="bg-white p-4 flex-shrink-0">
                        <h1 className="text-xl font-medium text-black font-minecraft">Chatbot</h1>
                    </header>
                    <main id="box" className="flex-1 overflow-y-scroll h-full justify-end overscroll-contain p-4">
                        {messages.map((message, index) => {
                            if (message.text) {
                                return (<div
                                    key={index}
                                    className={`bg-white p-2 mb-4 flex-shrink-0  w-fit w-min-3/4 text-black font-minecraft  ${
                                        message.isUser ? 'ml-auto rounded-bl-3xl text-right rounded-tl-3xl rounded-tr-xl' : 'mr-auto bg-slate-400 rounded-br-3xl rounded-tr-3xl rounded-tl-xl'
                                    }`}
                                >
                                    <p className="text-base">{message.text}</p>
                                </div>)
                            } else if (message.image) {
                                return (<div key={index}><img src={message.image}></img></div>)
                            } else if (message.forecast) {
                                return (
                                    <div key="forecast"
                                         className="flex flex-col space-y-6 w-2/3 max-w-screen-sm bg-white p-10 mt-10 rounded-xl ring-8 ring-white ring-opacity-40 text-black">
                                        {message.forecast.map((day, indexDay) => {
                                            if (indexDay != 0) {
                                                return (<div key={index + ':' + indexDay}
                                                             className="flex justify-between items-center">
                                                    <span
                                                        className="font-black text-sm w-1/4">{convertDateToString(new Date(day[0].day), true, false)}</span>
                                                    <div className="flex items-center justify-end w-1/4 pr-10">
                                                        <span className="font-semibold">{day[0].maxRain * 100}%</span>
                                                        <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                             src="/icon_rainDrop.png"
                                                             height="24" viewBox="0 0 24 24" width="24">
                                                        </img>
                                                    </div>
                                                    <img className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                         src={"/" + getIconImage(day[0].icon) + '.png'}
                                                         height="24" viewBox="0 0 24 24" width="24">
                                                    </img>
                                                    <span
                                                        className="font-semibold text-lg w-1/4 text-right">{day[0].min}°C / {day[0].max}°C</span>
                                                </div>)
                                            }
                                        })}
                                    </div>
                                )
                                //return (<div key={index}><table><caption>Wetter vorschau</caption><thead><tr><th>Datum</th><th>Min</th><th>Max</th><th>Durchschnitt</th></tr></thead><tbody>{message.forecast.map((day, indexDay) => {
                                //return (<tr key={index + ':' + indexDay}><td>{convertDateToString(new Date(day[0].day), 1, 0)}&nbsp;&nbsp;</td><td>{day[0].min}°C&nbsp;&nbsp;</td><td>{day[0].max}°C&nbsp;&nbsp;</td><td>{day[0].average}°C&nbsp;&nbsp;</td></tr>)
                                //})}</tbody></table></div>)
                            } else if (message.weather) {
                                return (
                                    <div key="weather first day"
                                         className="w-2/3 max-w-screen-sm bg-white p-10 rounded-xl ring-8 ring-white ring-opacity-40 text-black">
                                        <div className="flex justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-6xl font-bold"
                                                      key={index}>{message.weather[0].average}°C</span>
                                                <span className="font-semibold mt-1 text-gray-500"
                                                      key={index}>{message.weather[0].city}, {message.weather[0].country}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-4xl font-bold">{message.weather[0].maxRain * 100}%</span>
                                                <img className="h-20 w-20 fill-current text-gray-400 mt-3"
                                                     src="/icon_rainDrop.png"
                                                     height="24" viewBox="0 0 24 24" width="24">
                                                </img>
                                            </div>

                                            <img
                                                src={"/" + getIconImage(message.weather[0].icon) + '.png'}
                                                className="h-24 w-24 "
                                                height="24" viewBox="0 0 24 24" width="24">
                                            </img>
                                        </div>

                                        <div className="flex justify-between mt-12">

                                            {message.weather.map((hour, indexHour) => {
                                                    if (indexHour != 0) {
                                                        if (new Date(hour.timestamp).getHours() == 9) {
                                                            return (
                                                                <div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                    <img
                                                                        className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                                        src={"/" + getIconImage(hour.icon) + '.png'}
                                                                        height="24" viewBox="0 0 24 24" width="24">
                                                                    </img>
                                                                    <span
                                                                        className="font-semibold mt-1 text-sm">09:00</span>
                                                                    <span
                                                                        className="text-xs font-semibold text-gray-400">AM</span>
                                                                </div>
                                                            )
                                                        } else if (new Date(hour.timestamp).getHours() == 11) {
                                                            return (
                                                                <div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                    <img
                                                                        className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                                        src={"/" + getIconImage(hour.icon) + '.png'}
                                                                        height="24" viewBox="0 0 24 24" width="24">
                                                                    </img>
                                                                    <span
                                                                        className="font-semibold mt-1 text-sm">11:00</span>
                                                                    <span
                                                                        className="text-xs font-semibold text-gray-400">AM</span>
                                                                </div>
                                                            )
                                                        } else if (new Date(hour.timestamp).getHours() == 13) {
                                                            return (
                                                                <div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                    <img
                                                                        className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                                        src={"/" + getIconImage(hour.icon) + '.png'}
                                                                        height="24" viewBox="0 0 24 24" width="24">
                                                                    </img>
                                                                    <span
                                                                        className="font-semibold mt-1 text-sm">01:00</span>
                                                                    <span
                                                                        className="text-xs font-semibold text-gray-400">PM</span>
                                                                </div>
                                                            )
                                                        } else if (new Date(hour.timestamp).getHours() == 15) {
                                                            return (
                                                                <div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                    <img
                                                                        className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                                        src={"/" + getIconImage(hour.icon) + '.png'}
                                                                        height="24" viewBox="0 0 24 24" width="24">
                                                                    </img>
                                                                    <span
                                                                        className="font-semibold mt-1 text-sm">03:00</span>
                                                                    <span
                                                                        className="text-xs font-semibold text-gray-400">PM</span>
                                                                </div>
                                                            )
                                                        } else if (new Date(hour.timestamp).getHours() == 17) {
                                                            return (
                                                                <div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                    <img
                                                                        className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                                        src={"/" + getIconImage(hour.icon) + '.png'}
                                                                        height="24" viewBox="0 0 24 24" width="24">
                                                                    </img>
                                                                    <span
                                                                        className="font-semibold mt-1 text-sm">05:00</span>
                                                                    <span
                                                                        className="text-xs font-semibold text-gray-400">PM</span>
                                                                </div>
                                                            )
                                                        } else if (new Date(hour.timestamp).getHours() == 19) {
                                                            return (
                                                                <div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                    <img
                                                                        className="h-10 w-10 fill-current text-gray-400 mt-3"
                                                                        src={"/" + getIconImage(hour.icon) + '.png'}
                                                                        height="24" viewBox="0 0 24 24" width="24">
                                                                    </img>
                                                                    <span
                                                                        className="font-semibold mt-1 text-sm">07:00</span>
                                                                    <span
                                                                        className="text-xs font-semibold text-gray-400">PM</span>
                                                                </div>
                                                            )
                                                        }
                                                    }
                                                }
                                            )}

                                        </div>

                                    </div>
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
