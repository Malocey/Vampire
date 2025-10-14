import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

const introText = "Kälte... Die erste Empfindung ist eine beißende Kälte, die vom polierten Boden in deinen Rücken kriecht. Deine Augenlider flattern auf und enthüllen eine sterile weiße Decke. Wo bist du? Ein Name hallt in der Leere deines Geistes wider... Kaelen. Ist es deiner? Du setzt dich auf, dein Kopf pocht. Eine purpurrote Uniform ziert deinen Körper, unbekannt. Auf deinem Arm leuchten verschlungene Linien mit einem sanften, roten Licht... ein Brandmal. Eine Stimme, synthetisch und ruhig, spricht nicht zu deinen Ohren, sondern direkt in deine Gedanken: 'System online. Identitätsrekonstruktion erforderlich.'";

export const IntroScreen = () => {
    const { createNewPlayer } = usePlayerStore();
    
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        if (isTyping && typedText.length < introText.length) {
            const timeoutId = setTimeout(() => {
                setTypedText(introText.slice(0, typedText.length + 1));
            }, 25);
            return () => clearTimeout(timeoutId);
        } else if (isTyping) {
            setIsTyping(false);
        }
    }, [typedText, isTyping, introText]);

    const skipTyping = () => {
        setIsTyping(false);
        setTypedText(introText);
    };

    const renderButtons = () => {
        if (isTyping) {
            return <button className="intro-continue-btn" onClick={skipTyping}>Überspringen</button>;
        }
        return (
            <button className="intro-continue-btn" onClick={() => createNewPlayer(false)}>Spiel starten</button>
        );
    };

    return (
        <div className="intro-container">
            <p className="intro-text">{typedText}</p>
            <div className="intro-buttons">
                {renderButtons()}
            </div>
        </div>
    );
};