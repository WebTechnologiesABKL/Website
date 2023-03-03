import React, {useEffect, useRef, useState} from 'react';
import io from 'socket.io-client'

let socket


const GlobalStyle = 'createGlobalStyle'

//Yannick Bruns, Sarah Koch
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

//Tim-Lukas Arold
function scrollToBottom() {
    let box = document.getElementById('box');
    box.scrollTop = box.scrollHeight;
}

//Yannick Bruns, Sarah Koch
function getIconImage(icon) {
    let iconImage = 'icon_cloudy';

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

    const [videoMode, setVideoMode] = useState(true);
    let initialVideo = 'Clear_day'
    if (!videoMode) {
        initialVideo = 'minecraft'
    }
    const [videoName, setVideoName] = useState(initialVideo)


    useEffect(() => {
        socketInitializer(), []
    })

    useEffect(() => {
        videoRef.current?.load();
    }, [videoName]);

    const socketInitializer = async () => {
        if (!socket || !socket.connected) {
            socket = io('ws://' + process.env.SERVER + ':8085')

            //Tim-Lukas Arold, Sarah Koch
            socket.on('connect', () => {
                console.log('Connected')
            })

            //Tim-Lukas Arold, Sarah Koch
            socket.on('disconnect', () => {
                console.log('Disconnected')
            })

            //Tim-Lukas Arold, Sarah Koch
            socket.on("welcome", function (data) {
                let message = data.message
                setMessages(currentArray => {
                    return [...currentArray, {
                        text: message, isUser: false, writing: false, image: null, forecast: null, weather: null
                    }]
                });
                setTimeout(() => {
                    scrollToBottom();
                }, 100)
            })

            //Sarah Koch
            socket.on("chat", function (data) {
                let message = data.message
                setMessages(currentArray => {
                    return [...currentArray, {
                        text: message, isUser: false, writing: false, image: null, forecast: null, weather: null
                    }]
                });
                if (data.weather) {
                    let weather = data.weather
                    let time = new Date(data.time)
                    changeVideo(data.videoWeather, time)
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
                            weatherObject[0].maxRain = hour.precipitation.toFixed(2)
                        }
                        if (!weatherObject[0].icon || new Date(hour.timestamp).getHours() == 12) {
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
                setTimeout(() => {
                    scrollToBottom();
                }, 100)
            })

            //Sarah Koch
            socket.on("image", function (data) {
                if (data.image) {
                    console.log(data.image)
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: null, isUser: false, writing: false, image: data.image, forecast: null, weather: null
                        }]
                    });
                    setTimeout(() => {
                        scrollToBottom();
                    }, 100)
                }
            })

            //Tim-Lukas Arold, Sarah Koch
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
                                    forecast[dayNumber][0].maxRain = hour.precipitation.toFixed(2)
                                }
                                if (!forecast[dayNumber][0].icon || new Date(hour.timestamp).getHours() == 12) {
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
                        forecast[dayNumber][0].average = forecast[dayNumber][0].average.toFixed(1)
                        forecast[dayNumber][0].averageCalculated = true
                    }

                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: null, isUser: false, writing: false, image: null, forecast: forecast, weather: null
                        }]
                    });
                    scrollToBottom();
                    setTimeout(() => {
                        scrollToBottom();
                    }, 100)
                }
            })

            //Sarah Koch
            socket.on("writing", function (data) {
                if (data.active) {
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: "...", isUser: false, writing: true, image: null, forecast: null, weather: null
                        }]
                    });
                } else {
                    setMessages((currentArray) => currentArray.filter((item) => !item.writing));
                }
                setTimeout(() => {
                    scrollToBottom();
                }, 100)
            })
        }

        //Tim-Lukas Arold, Sarah Koch
        function changeVideo(weather, time) {
            if (videoMode) {
                let icon = weather.weather.weather[0].icon
                let isDay = true
                if (time.getHours() < 5 || time.getHours() > 18) {
                    isDay = false
                }
                switch (icon) {
                    case "clear-day":
                        if (isDay) {
                            setVideoName("Clear_day")
                        } else {
                            setVideoName("Clear_night")
                        }
                        break;
                    case "partly-cloudy-day":
                        if (isDay) {
                            setVideoName("Clear_day")
                        } else {
                            setVideoName("Clear_night")
                        }
                        break;
                    case "partly-cloudy-night":
                        if (isDay) {
                            setVideoName("Clear_day")
                        } else {
                            setVideoName("Clear_night")
                        }
                        break;
                    case "clear-night":
                        if (isDay) {
                            setVideoName("Clear_day")
                        } else {
                            setVideoName("Clear_night")
                        }
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
            } else {
                setVideoName("minecraft")
            }
        }
    }

    //Tim-Lukas Arold
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input) {
            if (input.charAt(0) == "/") {
                setMessages(currentArray => {
                    return [...currentArray, {
                        text: input, isUser: true, writing: false, image: null, forecast: null, weather: null
                    }]
                });
                let command = input.split("/")[1].split(" ")[0];
                if (command == "setWeather") {
                    let value = input.split("/")[1].split(" ")[1];
                    if (!value) {
                        value = '';
                    }
                    let response = "";
                    if (videoMode) {

                        switch (value) {
                            case 'thunder_night':
                                setVideoName("Thunder_night");
                                response = "Hintergrundvideo zu Gewitter bei Nacht geändert!"
                                break;
                            case 'thunder_day':
                                setVideoName("Thunder_day");
                                response = "Hintergrundvideo zu Gewitter bei Tag geändert!"
                                break;
                            case 'clear_day':
                                setVideoName("Clear_day");
                                response = "Hintergrundvideo zu Klar bei Tag geändert!"
                                break;
                            case 'clear_night':
                                setVideoName("Clear_night");
                                response = "Hintergrundvideo zu Klar bei Nacht geändert!"
                                break;
                            case 'snow_day':
                                setVideoName("Snow_day");
                                response = "Hintergrundvideo zu Schnee bei Tag geändert!"
                                break;
                            case 'snow_night':
                                setVideoName("Snow_night");
                                response = "Hintergrundvideo zu Schnee bei Nacht geändert!"
                                break;
                            case 'rain_day':
                                setVideoName("Rain_day");
                                response = "Hintergrundvideo zu Regen bei Tag geändert!"
                                break;
                            case 'rain_night':
                                setVideoName("Rain_night");
                                response = "Hintergrundvideo zu Regen bei Nacht geändert!"
                                break;
                            default:
                                response = "Unbekannter Parameter '" + value + "', benutzen Sie '/help' für weitere Informationen!"
                                break;
                        }
                    } else {
                        response = "Videomodus ist nicht aktiviert!"
                        setVideoName("minecraft")
                    }
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: response, isUser: false, writing: false, image: null, forecast: null, weather: null
                        }]
                    });
                    scrollToBottom();

                } else if (command == "toggleVideo") {
                    setVideoMode(!videoMode);
                    if (videoMode) {
                        setVideoName("clear_day")
                    } else {
                        setVideoName("minecraft")
                    }
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: "VideoMode ist jetzt " + videoMode + "!",
                            isUser: false,
                            writing: false,
                            image: null,
                            forecast: null,
                            weather: null
                        }]
                    })
                    scrollToBottom();
                } else if (command == "creeper") {
                    let lastVideo = videoName;
                    setVideoName("creeper");
                    setTimeout(() => {
                        setVideoName(lastVideo);
                    }, 9000)
                }else if (command == "help") {
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: "Folgen Kommandos sind möglich:" + "/setWeather [value] | (Setzt das Hintergrundvideo auf ein bestimmtes Wetter) | \n" + "[value] || clear_day | clear_night | rain_day | rain_night | snow_day | snow_night | thunder_day | thunder_night | \n",
                            isUser: false,
                            writing: false,
                            image: null,
                            forecast: null,
                            weather: null
                        }]
                    });
                    scrollToBottom();
                } else {
                    setMessages(currentArray => {
                        return [...currentArray, {
                            text: "Unbekanntes Kommando benutze '/help' für Hilfe",
                            isUser: false,
                            writing: false,
                            image: null,
                            forecast: null,
                            weather: null
                        }]
                    });
                    scrollToBottom();
                }
            } else {
                setMessages(currentArray => {
                    return [...currentArray, {
                        text: input, isUser: true, writing: false, image: null, forecast: null, weather: null
                    }]
                });
                socket.emit('chat', {
                    'message': input
                })
            }
            setTimeout(() => {
                scrollToBottom();
            }, 100)
            setInput('');
        }
    };

    //Tim-Lukas Arold
    return (<div className="h-screen flex flex-col bg-cover bg-no-repeat bg-fixed bg-center">
            <video autoPlay muted loop playsinline className="video" ref={videoRef}>
                <source src={"/" + videoName + ".mp4"} type="video/mp4"/>
            </video>

            <div className="h-full flex items-center justify-center">
                <div className="h-4/5 w-5/6 sm:w-2/3 flex-col flex justify-center  bg-blue-500/50">
                    <header className="bg-white p-4 flex-shrink-0">
                        <h1 className="text-xl font-medium text-black font-minecraft">Chatbot</h1>
                    </header>
                    <main id="box" className="flex-1 overflow-y-scroll h-full justify-end overscroll-contain p-4">
                        {messages.map((message, index) => {
                            if (message.text) {
                                return (<div
                                    key={index}
                                    className={`bg-white p-2 mb-4 flex-shrink-0  w-fit w-min-3/4 text-black font-minecraft  ${message.isUser ? 'ml-auto rounded-bl-3xl text-right rounded-tl-3xl rounded-tr-xl' : 'mr-auto bg-slate-400 rounded-br-3xl rounded-tr-3xl rounded-tl-xl'}`}
                                >
                                    <p className="text-base">{message.text}</p>
                                </div>)
                            } else if (message.image) {
                                return (<div key={index}><img src={message.image}></img></div>)
                            } else if (message.forecast) {
                                return (<div key="forecast"
                                             className="flex flex-col space-y-6 w-full md:w-2/3 md: max-w-screen-sm bg-white p-2 md:p-10 mt-5 md:mt-10 rounded-xl ring-8 ring-white ring-opacity-40 text-black">
                                        {message.forecast.map((day, indexDay) => {
                                            if (indexDay !== 0) {
                                                return (<div key={index + ':' + indexDay}
                                                             className="flex justify-between items-center">
                                                    <span
                                                        className="font-black text-xs md:text-sm w-1/4">{convertDateToString(new Date(day[0].day), true, false)}</span>
                                                    <div className="flex items-center w-1/4 pr-10">
                                                        <span className="font-semibold">{day[0].maxRain}mm</span>
                                                        <img className="h-5 md:h-10 w-5 md:w-10 fill-current text-gray-400 mt-3"
                                                             src="/icon_rainDrop.png"
                                                             height="24" viewBox="0 0 24 24" width="24">
                                                        </img>
                                                    </div>
                                                    <img className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                         src={"/" + getIconImage(day[0].icon) + '.png'}
                                                         height="24" viewBox="0 0 24 24" width="24">
                                                    </img>
                                                    <span
                                                        className="font-semibold text-xs md:text-lg w-1/4 text-right">{day[0].min}°C / {day[0].max}°C</span>
                                                </div>)
                                            }
                                        })}
                                    </div>)
                            } else if (message.weather) {
                                return (<div key="weather first day"
                                             className="w-full md:w-2/3 md:max-w-screen-sm bg-white p-2 md:p-10 rounded-xl ring-8 ring-white ring-opacity-40 text-black">
                                        <div className="flex justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-2xl md:text-6xl font-bold"
                                                      key={index}>{message.weather[0].average}°C</span>
                                                <span className="text-xs md:text-md font-semibold mt-1 text-gray-500"
                                                      key={index}>{message.weather[0].city}, {message.weather[0].country}</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-between w-1/4 pr-10">
                                                <span
                                                    className="text-xl md:text-4xl font-semibold">{message.weather[0].maxRain}mm</span>
                                                <img className="h-10 smd:h-30 w-10 md:w-30 fill-current"
                                                     src="/icon_rainDrop.png"
                                                     alt="raindrop"
                                                     height="30" width="30">
                                                </img>
                                            </div>

                                            <img
                                                src={"/" + getIconImage(message.weather[0].icon) + '.png'}
                                                className="h-20 md:h-24 w-20 md:w-24 "
                                                height="24" width="24">
                                            </img>
                                        </div>

                                        <div className="flex justify-between mt-12 w-full">

                                            {message.weather.map((hour, indexHour) => {
                                                if (indexHour !== 0) {
                                                    if (new Date(hour.timestamp).getHours() == 9) {
                                                        return (<div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-sm md:text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                <img
                                                                    className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                                    src={"/" + getIconImage(hour.icon) + '.png'}
                                                                    height="24" viewBox="0 0 24 24" width="24">
                                                                </img>
                                                                <span
                                                                    className="font-semibold mt-1 text-xs md:text-sm">09:00</span>
                                                                <span
                                                                    className="text-xs font-semibold text-gray-400">AM</span>
                                                            </div>)
                                                    } else if (new Date(hour.timestamp).getHours() == 11) {
                                                        return (<div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-sm md:text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                <img
                                                                    className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                                    src={"/" + getIconImage(hour.icon) + '.png'}
                                                                    height="24" viewBox="0 0 24 24" width="24">
                                                                </img>
                                                                <span
                                                                    className="font-semibold mt-1 text-xs md:text-sm">11:00</span>
                                                                <span
                                                                    className="text-xs font-semibold text-gray-400">AM</span>
                                                            </div>)
                                                    } else if (new Date(hour.timestamp).getHours() == 13) {
                                                        return (<div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-sm md:text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                <img
                                                                    className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                                    src={"/" + getIconImage(hour.icon) + '.png'}
                                                                    height="24" viewBox="0 0 24 24" width="24">
                                                                </img>
                                                                <span
                                                                    className="font-semibold mt-1 text-xs md:text-sm">01:00</span>
                                                                <span
                                                                    className="text-xs font-semibold text-gray-400">PM</span>
                                                            </div>)
                                                    } else if (new Date(hour.timestamp).getHours() == 15) {
                                                        return (<div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-sm md:text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                <img
                                                                    className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                                    src={"/" + getIconImage(hour.icon) + '.png'}
                                                                    height="24" viewBox="0 0 24 24" width="24">
                                                                </img>
                                                                <span
                                                                    className="font-semibold mt-1 text-xs md:text-sm">03:00</span>
                                                                <span
                                                                    className="text-xs font-semibold text-gray-400">PM</span>
                                                            </div>)
                                                    } else if (new Date(hour.timestamp).getHours() == 17) {
                                                        return (<div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-sm md:text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                <img
                                                                    className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                                    src={"/" + getIconImage(hour.icon) + '.png'}
                                                                    height="24" viewBox="0 0 24 24" width="24">
                                                                </img>
                                                                <span
                                                                    className="font-semibold mt-1 text-xs md:text-sm">05:00</span>
                                                                <span
                                                                    className="text-xs font-semibold text-gray-400">PM</span>
                                                            </div>)
                                                    } else if (new Date(hour.timestamp).getHours() == 19) {
                                                        return (<div key={index + ":" + indexHour}
                                                                     className="flex flex-col items-center">
                                                                    <span className="font-semibold text-sm md:text-lg"
                                                                          key={index}>{hour.temperature}°C</span>
                                                                <img
                                                                    className="h-7 md:h-10 w-7 md:w-10 fill-current text-gray-400 mt-3"
                                                                    src={"/" + getIconImage(hour.icon) + '.png'}
                                                                    height="24" viewBox="0 0 24 24" width="24">
                                                                </img>
                                                                <span
                                                                    className="font-semibold mt-1 text-xs md:text-sm">07:00</span>
                                                                <span
                                                                    className="text-xs font-semibold text-gray-400">PM</span>
                                                            </div>)
                                                    }
                                                }
                                            })}

                                        </div>

                                    </div>)
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
        </div>);
}
