import React from "react";
import Image from "next/image";
import "./Header.css";
// import logo from "@/public/logo-sideways.svg";
import logo from "@/public/01_RR_Large.png";
import helpTooltip from "@/public/help-tooltip-fix.svg";


const Header = ({ onLogoClick, onHelpClick, text="Randomization in the literature" }) => {
    const handleLogoClick = () => {
        if (onLogoClick) {
            console.log("Logo clicked, calling onLogoClick");
            onLogoClick();
        } else {
            console.log("No onLogoClick function provided");
        }
    };

    const handleHelpClick = () => {
        if (onHelpClick) {
            console.log("Help clicked, calling onHelpClick");
            onHelpClick();
        } else {
            console.log("No onHelpClick function provided");
        }
    };



    return (
        <header className="header-container">
            <div className="header-bar">
                <Image
                    src={logo}
                    alt="Logo"
                    className="logo logo-mobile clickable-logo"
                    onClick={handleLogoClick}
                />

                <div className="logo-desktop">
                    <Image
                        src={logo}
                        alt="Logo"
                        className="logo clickable-logo"
                        onClick={handleLogoClick}
                    />
                    <h1 className="header-title">  {text} </h1>
                    <button className="header-guide-button" onClick={handleHelpClick}>
                        {/* SVG here */}
                        {/* <img src={helpTooltip} alt="Guide" className="help-tooltip-image" /> */}
                        <Image src={helpTooltip} alt="Guide" className="help-tooltip-image" />
                    </button>
                </div>
            </div>
         
        </header>
    );
};

export default Header;